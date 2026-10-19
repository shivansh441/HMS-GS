import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';
import { SectionHeading } from '../atoms/SectionHeading';
import { BasicProfileSection } from '../molecules/BasicProfileSection';
import { IdentitySection } from '../molecules/IdentitySection';
import { AddressSection } from '../molecules/AddressSection';
import { AssigningAssociationSection } from '../molecules/AssigningAssociationSection';
import { FormField } from '../molecules/FormField';
import { validateResidentForm } from '../../utils/residentFormValidation';
import { RESIDENT_STATUS_OPTIONS } from '../../constants/resident.constants';
import type { Account } from '../../types/account.types';
import { usePropertySelection } from '../../store/hooks';

interface ResidentFormValues extends Partial<Account> {
  role?: Account['role'];
  customerType?: Account['customerType'];
  propertyIds?: number[];
  unitId?: string;
  agreedPricePerNight?: number | string | null;
  agreedMonthlyRate?: number | string | null;
  agreedMonthlyMessRate?: number | string | null;
  includeMess?: boolean;
  isCustomRate?: boolean;
}

interface ResidentFormPanelProps {
  editing: Account | null;
  onCancel: () => void;
  onSubmit: (data: ResidentFormValues & { checkIn?: string | null; checkOut?: string | null }) => Promise<void>;
  showHeading?: boolean;
  guestMode?: boolean;
  initialCheckIn?: string | null;
  initialCheckOut?: string | null;
}

const toDateInputValue = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const todayDateInputValue = (): string => {
  const today = new Date();
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

const createEmptyResident = (): ResidentFormValues => ({
  role: 'CUSTOMER',
  customerType: 'HOSTELER',
  gender: 'OTHER',
  isActive: true,
  propertyIds: [],
  unitId: '',
});

export function ResidentFormPanel({ editing, onCancel, onSubmit, showHeading = true, guestMode = false, initialCheckIn = null, initialCheckOut = null }: ResidentFormPanelProps) {
  const { selectedProperty, selectedProperties } = usePropertySelection();
  const eligibleProperties = guestMode
    ? selectedProperties.filter((property) => property.type?.startsWith('HOSTEL_') || property.type === 'HOTEL')
    : selectedProperties.filter((property) => property.type?.startsWith('HOSTEL_'));
  const firstHostel = eligibleProperties[0];
  const activeProperty = selectedProperty ?? firstHostel;
  const editingHostelId = editing?.propertyIds?.find((propertyId) =>
    eligibleProperties.some((property) => String(property.id) === String(propertyId))
  );
  const initialPropertyId = editingHostelId
    ? String(editingHostelId)
    : activeProperty && eligibleProperties.some((property) => property.id === activeProperty.id)
      ? String(activeProperty.id)
      : String(firstHostel?.id ?? '');
  const initialUnitId = editing?.unitAssignments?.find((assignment) =>
    assignment.unit?.propertyId === Number(initialPropertyId)
  )?.unitId;
  const initialAssignment = editing?.unitAssignments?.find((assignment) => assignment.unitId === initialUnitId);
  const [formData, setFormData] = useState<ResidentFormValues & { checkIn?: string | null; checkOut?: string | null }>(
    editing 
      ? { ...editing, role: 'CUSTOMER', customerType: guestMode ? (activeProperty?.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST') : 'HOSTELER', propertyIds: initialPropertyId ? [Number(initialPropertyId)] : [], unitId: initialUnitId ? String(initialUnitId) : '', agreedPricePerNight: initialAssignment?.agreedPricePerNight ?? null, agreedMonthlyRate: initialAssignment?.agreedMonthlyRate ?? null, agreedMonthlyMessRate: initialAssignment?.agreedMonthlyMessRate ?? editing.hostelMealAssignments?.[0]?.monthlyRate ?? null, includeMess: initialAssignment?.agreedMonthlyMessRate != null || editing.hostelMealAssignments?.[0]?.monthlyRate != null, isCustomRate: initialAssignment?.isCustomRate ?? false, checkIn: toDateInputValue(initialCheckIn ?? initialAssignment?.expectedCheckIn), checkOut: toDateInputValue(initialCheckOut ?? initialAssignment?.expectedCheckOut) }
      : { ...createEmptyResident(), propertyIds: initialPropertyId ? [Number(initialPropertyId)] : [], customerType: guestMode ? (activeProperty?.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST') : 'HOSTELER', checkIn: toDateInputValue(initialCheckIn) || (!guestMode ? todayDateInputValue() : ''), checkOut: toDateInputValue(initialCheckOut) }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(editing?.photoUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextCustomerType = guestMode
      ? (activeProperty?.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST')
      : 'HOSTELER';

    if (editing) {
      setFormData({
        ...editing,
        role: 'CUSTOMER',
        customerType: nextCustomerType,
        propertyIds: editing.propertyIds?.length ? editing.propertyIds : (initialPropertyId ? [Number(initialPropertyId)] : []),
        unitId: initialUnitId ? String(initialUnitId) : '',
        agreedPricePerNight: initialAssignment?.agreedPricePerNight ?? null,
        agreedMonthlyRate: initialAssignment?.agreedMonthlyRate ?? null,
        agreedMonthlyMessRate: initialAssignment?.agreedMonthlyMessRate ?? editing.hostelMealAssignments?.[0]?.monthlyRate ?? null,
        includeMess: initialAssignment?.agreedMonthlyMessRate != null || editing.hostelMealAssignments?.[0]?.monthlyRate != null,
        isCustomRate: initialAssignment?.isCustomRate ?? false,
        checkIn: toDateInputValue(initialCheckIn ?? initialAssignment?.expectedCheckIn),
        checkOut: toDateInputValue(initialCheckOut ?? initialAssignment?.expectedCheckOut),
      });
      setPhotoPreview(editing.photoUrl ?? null);
      return;
    }

    if (!guestMode && selectedProperty?.type?.startsWith('HOSTEL_') !== true) return;
    if (guestMode && !activeProperty) return;
    setFormData((current) => ({
      ...current,
      propertyIds: [activeProperty!.id],
      unitId: '',
      role: 'CUSTOMER',
      customerType: nextCustomerType,
      checkIn: current.checkIn ?? toDateInputValue(initialCheckIn) ?? (!guestMode ? todayDateInputValue() : ''),
      checkOut: current.checkOut ?? toDateInputValue(initialCheckOut),
    }));
    setPhotoPreview(null);
  }, [editing, guestMode, selectedProperty, activeProperty, initialCheckIn, initialCheckOut, initialPropertyId]);

  const onFieldChange = <K extends keyof Account>(field: K, value: Account[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const onPropertyChange = (propertyId: string) => {
    setFormData((current) => ({
      ...current,
      propertyIds: propertyId ? [Number(propertyId)] : [],
      unitId: '',
      customerType: guestMode
        ? (eligibleProperties.find((property) => String(property.id) === propertyId)?.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST')
        : 'HOSTELER',
    }));
  };

  const onUnitChange = (unitId: string) => {
    setFormData((current) => ({
      ...current,
      unitId,
      ...(!guestMode && !current.checkIn ? { checkIn: todayDateInputValue() } : {}),
    }));
  };

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateResidentForm(formData, guestMode);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload: ResidentFormValues & { checkIn?: string | null; checkOut?: string | null } = {
      ...formData,
      role: 'CUSTOMER',
      customerType: guestMode
        ? (eligibleProperties.find((property) => property.id === formData.propertyIds?.[0])?.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST')
        : 'HOSTELER',
      photoUrl: photoPreview ?? formData.photoUrl ?? null,
      checkIn: formData.checkIn || toDateInputValue(initialCheckIn),
      checkOut: formData.checkOut || toDateInputValue(initialCheckOut),
      includeMess: formData.includeMess === true,
    };

    console.log('[ResidentFormPanel] submit payload', payload);

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {showHeading ? (
          <SectionHeading accent="indigo">{editing ? (guestMode ? 'Edit Guest' : 'Edit Resident') : (guestMode ? 'New Guest' : 'New Resident')}</SectionHeading>
        ) : null}

        <div className="space-y-6">
          <BasicProfileSection formData={formData} errors={errors} photoPreview={photoPreview} onFieldChange={onFieldChange} onPhotoChange={onPhotoChange} />

          <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
            <SectionHeading accent="amber">{guestMode ? 'Guest Details' : 'Resident Details'}</SectionHeading>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField label={guestMode ? 'Guest Type' : 'Resident Type'} required error={errors.customerType}>
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {guestMode ? (formData.customerType === 'HOTEL_GUEST' ? 'Hotel Guest' : 'Hostel Guest') : 'Hosteler'}
                </div>
              </FormField>

              <FormField label="Active Status">
                <Select
                  options={RESIDENT_STATUS_OPTIONS}
                  value={formData.isActive === false ? 'false' : 'true'}
                  onChange={(value) => {
                    const nextValue = Array.isArray(value) ? String(value[0]) : String(value);
                    onFieldChange('isActive', nextValue === 'true');
                  }}
                />
              </FormField>
            </div>
          </div>

          <IdentitySection formData={formData} errors={errors} onFieldChange={onFieldChange} />
          <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />

          <AssigningAssociationSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
            propertyId={formData.propertyIds?.[0] !== undefined ? String(formData.propertyIds[0]) : ''}
            unitId={formData.unitId ?? ''}
            onPropertyChange={onPropertyChange}
            onUnitChange={onUnitChange}
            isResident
            guestMode={guestMode}
            checkIn={formData.checkIn}
            checkOut={formData.checkOut}
            onDateChange={(field, value) => setFormData((current) => ({ ...current, [field]: value }))}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{editing ? 'Save Changes' : (guestMode ? 'Create Guest' : 'Create Resident')}</Button>
        </div>
      </div>
    </form>
  );
}