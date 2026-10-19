import { Input } from '../atoms/Input';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from './FormField';
import type { Account } from '../../types/account.types';

interface AddressSectionProps {
  formData: Partial<Account>;
  errors: Record<string, string>;
  onFieldChange: <K extends keyof Account>(field: K, value: Account[K]) => void;
}

export function AddressSection({ formData, errors, onFieldChange }: AddressSectionProps) {
  return (
    <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
      <SectionHeading accent="emerald">Address</SectionHeading>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField label="Address" error={errors.address}>
            <Input
              placeholder="Enter address"
              value={formData.address || ''}
              onChange={(event) => onFieldChange('address', event.target.value as Account['address'])}
            />
          </FormField>
        </div>
        <FormField label="City" error={errors.city}>
          <Input
            placeholder="Enter city"
            value={formData.city || ''}
            onChange={(event) => onFieldChange('city', event.target.value as Account['city'])}
          />
        </FormField>
        <FormField label="State" error={errors.state}>
          <Input
            placeholder="Enter state"
            value={formData.state || ''}
            onChange={(event) => onFieldChange('state', event.target.value as Account['state'])}
          />
        </FormField>
        <FormField label="Pincode" error={errors.pincode}>
          <Input
            placeholder="Enter pincode"
            value={formData.pincode || ''}
            onChange={(event) => onFieldChange('pincode', event.target.value as Account['pincode'])}
          />
        </FormField>
      </div>
    </div>
  );
}
