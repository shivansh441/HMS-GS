import { useEffect, useState } from 'react';
import { Button } from '../atoms/Button';
import { SectionHeading } from '../atoms/SectionHeading';
import { AddressSection } from '../molecules/AddressSection';
import { AssigningAssociationSection } from '../molecules/AssigningAssociationSection';
import { BasicProfileSection } from '../molecules/BasicProfileSection';
import { EmployeeDetailSection } from '../molecules/EmployeeDetailSection';
import { IdentitySection } from '../molecules/IdentitySection';
import { validateAccountForm } from '../../utils/employeeFormValidation';
import { getRoleOptions } from '../../utils/accountPermissions';
import type { Account } from '../../types/account.types';

interface EmployeeFormValues extends Partial<Account> {
  propertyIds?: number[];
}

interface EmployeeFormPanelProps {
  editing: Account | null;
  onCancel: () => void;
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
  showHeading?: boolean;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  currentAccount?: Account | null;
}

const createEmptyFormData = (): EmployeeFormValues => ({
  role: 'STAFF',
  customerType: 'NONE',
  isActive: true,
  gender: 'OTHER',
  managedProperties: [],
  staffProperties: [],
});

export function EmployeeFormPanel({
  editing,
  onCancel,
  onSubmit,
  showHeading = true,
  formId = 'employee-form',
  onSubmittingChange,
  currentAccount,
}: EmployeeFormPanelProps) {
  const [formData, setFormData] = useState<EmployeeFormValues>(editing ? { ...editing } : createEmptyFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(editing?.photoUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(editing ? { ...editing } : createEmptyFormData());
    setPhotoPreview(editing?.photoUrl ?? null);
  }, [editing]);

  const onFieldChange = <K extends keyof Account>(field: K, value: Account[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const onPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateAccountForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const propertyIds = (formData.role === 'MANAGER' || formData.role === 'SUPER_ADMIN'
      ? (formData.managedProperties ?? [])
      : (formData.staffProperties ?? []))
      .map((property) => (typeof property === 'number' ? property : property?.id))
      .filter((propertyId): propertyId is number => Number.isFinite(propertyId));

    const payload: EmployeeFormValues = Object.assign(
      {},
      formData,
      { photoUrl: photoPreview ?? formData.photoUrl ?? null, propertyIds }
    );

    console.debug('[EmployeeForm] Submit payload', {
      mode: editing ? 'update' : 'create',
      accountId: editing?.id ?? null,
      role: payload.role,
      department: payload.department,
      propertyIds,
      managedPropertyIds: (payload.managedProperties ?? []).map((property) => typeof property === 'number' ? property : property.id),
      staffPropertyIds: (payload.staffProperties ?? []).map((property) => typeof property === 'number' ? property : property.id),
    });

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6">
      {showHeading ? (
        <div className="flex items-center justify-between">
          <SectionHeading accent="indigo">{editing ? 'Edit Employee' : 'Add Employee'}</SectionHeading>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save</Button>
          </div>
        </div>
      ) : null}

      <BasicProfileSection formData={formData} errors={errors} photoPreview={photoPreview} onFieldChange={onFieldChange} onPhotoChange={onPhotoChange} />
      <IdentitySection formData={formData} errors={errors} onFieldChange={onFieldChange} />
      <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
      <EmployeeDetailSection formData={formData} errors={errors} onFieldChange={onFieldChange} roleOptions={getRoleOptions(currentAccount)} />
      <AssigningAssociationSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
    </form>
  );
}