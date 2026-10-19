import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { SectionHeading } from '../atoms/SectionHeading';
import type { ManagerDTO, PropertyType } from '../../types/property.types';

interface PropertyFormProps {
  isSubmitting: boolean;
  editingProperty: { id: number } | null;
  formData: Record<string, any>;
  errors: Record<string, string>;
  selectedFacilities: string[];
  availableFacilities: string[];
  availableManagers: ManagerDTO[];
  selectedManagers: number[];
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onToggleFacility: (facility: string) => void;
  onToggleManager: (managerId: number) => void;
}

const PROPERTY_TYPES: Array<{ label: string; value: PropertyType }> = [
  { label: 'Hostel (Boys)', value: 'HOSTEL_BOYS' },
  { label: 'Hostel (Girls)', value: 'HOSTEL_GIRLS' },
  { label: 'Hostel (Co-ed)', value: 'HOSTEL_COED' },
  { label: 'Hotel / Transient', value: 'HOTEL' },
  { label: 'Co-living', value: 'CO_LIVING' },
];

export function PropertyForm({
  isSubmitting,
  editingProperty,
  formData,
  errors,
  selectedFacilities,
  availableFacilities,
  availableManagers,
  selectedManagers,
  onCancel,
  onSubmit,
  onChange,
  onToggleFacility,
  onToggleManager,
}: PropertyFormProps) {
  const handleSelectChange = (name: string) => (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] ?? '' : value;
    onChange({ target: { name, value: selectedValue } } as unknown as ChangeEvent<HTMLInputElement | HTMLSelectElement>);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-8">
        <div>
          <SectionHeading accent="indigo">Property Details</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Property Name</label>
              <Input name="name" value={formData.name ?? ''} onChange={onChange} placeholder="e.g. Mira Residency" required hasError={!!errors.name} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Property Type</label>
              <Select
                name="type"
                value={formData.type ?? 'HOSTEL_COED'}
                options={PROPERTY_TYPES.map((type) => ({ label: type.label, value: type.value }))}
                onChange={handleSelectChange('type')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Floors</label>
              <Input name="floors" type="number" min="1" value={formData.floors ?? ''} onChange={onChange} placeholder="3" required hasError={!!errors.floors} />
            </div>
          </div>
        </div>

        <div>
          <SectionHeading accent="emerald">Address</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Address</label>
              <Input name="address" value={formData.address ?? ''} onChange={onChange} placeholder="Street address or landmark" required hasError={!!errors.address} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">City</label>
              <Input name="city" value={formData.city ?? ''} onChange={onChange} placeholder="City" required hasError={!!errors.city} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">State</label>
              <Input name="state" value={formData.state ?? ''} onChange={onChange} placeholder="State" required hasError={!!errors.state} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Pincode</label>
              <Input name="pincode" value={formData.pincode ?? ''} onChange={onChange} placeholder="000000" required hasError={!!errors.pincode} />
            </div>
          </div>
        </div>

        <div>
          <SectionHeading accent="amber">Contact</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone</label>
              <Input name="contactPhone" value={formData.contactPhone ?? ''} onChange={onChange} placeholder="+91 98765 43210" required hasError={!!errors.contactPhone} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email</label>
              <Input name="contactEmail" type="email" value={formData.contactEmail ?? ''} onChange={onChange} placeholder="support@example.com" hasError={!!errors.contactEmail} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <SectionHeading accent="amber">Facilities</SectionHeading>
          <div className="flex flex-wrap gap-3">
            {availableFacilities.map((facility) => {
              const active = selectedFacilities.includes(facility);
              return (
                <button
                  key={facility}
                  type="button"
                  onClick={() => onToggleFacility(facility)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}>
                  {facility}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionHeading accent="indigo">Manager Assignment</SectionHeading>
          {availableManagers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              No managers available. Only Super Admin can assign managers.
            </div>
          ) : (
            <div className="grid gap-3">
              {availableManagers.map((manager) => {
                const assigned = selectedManagers.includes(manager.id);
                return (
                  <button
                    key={manager.id}
                    type="button"
                    onClick={() => onToggleManager(manager.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${assigned ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/10' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700'}`}>
                    <span>
                      {manager.firstName} {manager.lastName}
                      <div className="text-xs text-slate-500 dark:text-slate-400">{manager.email ?? 'No email'}</div>
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${assigned ? 'bg-white text-indigo-600 dark:bg-indigo-500 dark:text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {assigned ? 'Assigned' : 'Assign'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} variant="primary">
            {editingProperty ? 'Update Property' : 'Save Property'}
          </Button>
        </div>
      </div>
    </form>
  );
}
