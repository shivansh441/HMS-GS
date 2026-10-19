import type { ChangeEvent } from 'react';
import { DateField } from '../atoms/DateField';
import { GenderSelect } from '../atoms/GenderSelect';
import { Input } from '../atoms/Input';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from './FormField';
import { PhotoUploadField } from '../atoms/PhotoUploadField';
import type { Account } from '../../types/account.types';

const getAge = (dateOfBirth: string | Date | null | undefined): number => {
  if (!dateOfBirth) return 0;
  const birthDate = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthOffset = today.getMonth() - birthDate.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
};

interface BasicProfileSectionProps {
  formData: Partial<Account>;
  errors: Record<string, string>;
  photoPreview: string | null;
  onFieldChange: <K extends keyof Account>(field: K, value: Account[K]) => void;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function BasicProfileSection({ formData, errors, photoPreview, onFieldChange, onPhotoChange, disabled }: BasicProfileSectionProps) {
  return (
    <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
      <SectionHeading accent="indigo">Basic Profile</SectionHeading>

      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="First Name" required error={errors.firstName}>
              <Input
                required
                placeholder="Enter first name"
                hasError={!!errors.firstName}
                value={formData.firstName || ''}
                onChange={(event) => onFieldChange('firstName', event.target.value as Account['firstName'])}
              />
            </FormField>

            <FormField label="Last Name" required error={errors.lastName}>
              <Input
                required
                placeholder="Enter last name"
                hasError={!!errors.lastName}
                value={formData.lastName || ''}
                onChange={(event) => onFieldChange('lastName', event.target.value as Account['lastName'])}
              />
            </FormField>

            <FormField label="Gender">
              <GenderSelect
                value={formData.gender || ''}
                onChange={(value) => onFieldChange('gender', value as Account['gender'])}
              />
            </FormField>

            <FormField label="Date of Birth">
              <DateField
                value={formData.dateOfBirth ? String(formData.dateOfBirth).split('T')[0] : ''}
                onChange={(value) => onFieldChange('dateOfBirth', value as Account['dateOfBirth'])}
              />
            </FormField>

            <FormField label="Age">
              <Input
                value={formData.dateOfBirth ? String(getAge(formData.dateOfBirth)) : ''}
                readOnly
              />
            </FormField>

            <FormField label="Mobile" required error={errors.phone}>
              <Input
                required
                type="tel"
                placeholder="+91"
                hasError={!!errors.phone}
                value={formData.phone || ''}
                onChange={(event) => onFieldChange('phone', event.target.value as Account['phone'])}
              />
            </FormField>

            <FormField label="Parent / Emergency Phone">
              <Input
                type="tel"
                placeholder="Emergency number"
                value={formData.parentPhone || ''}
                onChange={(event) => onFieldChange('parentPhone', event.target.value as Account['parentPhone'])}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Email" required error={errors.email}>
                <Input
                  required
                  type="email"
                  placeholder="staff@example.com"
                  hasError={!!errors.email}
                  value={formData.email || ''}
                  onChange={(event) => onFieldChange('email', event.target.value as Account['email'])}
                />
              </FormField>
            </div>
          </div>
        </div>

        <PhotoUploadField preview={photoPreview} onChange={onPhotoChange} disabled={disabled} />
      </div>
    </div>
  );
}
