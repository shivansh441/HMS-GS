import type { Request, Response } from 'express';
import { FoodOrderStatus, MealType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { logAction } from '../services/audit.service.js';

const propertyIdFrom = (req: Request) => Number(req.params.propertyId);

const ensurePropertyType = async (propertyId: number, type: 'HOSTEL' | 'HOTEL') => {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { type: true } });
  if (!property) return 'NOT_FOUND';
  const isHotel = property.type === 'HOTEL';
  if ((type === 'HOTEL') !== isHotel) return 'WRONG_TYPE';
  return null;
};

export const getHostelMenu = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const typeError = await ensurePropertyType(propertyId, 'HOSTEL');
  if (typeError === 'NOT_FOUND') return res.status(404).json({ error: 'Property not found.' });
  if (typeError) return res.status(400).json({ error: 'Hostel menus are only available for hostel properties.' });

  const weekStart = req.query.weekStart ? new Date(String(req.query.weekStart)) : undefined;
  const menus = await prisma.hostelWeeklyMenu.findMany({
    where: { propertyId, ...(weekStart ? { weekStart } : {}) },
    include: { items: { orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }] } },
    orderBy: [{ isPermanent: 'desc' }, { weekStart: 'desc' }],
  });
  return res.json(menus);
};

export const saveHostelMenu = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const typeError = await ensurePropertyType(propertyId, 'HOSTEL');
  if (typeError) return res.status(typeError === 'NOT_FOUND' ? 404 : 400).json({ error: typeError === 'NOT_FOUND' ? 'Property not found.' : 'Hostel menus are only available for hostel properties.' });
  const { id, weekStart, suggestedMessPrice, isPermanent = false, isPublished = false, items = [] } = req.body;
  if (!isPermanent && !weekStart) return res.status(400).json({ error: 'weekStart is required for a weekly menu.' });
  if (suggestedMessPrice !== undefined && Number(suggestedMessPrice) < 0) return res.status(400).json({ error: 'suggestedMessPrice must be zero or greater.' });
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Menu items must be an array.' });

  const menu = await prisma.$transaction(async (tx) => {
    const existing = id
      ? await tx.hostelWeeklyMenu.findFirst({ where: { id: Number(id), propertyId } })
      : isPermanent
        ? await tx.hostelWeeklyMenu.findFirst({ where: { propertyId, isPermanent: true } })
        : weekStart
          ? await tx.hostelWeeklyMenu.findFirst({ where: { propertyId, weekStart: new Date(weekStart) } })
          : null;
    const saved = existing
      ? await tx.hostelWeeklyMenu.update({ where: { id: existing.id }, data: { weekStart: weekStart ? new Date(weekStart) : null, ...(suggestedMessPrice === undefined ? {} : { suggestedMessPrice: new Prisma.Decimal(suggestedMessPrice) }), isPermanent, isPublished } })
      : await tx.hostelWeeklyMenu.create({ data: { propertyId, weekStart: weekStart ? new Date(weekStart) : null, suggestedMessPrice: suggestedMessPrice === undefined ? null : new Prisma.Decimal(suggestedMessPrice), isPermanent, isPublished } });
    await tx.hostelMenuItem.deleteMany({ where: { menuId: saved.id } });
    if (items.length) {
      await tx.hostelMenuItem.createMany({
        data: items.map((item: any) => ({
          menuId: saved.id,
          dayOfWeek: Number(item.dayOfWeek),
          mealType: item.mealType as MealType,
          name: String(item.name).trim(),
          description: item.description ? String(item.description).trim() : null,
          isAvailable: item.isAvailable !== false,
        })),
      });
    }
    return tx.hostelWeeklyMenu.findUniqueOrThrow({ where: { id: saved.id }, include: { items: true } });
  });
  return res.status(id ? 200 : 201).json(menu);
};

export const getMealAssignments = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const assignments = await prisma.hostelMealAssignment.findMany({
    where: { propertyId, isActive: true },
    include: { account: { select: { id: true, firstName: true, lastName: true, email: true } }, menu: { select: { id: true, weekStart: true, isPermanent: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(assignments);
};

export const assignMessFacility = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const { accountId, menuId, startDate, endDate, monthlyRate } = req.body;
  if (!accountId || !menuId || !startDate) return res.status(400).json({ error: 'accountId, menuId, and startDate are required.' });
  const [menu, account] = await Promise.all([
    prisma.hostelWeeklyMenu.findFirst({ where: { id: Number(menuId), propertyId } }),
    prisma.account.findUnique({ where: { id: Number(accountId) }, select: { id: true, customerType: true } }),
  ]);
  if (!menu) return res.status(404).json({ error: 'Hostel menu not found.' });
  if (!account || account.customerType === 'NONE') return res.status(400).json({ error: 'A valid resident account is required.' });
  if (menu.suggestedMessPrice === null) return res.status(400).json({ error: 'Set the suggested mess price before assigning the facility.' });
  const agreedMonthlyRate = monthlyRate ?? menu.suggestedMessPrice;
  if (agreedMonthlyRate === null || agreedMonthlyRate === undefined || Number(agreedMonthlyRate) <= 0) return res.status(400).json({ error: 'A valid resident monthly mess rate is required.' });
  const assignment = await prisma.$transaction(async (tx) => {
    const saved = await tx.hostelMealAssignment.upsert({
      where: { accountId_menuId: { accountId: Number(accountId), menuId: Number(menuId) } },
      update: { monthlyRate: new Prisma.Decimal(agreedMonthlyRate), startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, isActive: true },
      create: { propertyId, accountId: Number(accountId), menuId: Number(menuId), monthlyRate: new Prisma.Decimal(agreedMonthlyRate), startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null },
    });
    const residentAssignment = await tx.unitAssignment.findFirst({
      where: { accountId: Number(accountId), unit: { propertyId }, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!residentAssignment) throw new Error('RESIDENT_ASSIGNMENT_NOT_FOUND');
    return saved;
  });
  return res.status(201).json(assignment);
};

export const getFoodMenu = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const typeError = await ensurePropertyType(propertyId, 'HOTEL');
  if (typeError) return res.status(typeError === 'NOT_FOUND' ? 404 : 400).json({ error: typeError === 'NOT_FOUND' ? 'Property not found.' : 'Food menus are only available for hotel properties.' });
  return res.json(await prisma.foodMenuItem.findMany({ where: { propertyId, isDeleted: false }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }));
};

export const saveFoodMenuItem = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const { id, name, description, category, price, taxRate = 0, isAvailable = true } = req.body;
  if (!name || price === undefined || Number(price) < 0) return res.status(400).json({ error: 'Name and a valid price are required.' });
  const data = { name: String(name).trim(), description: description ? String(description).trim() : null, category: category ? String(category).trim() : null, price: new Prisma.Decimal(price), taxRate: new Prisma.Decimal(taxRate), isAvailable: Boolean(isAvailable) };
  if (id) {
    const updated = await prisma.foodMenuItem.updateMany({ where: { id: Number(id), propertyId, isDeleted: false }, data });
    if (!updated.count) return res.status(404).json({ error: 'Food menu item not found.' });
    return res.json(await prisma.foodMenuItem.findUniqueOrThrow({ where: { id: Number(id) } }));
  }
  return res.status(201).json(await prisma.foodMenuItem.create({ data: { propertyId, ...data } }));
};

export const getFoodOrders = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  return res.json(await prisma.foodOrder.findMany({ where: { propertyId }, include: { items: true, account: { select: { firstName: true, lastName: true } }, reservation: { select: { id: true, guestName: true, status: true } } }, orderBy: { createdAt: 'desc' } }));
};

export const createFoodOrder = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const { reservationId, items = [], notes } = req.body;
  if (!reservationId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'A staying guest and at least one food item are required.' });
  const reservation = await prisma.reservationRequest.findFirst({ where: { id: Number(reservationId), propertyId, status: 'CONVERTED' }, include: { unitAssignments: { where: { isActive: true, actualCheckIn: { not: null }, actualCheckOut: null }, orderBy: { id: 'asc' } } } });
  if (!reservation || !reservation.unitAssignments[0]) return res.status(400).json({ error: 'Food can only be ordered for a currently staying guest.' });
  const ids = items.map((item: any) => Number(item.menuItemId));
  const menuItems = await prisma.foodMenuItem.findMany({ where: { propertyId, id: { in: ids }, isDeleted: false, isAvailable: true } });
  if (menuItems.length !== ids.length) return res.status(400).json({ error: 'One or more food items are unavailable.' });

  const lines = items.map((item: any) => {
    const menuItem = menuItems.find((candidate) => candidate.id === Number(item.menuItemId))!;
    const quantity = Math.max(1, Number(item.quantity));
    const lineTotal = menuItem.price.mul(quantity);
    const tax = lineTotal.mul(menuItem.taxRate).div(100);
    return { menuItemId: menuItem.id, itemNameSnapshot: menuItem.name, unitPriceSnapshot: menuItem.price, taxRateSnapshot: menuItem.taxRate, quantity, lineTotal, tax };
  });
  const subtotal = lines.reduce((sum, line) => sum.add(line.lineTotal), new Prisma.Decimal(0));
  const taxAmount = lines.reduce((sum, line) => sum.add(line.tax), new Prisma.Decimal(0));
  const totalAmount = subtotal.add(taxAmount);
  const assignment = reservation.unitAssignments[0];
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.foodOrder.create({ data: { propertyId, reservationId: reservation.id, unitAssignmentId: assignment.id, accountId: assignment.accountId, notes: notes ? String(notes) : null, subtotal, taxAmount, totalAmount, items: { create: lines.map(({ tax, ...line }) => line) } }, include: { items: true } });
    await tx.financialLedger.create({ data: { propertyId, accountId: assignment.accountId, reservationId: reservation.id, unitAssignmentId: assignment.id, folioType: 'INCIDENTAL', category: 'FOOD_AND_BEVERAGE', transactionType: 'INCOME', description: `Food order #${created.id}`, subTotal: subtotal, taxAmount, totalAmount, status: 'UNPAID' } });
    return created;
  });
  await logAction(req, 'FOOD_ORDER', order.id, 'ORDER_PLACED', { reservationId: reservation.id, totalAmount: totalAmount.toString() });
  return res.status(201).json(order);
};

export const updateFoodOrderStatus = async (req: Request, res: Response) => {
  const propertyId = propertyIdFrom(req);
  const status = req.body.status as FoodOrderStatus;
  if (!Object.values(FoodOrderStatus).includes(status)) return res.status(400).json({ error: 'Invalid food order status.' });
  const result = await prisma.foodOrder.updateMany({ where: { id: Number(req.params.orderId), propertyId }, data: { status } });
  if (!result.count) return res.status(404).json({ error: 'Food order not found.' });
  return res.json(await prisma.foodOrder.findUniqueOrThrow({ where: { id: Number(req.params.orderId) }, include: { items: true } }));
};