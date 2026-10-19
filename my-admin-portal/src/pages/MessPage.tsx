import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector, usePropertySelection } from '../store/hooks';
import { fetchResidents } from '../store/slices/residentsSlice';
import { updatePropertyApi } from '../services/propertyService';
import { Button } from '../components/atoms/Button';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { Card } from '../components/molecules/Card';
import {
  assignMessFacility,
  getHostelMenus,
  getMealAssignments,
  optOutMessFacility,
  saveHostelMenu,
} from '../services/diningService';
import type { HostelMenuItem, HostelWeeklyMenu, MealType } from '../types/dining.types';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MessPage() {
  const dispatch = useAppDispatch();
  const { selectedProperty } = usePropertySelection();
  const token = useAppSelector((state) => state.auth?.accessToken ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const residents = useAppSelector((state) => state.residents?.items ?? []);
  const isHotel = selectedProperty?.type === 'HOTEL';
  const propertyId = selectedProperty?.id;

  const [standardMessRate, setStandardMessRate] = useState<string>(
    selectedProperty?.standardMessRate ? String(selectedProperty.standardMessRate) : ''
  );
  const [isSavingStandardRate, setIsSavingStandardRate] = useState(false);

  const [hostelMenu, setHostelMenu] = useState<HostelWeeklyMenu | null>(null);
  const [hostelItems, setHostelItems] = useState<HostelMenuItem[]>([]);
  const [weekStart, setWeekStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPermanent, setIsPermanent] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [suggestedMessPrice, setSuggestedMessPrice] = useState('');

  const [residentId, setResidentId] = useState('');
  const [useCustomMessRate, setUseCustomMessRate] = useState(false);
  const [agreedMessRate, setAgreedMessRate] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);

  const [activeView, setActiveView] = useState<'menu' | 'assign' | 'config'>('menu');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProperty?.standardMessRate) {
      setStandardMessRate(String(selectedProperty.standardMessRate));
    }
  }, [selectedProperty?.standardMessRate]);

  const loadHostelData = async () => {
    if (!propertyId || !token || isHotel) return;
    try {
      if (authUser) {
        void dispatch(fetchResidents({ accountId: authUser.id, propertyIds: [String(propertyId)] }));
      }
      const [menus, activeAssignments] = await Promise.all([
        getHostelMenus(propertyId, token),
        getMealAssignments(propertyId, token)
      ]);

      const current = menus.find((menu: HostelWeeklyMenu) => menu.isPermanent) ?? menus[0] ?? null;
      setHostelMenu(current);
      setHostelItems(current?.items ?? []);
      setWeekStart(current?.weekStart?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
      setSuggestedMessPrice(current?.suggestedMessPrice == null ? '' : String(current.suggestedMessPrice));
      setIsPermanent(current?.isPermanent ?? false);
      setIsPublished(current?.isPublished ?? false);
      setAssignments(activeAssignments);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load mess data.');
    }
  };

  useEffect(() => {
    setMessage(null);
    setErrorMessage(null);
    void loadHostelData();
  }, [authUser, dispatch, isHotel, propertyId, token]);

  const handleSaveStandardMessRate = async () => {
    if (!propertyId || !token) return;
    const rateVal = parseFloat(standardMessRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setErrorMessage('Please enter a valid standard monthly mess charge.');
      return;
    }
    setIsSavingStandardRate(true);
    setErrorMessage(null);
    try {
      await updatePropertyApi(propertyId, { standardMessRate: rateVal } as any, token);
      setMessage(`Standard monthly mess rate updated to ₹${rateVal.toLocaleString()} for this hostel.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update standard mess rate.');
    } finally {
      setIsSavingStandardRate(false);
    }
  };

  const saveHostel = async () => {
    if (!propertyId || !token) return;
    setErrorMessage(null);
    try {
      const saved = await saveHostelMenu(propertyId, token, {
        id: hostelMenu?.id,
        weekStart: isPermanent ? undefined : weekStart,
        suggestedMessPrice: suggestedMessPrice ? Number(suggestedMessPrice) : undefined,
        isPermanent,
        isPublished,
        items: hostelItems
      });
      setHostelMenu(saved);
      setHostelItems(saved.items);
      setMessage(isPublished ? 'Hostel menu published successfully.' : 'Hostel menu saved successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save menu.');
    }
  };

  const addHostelItem = (dayOfWeek: number, mealType: MealType) => {
    setHostelItems((items) => [...items, { dayOfWeek, mealType, name: '', description: '' }]);
  };

  const updateHostelItem = (index: number, name: string) => {
    setHostelItems((items) => items.map((item, i) => i === index ? { ...item, name } : item));
  };

  const handleAssignResident = async () => {
    if (!propertyId || !token || !residentId) {
      setErrorMessage('Please choose a resident to assign to the mess facility.');
      return;
    }
    setErrorMessage(null);
    try {
      await assignMessFacility(propertyId, token, {
        accountId: Number(residentId),
        menuId: hostelMenu?.id ?? 0,
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRate: useCustomMessRate && agreedMessRate ? Number(agreedMessRate) : (selectedProperty?.standardMessRate ? Number(selectedProperty.standardMessRate) : undefined)
      });
      setMessage('Resident successfully assigned to the mess facility.');
      setResidentId('');
      setAgreedMessRate('');
      setUseCustomMessRate(false);
      void loadHostelData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to assign mess facility.');
    }
  };

  const handleOptOut = async (assignmentId: number) => {
    if (!propertyId || !token) return;
    setErrorMessage(null);
    try {
      await optOutMessFacility(propertyId, assignmentId, token);
      setMessage('Resident opted out of the mess facility.');
      void loadHostelData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to opt out of mess facility.');
    }
  };

  if (!selectedProperty) {
    return <Card className="p-8">Please select a property to manage dining and mess facilities.</Card>;
  }

  if (isHotel) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <SectionHeading accent="orange">Hotel Operations Notice</SectionHeading>
          <div className="mt-4 rounded-2xl bg-amber-50 p-6 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
              Mess Facility Exclusive to College & Student Hostels
            </h3>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
              <strong>{selectedProperty.name}</strong> is a hotel accommodation property. In accordance with system business rules, hotel properties manage guest rooms, nightly reservations, and accommodation billing only.
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
              Hostel mess plans, weekly menus, and student meal assignments are restricted to hostel properties.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionHeading accent="orange">Hostel Mess Management</SectionHeading>
            <p className="mt-1 text-sm text-slate-500">
              Manage standard monthly mess charges, weekly meal menus, and permanent resident mess subscriptions for {selectedProperty.name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Property Rate:</span>
            <span className="text-lg font-mono font-bold text-orange-600">
              ₹{Number(selectedProperty.standardMessRate || 0).toLocaleString()}/mo
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ['menu', 'Weekly Meal Menu'],
            ['assign', 'Resident Mess Subscriptions'],
            ['config', 'Property Standard Mess Rate']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveView(value as typeof activeView)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeView === value
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 border border-emerald-200">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}
      </div>

      {activeView === 'config' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Property Standard Monthly Mess Charge</h2>
          <p className="mt-1 text-sm text-slate-500">
            This uniform rate applies to all eligible permanent hostelers at {selectedProperty.name} who join the standard mess plan.
          </p>
          <div className="mt-6 max-w-md flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Standard Monthly Rate (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={standardMessRate}
                onChange={(e) => setStandardMessRate(e.target.value)}
                placeholder="e.g. 3500"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <Button
              variant="primary"
              loading={isSavingStandardRate}
              onClick={() => void handleSaveStandardMessRate()}
            >
              Update Standard Mess Charge
            </Button>
          </div>
        </Card>
      )}

      {activeView === 'menu' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="text-sm font-semibold">
              Week starts
              <input
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                disabled={isPermanent}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(event) => setIsPermanent(event.target.checked)}
              />
              Permanent base menu
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
              Published
            </label>
            <label className="text-sm font-semibold">
              Suggested Menu Price
              <input
                type="number"
                min="0"
                value={suggestedMessPrice}
                onChange={(event) => setSuggestedMessPrice(event.target.value)}
                className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                placeholder="3500"
              />
            </label>
            <Button variant="primary" onClick={() => void saveHostel()}>
              Save Menu
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {DAY_NAMES.map((day, dayIndex) => (
              <div key={day} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">{day}</h3>
                {MEAL_TYPES.map((mealType) => {
                  const itemIndex = hostelItems.findIndex(
                    (item) => item.dayOfWeek === dayIndex + 1 && item.mealType === mealType
                  );
                  const item = itemIndex >= 0 ? hostelItems[itemIndex] : undefined;
                  return (
                    <div key={mealType} className="mt-3 flex items-center gap-2">
                      <span className="w-24 text-xs font-bold text-slate-500">{mealType}</span>
                      {item ? (
                        <input
                          value={item.name}
                          onChange={(event) => updateHostelItem(itemIndex, event.target.value)}
                          placeholder="Meal name"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => addHostelItem(dayIndex + 1, mealType)}
                          className="text-sm font-semibold text-orange-600 hover:underline"
                        >
                          + Add meal
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeView === 'assign' && (
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign Resident to Mess Facility</h2>
            <p className="mt-1 text-sm text-slate-500">
              The property's standard monthly mess rate (₹{Number(selectedProperty.standardMessRate || 0).toLocaleString()}) is automatically applied to permanent hostelers.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select
                value={residentId}
                onChange={(event) => setResidentId(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Choose resident</option>
                {residents
                  .filter((resident) => resident.customerType === 'HOSTELER')
                  .map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.firstName} {resident.lastName}
                    </option>
                  ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={useCustomMessRate}
                  onChange={(event) => setUseCustomMessRate(event.target.checked)}
                />
                Use authorized custom rate for this resident
              </label>
              {useCustomMessRate && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={agreedMessRate}
                  onChange={(event) => setAgreedMessRate(event.target.value)}
                  placeholder="Custom monthly mess rate"
                  className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              )}
              <Button variant="primary" onClick={() => void handleAssignResident()}>
                Subscribe Resident
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Mess Subscriptions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-700">
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Monthly Rate</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No active mess subscriptions for this property.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {item.account?.firstName} {item.account?.lastName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-600">
                          ₹{Number(item.monthlyRate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {new Date(item.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => void handleOptOut(item.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800"
                          >
                            Opt Out
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
