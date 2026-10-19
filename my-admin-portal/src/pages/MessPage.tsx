import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector, usePropertySelection } from '../store/hooks';
import { fetchReservations } from '../store/slices/reservationsSlice';
import { fetchResidents } from '../store/slices/residentsSlice';
import { Button } from '../components/atoms/Button';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { Card } from '../components/molecules/Card';
import {
  assignMessFacility,
  createFoodOrder,
  getFoodMenu,
  getFoodOrders,
  getHostelMenus,
  saveFoodMenuItem,
  saveHostelMenu,
} from '../services/diningService';
import type { FoodMenuItem, FoodOrder, HostelMenuItem, HostelWeeklyMenu, MealType } from '../types/dining.types';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptyFoodItem = { name: '', description: '', category: '', price: '', taxRate: '0', isAvailable: true };

export default function MessPage() {
  const dispatch = useAppDispatch();
  const { selectedProperty } = usePropertySelection();
  const token = useAppSelector((state) => state.auth?.accessToken ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const residents = useAppSelector((state) => state.residents?.items ?? []);
  const reservations = useAppSelector((state) => state.reservations?.items ?? []);
  const isHotel = selectedProperty?.type === 'HOTEL';
  const propertyId = selectedProperty?.id;

  const [hostelMenu, setHostelMenu] = useState<HostelWeeklyMenu | null>(null);
  const [hostelItems, setHostelItems] = useState<HostelMenuItem[]>([]);
  const [weekStart, setWeekStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPermanent, setIsPermanent] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [residentId, setResidentId] = useState('');
  const [useCustomMessRate, setUseCustomMessRate] = useState(false);
  const [agreedMessRate, setAgreedMessRate] = useState('');
  const [suggestedMessPrice, setSuggestedMessPrice] = useState('');
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [foodItemForm, setFoodItemForm] = useState(emptyFoodItem);
  const [editingFoodItemId, setEditingFoodItemId] = useState<number | undefined>();
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({});
  const [historyGuest, setHistoryGuest] = useState('ALL');
  const [activeView, setActiveView] = useState<'menu' | 'assign' | 'orders'>('menu');
  const [message, setMessage] = useState<string | null>(null);

  const stayingGuests = useMemo(() => reservations.filter((reservation) => reservation.status === 'CONVERTED'), [reservations]);
  const selectedOrderItems = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  const historyGuests = useMemo(() => {
    const guests = new Map<number, string>();
    foodOrders.forEach((order) => guests.set(order.accountId, order.account ? `${order.account.firstName} ${order.account.lastName}` : order.reservation?.guestName || `Guest #${order.accountId}`));
    return [...guests.entries()].sort(([, first], [, second]) => first.localeCompare(second));
  }, [foodOrders]);

  useEffect(() => {
    if (!propertyId || !token) return;
    setMessage(null);
    if (isHotel) {
      void Promise.all([getFoodMenu(propertyId, token), getFoodOrders(propertyId, token)])
        .then(([menu, orders]) => { setFoodMenu(menu); setFoodOrders(orders); })
        .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hotel dining.'));
      void dispatch(fetchReservations({ propertyId }));
    } else {
      if (authUser) {
        void dispatch(fetchResidents({ accountId: authUser.id, propertyIds: [String(propertyId)] }));
      }
      void getHostelMenus(propertyId, token)
        .then((menus) => {
          const current = menus.find((menu) => menu.isPermanent) ?? menus[0] ?? null;
          setHostelMenu(current);
          setHostelItems(current?.items ?? []);
          setWeekStart(current?.weekStart?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
          setSuggestedMessPrice(current?.suggestedMessPrice == null ? '' : String(current.suggestedMessPrice));
          setIsPermanent(current?.isPermanent ?? false);
          setIsPublished(current?.isPublished ?? false);
        })
        .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hostel menu.'));
    }
  }, [authUser, dispatch, isHotel, propertyId, token]);

  const saveHostel = async () => {
    if (!propertyId || !token) return;
    try {
      const saved = await saveHostelMenu(propertyId, token, { id: hostelMenu?.id, weekStart: isPermanent ? undefined : weekStart, suggestedMessPrice: Number(suggestedMessPrice), isPermanent, isPublished, items: hostelItems });
      setHostelMenu(saved);
      setHostelItems(saved.items);
      setMessage(isPublished ? 'Menu published successfully.' : 'Menu saved successfully.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to save menu.'); }
  };

  const addHostelItem = (dayOfWeek: number, mealType: MealType) => {
    setHostelItems((items) => [...items, { dayOfWeek, mealType, name: '', description: '' }]);
  };

  const updateHostelItem = (index: number, name: string) => {
    setHostelItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item));
  };

  const assignResidentMeal = async () => {
    if (!propertyId || !token || !hostelMenu || !residentId) return;
    try {
      const rate = useCustomMessRate ? Number(agreedMessRate) : Number(hostelMenu.suggestedMessPrice ?? 0);
      if (!rate || rate <= 0) throw new Error('Enter a valid mess rate before assigning the facility.');
      await assignMessFacility(propertyId, token, { accountId: Number(residentId), menuId: hostelMenu.id, startDate: weekStart, monthlyRate: rate });
      setMessage('Full mess facility assigned.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to assign meal.'); }
  };

  const saveFoodItem = async () => {
    if (!propertyId || !token || !foodItemForm.name || foodItemForm.price === '') return;
    try {
      const saved = await saveFoodMenuItem(propertyId, token, { ...foodItemForm, id: editingFoodItemId, price: Number(foodItemForm.price), taxRate: Number(foodItemForm.taxRate) });
      setFoodMenu((items) => editingFoodItemId ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      setFoodItemForm(emptyFoodItem);
      setEditingFoodItemId(undefined);
      setMessage('Food menu item saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to save food item.'); }
  };

  const placeOrder = async () => {
    if (!propertyId || !token || !selectedReservationId || selectedOrderItems.length === 0) return;
    try {
      const order = await createFoodOrder(propertyId, token, { reservationId: Number(selectedReservationId), items: selectedOrderItems.map(([menuItemId, quantity]) => ({ menuItemId: Number(menuItemId), quantity })) });
      setFoodOrders((orders) => [order, ...orders]);
      setCart({});
      setSelectedReservationId('');
      setMessage(`Order #${order.id} added to the guest folio.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to place order.'); }
  };

  if (!selectedProperty) return <Card className="p-8">Select a property to manage dining.</Card>;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <SectionHeading accent="orange">{isHotel ? 'Hotel Food Orders' : 'Hostel Weekly Menu'}</SectionHeading>
        <p className="mt-1 text-sm text-slate-500">{isHotel ? 'Manage restaurant items and charge food orders to staying guests.' : 'Publish a permanent menu or edit a menu for a specific week, then assign meal access to residents.'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(isHotel ? [['menu', 'Restaurant Menu'], ['orders', 'Order Food & History']] : [['menu', 'Weekly Menu'], ['assign', 'Assign Meals']]).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setActiveView(value as typeof activeView)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeView === value ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{label}</button>
          ))}
        </div>
        {message && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}
      </div>

      {!isHotel && activeView === 'menu' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="text-sm font-semibold">Week starts
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2" disabled={isPermanent} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={isPermanent} onChange={(event) => setIsPermanent(event.target.checked)} /> Permanent base menu</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} /> Published</label>
            <label className="text-sm font-semibold">Full mess monthly price
              <input type="number" min="0" value={suggestedMessPrice} onChange={(event) => setSuggestedMessPrice(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2" placeholder="3500" />
            </label>
            <Button variant="primary" onClick={() => void saveHostel()}>Save Menu</Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {DAY_NAMES.map((day, dayIndex) => (
              <div key={day} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold">{day}</h3>
                {MEAL_TYPES.map((mealType) => {
                  const itemIndex = hostelItems.findIndex((item) => item.dayOfWeek === dayIndex + 1 && item.mealType === mealType);
                  const item = itemIndex >= 0 ? hostelItems[itemIndex] : undefined;
                  return <div key={mealType} className="mt-3 flex items-center gap-2"><span className="w-24 text-xs font-bold text-slate-500">{mealType}</span>{item ? <input value={item.name} onChange={(event) => updateHostelItem(itemIndex, event.target.value)} placeholder="Meal name" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /> : <button type="button" onClick={() => addHostelItem(dayIndex + 1, mealType)} className="text-sm font-semibold text-orange-600">+ Add meal</button>}</div>;
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isHotel && activeView === 'assign' && (
        <Card className="p-6"><h2 className="text-lg font-bold">Assign full mess facility</h2><p className="mt-1 text-sm text-slate-500">The suggested menu price is used unless a custom resident rate is selected.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><select value={residentId} onChange={(event) => setResidentId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="">Choose resident</option>{residents.filter((resident) => resident.customerType === 'HOSTELER').map((resident) => <option key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</option>)}</select><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={useCustomMessRate} onChange={(event) => setUseCustomMessRate(event.target.checked)} /> Use custom mess rate for this resident</label>{useCustomMessRate && <input type="number" min="0" step="0.01" value={agreedMessRate} onChange={(event) => setAgreedMessRate(event.target.value)} placeholder="Agreed monthly mess rate" className="rounded-xl border border-slate-200 px-3 py-2" />}<Button variant="primary" onClick={() => void assignResidentMeal()}>Assign Full Mess</Button></div></Card>
      )}

      {isHotel && activeView === 'menu' && <Card className="p-6"><h2 className="text-lg font-bold">Restaurant menu</h2><div className="mt-4 grid gap-3 md:grid-cols-6"><input placeholder="Item name" value={foodItemForm.name} onChange={(event) => setFoodItemForm({ ...foodItemForm, name: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input placeholder="Category" value={foodItemForm.category} onChange={(event) => setFoodItemForm({ ...foodItemForm, category: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input placeholder="Description" value={foodItemForm.description} onChange={(event) => setFoodItemForm({ ...foodItemForm, description: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input type="number" placeholder="Price" value={foodItemForm.price} onChange={(event) => setFoodItemForm({ ...foodItemForm, price: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input type="number" placeholder="Tax %" value={foodItemForm.taxRate} onChange={(event) => setFoodItemForm({ ...foodItemForm, taxRate: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><Button variant="primary" onClick={() => void saveFoodItem()}>{editingFoodItemId ? 'Update' : 'Add item'}</Button></div><div className="mt-6 grid gap-3 md:grid-cols-2">{foodMenu.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{item.name} <span className="text-emerald-600">₹{Number(item.price).toFixed(2)}</span></p><p className="text-sm text-slate-500">{item.category || 'General'} · {item.description || 'No description'}</p></div><Button variant="secondary" onClick={() => { setEditingFoodItemId(item.id); setFoodItemForm({ name: item.name, description: item.description || '', category: item.category || '', price: String(item.price), taxRate: String(item.taxRate), isAvailable: item.isAvailable }); }}>Edit</Button></div>)}</div></Card>}

      {isHotel && activeView === 'orders' && <><Card className="p-6"><h2 className="text-lg font-bold">Order food for a staying guest</h2><select value={selectedReservationId} onChange={(event) => setSelectedReservationId(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2"><option value="">Choose checked-in guest</option>{stayingGuests.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.guestName} · booking #{reservation.id}</option>)}</select><div className="mt-4 grid gap-3 md:grid-cols-3">{foodMenu.filter((item) => item.isAvailable).map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="font-bold">{item.name}</p><p className="text-sm text-slate-500">₹{Number(item.price).toFixed(2)}</p><div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => setCart({ ...cart, [item.id]: Math.max(0, (cart[item.id] || 0) - 1) })} className="rounded-lg bg-slate-100 px-3 py-1">-</button><span>{cart[item.id] || 0}</span><button type="button" onClick={() => setCart({ ...cart, [item.id]: (cart[item.id] || 0) + 1 })} className="rounded-lg bg-orange-100 px-3 py-1 text-orange-700">+</button></div></div>)}</div><Button variant="primary" className="mt-5" onClick={() => void placeOrder()}>Add Order To Guest Folio</Button></Card><Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Previous food orders by guest</h2><select value={historyGuest} onChange={(event) => setHistoryGuest(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2"><option value="ALL">All guests</option>{historyGuests.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div><div className="mt-4 space-y-3">{foodOrders.filter((order) => historyGuest === 'ALL' || String(order.accountId) === historyGuest).map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{order.account?.firstName} {order.account?.lastName} · Order #{order.id}</p><p className="text-sm text-slate-500">{order.items.map((item) => `${item.itemNameSnapshot} x${item.quantity}`).join(', ')}</p></div><div className="text-right"><p className="font-bold text-emerald-600">₹{Number(order.totalAmount).toFixed(2)}</p><p className="text-xs uppercase text-slate-500">{order.status}</p></div></div>)}</div></Card></>}
    </div>
  );
}
