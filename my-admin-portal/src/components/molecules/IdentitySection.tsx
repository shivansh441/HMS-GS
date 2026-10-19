import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from './FormField';
import type { Account } from '../../types/account.types';

const idTypeOptions = [
  { label: 'AADHAAR', value: 'AADHAAR' },
  { label: 'PAN', value: 'PAN' },
  { label: 'PASSPORT', value: 'PASSPORT' },
  { label: 'DRIVING LICENSE', value: 'DRIVING_LICENSE' },
  { label: 'VOTER ID', value: 'VOTER_ID' },
  { label: 'OTHER', value: 'OTHER' },
];

interface IdentitySectionProps {
  formData: Partial<Account>;
  errors: Record<string, string>;
  onFieldChange: <K extends keyof Account>(field: K, value: Account[K]) => void;
}

export function IdentitySection({ formData, errors, onFieldChange }: IdentitySectionProps) {
  return (
    <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
      <SectionHeading accent="indigo">Identity</SectionHeading>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="ID Type" error={errors.idType}>
          <Select
            options={idTypeOptions as any}
            value={formData.idType || ''}
            onChange={(value) => onFieldChange('idType', value as Account['idType'])}
          />
        </FormField>

        <FormField label="ID Number" error={errors.idNumber}>
          <Input
            placeholder="Enter ID number"
            value={formData.idNumber || ''}
            onChange={(event) => onFieldChange('idNumber', event.target.value as Account['idNumber'])}
          />
        </FormField>
      </div>
    </div>
  );
}