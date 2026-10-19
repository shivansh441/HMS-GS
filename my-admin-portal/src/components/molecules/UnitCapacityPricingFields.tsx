import type { ChangeEvent } from 'react';
import { Input } from '../atoms/Input';

interface UnitCapacityPricingFieldsProps {
  capacity: number;
  defaultPricePerNight: number | string;
  defaultRecurringMonthlyRate: number | string;
  propertyType?: string;
  capacityEditable?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function UnitCapacityPricingFields({
  capacity,
  defaultPricePerNight,
  defaultRecurringMonthlyRate,
  propertyType,
  capacityEditable = true,
  onChange,
}: UnitCapacityPricingFieldsProps) {
  const isHotel = propertyType === 'HOTEL';
  const isUnknown = propertyType == null || propertyType === '';

  // Layout: keep capacity in the left column and pricing controls on the right when possible.
  // These are reference defaults; actual billing uses the guest/resident assignment rate.
  // If propertyType is unknown, show both fields to allow flexibility during creation.
  const showNightly = isHotel || isUnknown;
  const showMonthly = !isHotel || isUnknown;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="capacity" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Capacity
        </label>
        <Input id="capacity" value={capacity} onChange={onChange} name="capacity" type="number" placeholder="Capacity" min={1} disabled={!capacityEditable} />
        {!capacityEditable && <p className="mt-1 text-xs text-slate-400">Capacity is fixed by the selected room category.</p>}
      </div>

      <div>
        {showNightly && (
          <div className="mb-4">
            <label htmlFor="defaultPricePerNight" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Default price per night (reference only)
            </label>
            <Input
              id="defaultPricePerNight"
              value={defaultPricePerNight}
              onChange={onChange}
              name="defaultPricePerNight"
              type="number"
              placeholder="Price per night"
              min={0}
              step="0.01"
            />
            <p className="mt-1 text-xs text-slate-400">Enter a nightly rate for hotel rooms.</p>
          </div>
        )}

        {showMonthly && (
          <div>
            <label htmlFor="defaultRecurringMonthlyRate" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isHotel ? 'Default monthly rate (reference only)' : 'Default monthly rate (reference only)'}
            </label>
            <Input
              id="defaultRecurringMonthlyRate"
              value={defaultRecurringMonthlyRate}
              onChange={onChange}
              name="defaultRecurringMonthlyRate"
              type="number"
              placeholder={isHotel ? 'Monthly rate (optional)' : 'Monthly rate (required for hostels)'}
              min={0}
              step="0.01"
            />
            {!isHotel && <p className="mt-1 text-xs text-slate-400">Shown to staff as a starting point; actual resident pricing is set per assignment.</p>}
          </div>
        )}
      </div>
    </div>
  );
}