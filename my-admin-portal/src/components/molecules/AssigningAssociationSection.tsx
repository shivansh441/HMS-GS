import { Select } from '../atoms/Select';
import { Input } from '../atoms/Input';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from '../molecules/FormField';
import type { Account } from '../../types/account.types';
import type { Unit } from '../../types/unit.types';
import { useAppSelector, usePropertySelection } from '../../store/hooks';
import { getHostelMenus } from '../../services/diningService';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { fetchUnits } from '../../store/slices/unitsSlice';

interface AssigningAssociationSectionProps {
  formData: Partial<Account> & { includeMess?: boolean };
  errors: Record<string, string>;
  onFieldChange: <K extends keyof Account>(field: K, value: Account[K]) => void;
  // For residents
  propertyId?: string;
  unitId?: string;
  onPropertyChange?: (propertyId: string) => void;
  onUnitChange?: (unitId: string) => void;
  showPropertySelection?: boolean;
  isResident?: boolean;
  guestMode?: boolean;
  checkIn?: string | null;
  checkOut?: string | null;
  onDateChange?: (field: 'checkIn' | 'checkOut', value: string) => void;
}

const EMPTY_UNITS: Unit[] = [];

export function AssigningAssociationSection({
  formData,
  errors,
  onFieldChange,
  propertyId,
  unitId,
  onPropertyChange,
  onUnitChange,
  showPropertySelection = true,
  isResident = false,
  guestMode = false,
  checkIn = '',
  checkOut = '',
  onDateChange,
}: AssigningAssociationSectionProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth?.accessToken ?? null);
  const [defaultMessRate, setDefaultMessRate] = useState<number | null>(null);
  const [isCustomMessRate, setIsCustomMessRate] = useState(false);
  
  // Get properties from Redux
  const { properties } = usePropertySelection();
  
  // Get units for selected property from Redux
  const units = useAppSelector((state) => {
    if (!propertyId) return EMPTY_UNITS;
    const propId = Number(propertyId);
    return state.units?.items[propId] ?? EMPTY_UNITS;
  });
  const unitsStatus = useAppSelector((state) => {
    if (!propertyId) return 'idle';
    return state.units?.statusByProperty[Number(propertyId)] ?? 'idle';
  });
  
  // Fetch units when property changes
  useEffect(() => {
    if (propertyId && unitsStatus === 'idle') {
      const propId = Number(propertyId);
      void dispatch(fetchUnits({ propertyId: propId }));
    }
  }, [propertyId, dispatch, unitsStatus]);
  
  // Ensure formData and errors exist
  const safeFormData = formData || {};
  const safeErrors = errors || {};

  const selectedUnit = units.find((unit) => String(unit.id) === String(unitId));
  const isMonthly = !guestMode && formData?.customerType === 'HOSTELER';
  const defaultRate = isMonthly ? selectedUnit?.defaultRecurringMonthlyRate : selectedUnit?.defaultPricePerNight;
  const agreedRate = isMonthly ? formData?.agreedMonthlyRate : formData?.agreedPricePerNight;

  useEffect(() => {
    if (!isResident || !isMonthly || !propertyId || !accessToken) {
      setDefaultMessRate(null);
      setIsCustomMessRate(false);
      return;
    }

    void getHostelMenus(Number(propertyId), accessToken)
      .then((menus) => {
        const menu = menus.find((item) => item.isPermanent && item.suggestedMessPrice != null)
          ?? menus.find((item) => item.suggestedMessPrice != null);
        setDefaultMessRate(menu?.suggestedMessPrice == null ? null : Number(menu.suggestedMessPrice));
      })
      .catch(() => setDefaultMessRate(null));
  }, [accessToken, isMonthly, isResident, propertyId]);

  useEffect(() => {
    if (!isResident || !selectedUnit || formData?.isCustomRate === true) return;
    const currentRate = isMonthly ? formData?.agreedMonthlyRate : formData?.agreedPricePerNight;
    if (String(currentRate ?? '') === String(defaultRate ?? '')) return;
    onFieldChange(isMonthly ? 'agreedMonthlyRate' : 'agreedPricePerNight', defaultRate ?? null);
  }, [defaultRate, formData?.agreedMonthlyRate, formData?.agreedPricePerNight, formData?.isCustomRate, isMonthly, isResident, onFieldChange, selectedUnit]);

  useEffect(() => {
    if (!isResident || formData?.includeMess !== true || defaultMessRate == null || isCustomMessRate) return;
    if (String(formData?.agreedMonthlyMessRate ?? '') === String(defaultMessRate)) return;
    onFieldChange('agreedMonthlyMessRate', defaultMessRate);
  }, [defaultMessRate, formData?.agreedMonthlyMessRate, formData?.includeMess, isCustomMessRate, isResident, onFieldChange]);

  // Employee mode (for EmployeeFormPanel)
  if (!isResident) {
    const role = safeFormData.role || 'STAFF';
    const selectedPropertyIds = (role === 'MANAGER' || role === 'SUPER_ADMIN'
      ? safeFormData.managedProperties ?? []
      : safeFormData.staffProperties ?? [])
      .map((property) => String(typeof property === 'number' ? property : property.id));
    const propertyOptions = properties.map((property) => ({
      label: `${property.name} (${property.type})`,
      value: String(property.id),
    }));

    return (
      <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
        <SectionHeading accent="emerald">Property Association</SectionHeading>

        <FormField label={role === 'MANAGER' || role === 'SUPER_ADMIN' ? 'Manager Properties' : 'Staff Properties'} required error={safeErrors.propertyIds}>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            {propertyOptions.length === 0 ? (
              <p className="text-sm text-slate-500">No accessible properties found.</p>
            ) : propertyOptions.map((property) => (
              <label key={property.value} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50">
                <input
                  type="checkbox"
                  value={property.value}
                  checked={selectedPropertyIds.includes(String(property.value))}
                  onChange={(event) => {
                    const nextIds = event.target.checked
                      ? [...selectedPropertyIds, String(property.value)]
                      : selectedPropertyIds.filter((id) => id !== String(property.value));
                    const selected = properties.filter((item) => nextIds.includes(String(item.id)));
                    console.debug('[EmployeeForm] Property selection changed', {
                      role,
                      selectedPropertyIds: nextIds,
                      selectedProperties: selected.map((item) => ({ id: item.id, name: item.name })),
                    });
                    if (role === 'MANAGER' || role === 'SUPER_ADMIN') {
                      onFieldChange('managedProperties', selected);
                      onFieldChange('staffProperties', []);
                    } else {
                      onFieldChange('staffProperties', selected);
                      onFieldChange('managedProperties', []);
                    }
                  }}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span>{property.label}</span>
              </label>
            ))}
          </div>
        </FormField>

        <div className="mt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {role === 'MANAGER'
              ? 'Managers can be assigned to multiple properties for oversight.'
              : 'Staff members can be assigned to multiple properties for daily operations.'}
          </p>
        </div>
      </div>
    );
  }

  // Resident mode (for ResidentFormPanel)
  const propertyOptions = [
    { label: 'Select Property', value: '' },
    ...properties.filter((prop) => guestMode
      ? prop.type?.startsWith('HOSTEL_') || prop.type === 'HOTEL'
      : prop.type?.startsWith('HOSTEL_')).map((prop) => ({
      label: prop.name,
      value: String(prop.id),
    })),
  ];

  const unitOptions = [
    { label: 'Select Unit', value: '' },
    ...units.map((unit: any) => ({
      label: `${unit.unitNumber} (${unit.type} - ${unit.category})`,
      value: String(unit.id),
    })),
  ];

  return (
    <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
      <SectionHeading accent="emerald">Property Assignment</SectionHeading>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {showPropertySelection && (
          <FormField label="Property" required error={safeErrors.propertyIds}>
            <Select
              options={propertyOptions}
              value={propertyId}
              onChange={(value) => onPropertyChange?.(value as string)}
            />
          </FormField>
        )}
        <FormField label="Unit/Room" error={safeErrors.unitId}>
          <Select
            options={unitOptions}
            value={unitId}
            onChange={(value) => onUnitChange?.(value as string)}
            disabled={!propertyId}
          />
        </FormField>
      </div>

      {selectedUnit && (
        <div className="mt-6">
          <SectionHeading accent="amber">Guest Pricing</SectionHeading>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Reference rate: {defaultRate == null ? 'not configured' : `₹${Number(defaultRate).toFixed(2)}`}. The agreed rate is saved with this assignment.</p>
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label={isMonthly ? 'Monthly accommodation rate' : 'Nightly accommodation rate'} error={safeErrors.agreedMonthlyRate ?? safeErrors.agreedPricePerNight}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={agreedRate == null ? '' : String(agreedRate)}
                readOnly={formData.isCustomRate !== true}
                onChange={(event) => onFieldChange(isMonthly ? 'agreedMonthlyRate' : 'agreedPricePerNight', event.target.value)}
                placeholder={isMonthly ? 'Enter monthly rate' : 'Enter nightly rate'}
              />
              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isCustomRate === true}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    onFieldChange('isCustomRate', enabled);
                    if (!enabled) onFieldChange(isMonthly ? 'agreedMonthlyRate' : 'agreedPricePerNight', defaultRate ?? null);
                  }}
                  className="h-4 w-4 accent-indigo-600"
                />
                Use custom rate for this guest
              </label>
            </FormField>
            {isMonthly ? <FormField label="Monthly mess fee">
              <Input type="number" min="0" step="0.01" value={formData.agreedMonthlyMessRate == null ? '' : String(formData.agreedMonthlyMessRate)} disabled={formData.includeMess !== true || !isCustomMessRate} onChange={(event) => { setIsCustomMessRate(true); onFieldChange('agreedMonthlyMessRate', event.target.value); }} placeholder="Enter mess fee" />
              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={formData.includeMess === true} onChange={(event) => { const enabled = event.target.checked; onFieldChange('includeMess' as keyof Account, enabled as Account[keyof Account]); if (enabled) { setIsCustomMessRate(false); onFieldChange('agreedMonthlyMessRate', defaultMessRate ?? null); } else { onFieldChange('agreedMonthlyMessRate', null); } }} className="h-4 w-4 accent-indigo-600" />
                Include mess fee for this resident
              </label>
              {formData.includeMess === true && <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={isCustomMessRate} onChange={(event) => { const enabled = event.target.checked; setIsCustomMessRate(enabled); if (!enabled) onFieldChange('agreedMonthlyMessRate', defaultMessRate ?? null); }} className="h-4 w-4 accent-indigo-600" />Use custom mess rate for this resident</label>}
            </FormField> : null}
          </div>
          <FormField label="Living start date" className="mt-6 md:col-span-2">
            <Input type="date" value={checkIn ?? ''} onChange={(event) => onDateChange?.('checkIn', event.target.value)} />
          </FormField>
        </div>
      )}

      {guestMode && (
        <div className="mt-6">
          <SectionHeading accent="amber">Stay Dates</SectionHeading>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Check-in">
              <Input type="date" value={checkIn ?? ''} onChange={(event) => onDateChange?.('checkIn', event.target.value)} />
            </FormField>
            <FormField label="Check-out">
              <Input type="date" value={checkOut ?? ''} onChange={(event) => onDateChange?.('checkOut', event.target.value)} />
            </FormField>
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Assign the resident to a specific property and unit for accommodation management.
        </p>
      </div>
    </div>
  );
}