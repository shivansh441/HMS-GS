import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { logAction } from '../services/audit.service.js';
import { BlockReason } from '@prisma/client';

const MAX_BLOCK_DURATION_DAYS = 180; // 6 months maximum limit
const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 hour grace period for past dates

/**
 * @route   GET /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Fetch all blocks for a unit (Calendar View)
 */
export const getUnitBlocks = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const unitId = parseInt(req.params.unitId as string, 10);
    if (isNaN(propertyId) || isNaN(unitId)) return res.status(400).json({ error: 'Invalid ID parameters.' });

    const blocks = await prisma.unitBlock.findMany({
      where: { unitId },
      orderBy: { startDate: 'desc' }
    });

    return res.status(200).json(blocks);
  } catch (error) {
    console.error('[BlockController: getUnitBlocks]', error);
    return res.status(500).json({ error: 'Failed to fetch unit blocks.' });
  }
};

/**
 * @route   POST /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Schedule an emergency or maintenance block
 */
export const createUnitBlock = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const unitId = parseInt(req.params.unitId as string, 10);
    if (isNaN(propertyId) || isNaN(unitId)) return res.status(400).json({ error: 'Invalid ID parameters.' });

    const { reason, description, startDate, endDate } = req.body;

    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Reason, startDate, and endDate are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // EDGE CASE 2: Date Sanity & The Time Traveler Bug
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'Invalid date formats.' });
    if (end <= start) return res.status(400).json({ error: 'End date must strictly be after the start date.' });
    if (start.getTime() < (now.getTime() - GRACE_PERIOD_MS)) {
      return res.status(400).json({ error: 'Cannot schedule blocks in the past. Modify a historical record via admin overrides if necessary.' });
    }

    // EDGE CASE 3: Fat-Finger Duration Limit
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > MAX_BLOCK_DURATION_DAYS) {
      return res.status(400).json({ error: `Block exceeds maximum allowed duration of ${MAX_BLOCK_DURATION_DAYS} days. Decommission the unit instead.` });
    }

    // EDGE CASE 6: The Orphaned Unit Trap
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, propertyId }
    });
    if (!unit) return res.status(404).json({ error: 'Target unit not found, belongs to another property, or is deactivated.' });

    // EDGE CASE 1 & 5: Time-Aware Occupied Trap (Strict Overlap)
    const conflictingAssignment = await prisma.unitAssignment.findFirst({
      where: {
        unitId,
        isActive: true,
        expectedCheckIn: { lt: end },
        expectedCheckOut: { gt: start }
      }
    });

    if (conflictingAssignment) return res.status(409).json({ error: 'Conflict: This unit has an active guest reservation during these dates.' });

    // EDGE CASE 5: Double-Block Trap
    const conflictingBlock = await prisma.unitBlock.findFirst({
      where: {
        unitId,
        startDate: { lt: end },
        endDate: { gt: start }
      }
    });

    if (conflictingBlock) return res.status(409).json({ error: `Conflict: Unit already blocked for ${conflictingBlock.reason} during this timeframe.` });

    // Execute
    const block = await prisma.unitBlock.create({
      data: {
        unitId,
        reason: reason as BlockReason,
        description,
        startDate: start,
        endDate: end
      }
    });

    // Status Sync
    if (start <= now && end >= now) {
      await prisma.unit.update({ where: { id: unitId }, data: { status: 'MAINTENANCE' } });
    }

    await logAction(req, 'UNIT_BLOCK', block.id, 'CREATE_BLOCK', { unitId, reason, start, end });
    return res.status(201).json({ message: 'Block scheduled successfully.', block });

  } catch (error) {
    console.error('[BlockController: createUnitBlock]', error);
    return res.status(500).json({ error: 'Failed to schedule unit block.' });
  }
};

/**
 * @route   PATCH /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Extend or modify an active/future block
 */
export const updateUnitBlock = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const unitId = parseInt(req.params.unitId as string, 10);
    const blockId = parseInt(req.params.blockId as string, 10);
    if (isNaN(propertyId) || isNaN(unitId) || isNaN(blockId)) return res.status(400).json({ error: 'Invalid ID parameters.' });

    const { endDate, description } = req.body;
    const now = new Date();

    const block = await prisma.unitBlock.findFirst({
      where: { id: blockId, unitId },
      include: { unit: true } // Ensure unit matches propertyId below
    });

    if (!block || block.unit.propertyId !== propertyId) return res.status(404).json({ error: 'Block or Unit not found.' });

    // EDGE CASE 4: Historical Immutability
    if (block.endDate < now) {
      return res.status(403).json({ error: 'Historical blocks cannot be modified. They are preserved for audit purposes.' });
    }

    if (!endDate) return res.status(400).json({ error: 'New endDate is required to update a block.' });

    const newEnd = new Date(endDate);
    if (isNaN(newEnd.getTime()) || newEnd <= block.startDate) {
      return res.status(400).json({ error: 'End date must be a valid future date after the block start date.' });
    }

    // Check Duration Limit
    const durationDays = (newEnd.getTime() - block.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays > MAX_BLOCK_DURATION_DAYS) {
      return res.status(400).json({ error: `Block exceeds maximum allowed duration of ${MAX_BLOCK_DURATION_DAYS} days.` });
    }

    // Check Overlaps (Exclude self)
    const conflictingBlock = await prisma.unitBlock.findFirst({
      where: {
        id: { not: blockId },
        unitId,
        startDate: { lt: newEnd },
        endDate: { gt: block.startDate }
      }
    });

    if (conflictingBlock) return res.status(409).json({ error: 'Extension conflicts with another scheduled block.' });

    const updatedBlock = await prisma.unitBlock.update({
      where: { id: blockId },
      data: { endDate: newEnd, description: description || block.description }
    });

    // Re-sync status if the extension brings the block into the "present"
    if (updatedBlock.startDate <= now && updatedBlock.endDate >= now && block.unit.status === 'AVAILABLE') {
       await prisma.unit.update({ where: { id: unitId }, data: { status: 'MAINTENANCE' } });
    }

    await logAction(req, 'UNIT_BLOCK', blockId, 'UPDATE_BLOCK', { newEndDate: newEnd });
    return res.status(200).json({ message: 'Block updated successfully.', block: updatedBlock });

  } catch (error) {
    console.error('[BlockController: updateUnitBlock]', error);
    return res.status(500).json({ error: 'Failed to update unit block.' });
  }
};

/**
 * @route   DELETE /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Lift a unit block early
 */
export const removeUnitBlock = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    const unitId = parseInt(req.params.unitId as string, 10);
    const blockId = parseInt(req.params.blockId as string, 10);
    if (isNaN(propertyId) || isNaN(unitId) || isNaN(blockId)) return res.status(400).json({ error: 'Invalid ID parameters.' });

    const block = await prisma.unitBlock.findFirst({
      where: { id: blockId, unitId },
      include: { unit: true }
    });

    if (!block || block.unit.propertyId !== propertyId) return res.status(404).json({ error: 'Block not found.' });

    // EDGE CASE 4: Historical Immutability
    const now = new Date();
    if (block.endDate < now) {
      return res.status(403).json({ error: 'Historical blocks cannot be deleted. They are preserved for audit purposes.' });
    }

    await prisma.unitBlock.delete({ where: { id: blockId } });

    // RESTORE STATUS SYNCHRONIZATION
    const activeBlocks = await prisma.unitBlock.count({
      where: {
        unitId,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    if (activeBlocks === 0 && block.unit.status === 'MAINTENANCE') {
      await prisma.unit.update({
        where: { id: unitId },
        data: { status: 'AVAILABLE' }
      });
    }

    await logAction(req, 'UNIT_BLOCK', blockId, 'REMOVE_BLOCK', { unitId, reason: block.reason });
    return res.status(200).json({ message: 'Unit block lifted successfully.' });

  } catch (error) {
    console.error('[BlockController: removeUnitBlock]', error);
    return res.status(500).json({ error: 'Failed to lift unit block.' });
  }
};