import { DateField } from '../atoms/DateField';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from './FormField';
import type { Account } from '../../types/account.types';

interface EmployeeDetailSectionProps {
  formData: Partial<Account>;
  errors: Record<string, string>;
  onFieldChange: <K extends keyof Account>(field: K, value: Account[K]) => void;
  roleOptions: Array<{ label: string; value: string }>;
}

export function EmployeeDetailSection({ formData, errors, onFieldChange, roleOptions }: EmployeeDetailSectionProps) {
  const isInactive = formData.isActive === false;
  const isFixedDepartment = formData.role === 'SUPER_ADMIN' || formData.role === 'MANAGER';
  const departmentValue = formData.role === 'SUPER_ADMIN'
    ? 'GODMODE'
    : formData.role === 'MANAGER'
      ? 'MANAGEMENT'
      : formData.department || '';

  return (
    <div className="form-section rounded-[2rem] border border-slate-100 bg-slate-50 p-6 md:p-8 dark:border-slate-700/50 dark:bg-slate-800/30">
      <SectionHeading accent="amber">Employment</SectionHeading>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="Role" required error={errors.role}>
          <Select
            options={roleOptions}
            value={formData.role || 'STAFF'}
            onChange={(value) => {
              const role = Array.isArray(value) ? value[0] : value;
              onFieldChange('role', role as Account['role']);
              if (role === 'SUPER_ADMIN') onFieldChange('department', 'GODMODE');
              if (role === 'MANAGER') onFieldChange('department', 'MANAGEMENT');
              if (role === 'STAFF' && isFixedDepartment) onFieldChange('department', '');
            }}
          />
        </FormField>

        <FormField label="Department" error={errors.department}>
          <Select
            options={[
              { label: 'Select Department', value: '' },
              { label: 'Godmode', value: 'GODMODE' },
              { label: 'Management', value: 'MANAGEMENT' },
              { label: 'Front Desk', value: 'FRONT_DESK' },
              { label: 'Housekeeping', value: 'HOUSEKEEPING' },
              { label: 'Maintenance', value: 'MAINTENANCE' },
              { label: 'Security', value: 'SECURITY' },
              { label: 'Kitchen', value: 'KITCHEN' },
            ]}
            value={departmentValue}
            disabled={isFixedDepartment}
            onChange={(value) => onFieldChange('department', value as Account['department'])}
          />
        </FormField>

        <FormField label="Designation" error={errors.designation}>
          <Input
            placeholder="Enter designation"
            value={formData.designation || ''}
            onChange={(event) => onFieldChange('designation', event.target.value as Account['designation'])}
          />
        </FormField>

        <FormField label="Join Date" required error={errors.joinDate}>
          <DateField
            value={formData.joinDate ? String(formData.joinDate).split('T')[0] : ''}
            onChange={(value) => onFieldChange('joinDate', value as Account['joinDate'])}
            hasError={!!errors.joinDate}
          />
        </FormField>

        <FormField label="Employment Status">
          <Select
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            value={formData.isActive === false ? 'false' : 'true'}
            onChange={(value) => onFieldChange('isActive', value === 'true' as any)}
          />
        </FormField>

        {isInactive && (
          <FormField label="Left Date" required error={errors.leftDate}>
            <DateField
              value={formData.leftDate ? String(formData.leftDate).split('T')[0] : ''}
              onChange={(value) => onFieldChange('leftDate', value as Account['leftDate'])}
              hasError={!!errors.leftDate}
            />
          </FormField>
        )}

        <FormField label="Base Salary" required error={errors.baseSalary}>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="₹0.00"
            value={formData.baseSalary ?? ''}
            onChange={(event) => onFieldChange('baseSalary', event.target.value as Account['baseSalary'])}
            hasError={!!errors.baseSalary}
          />
        </FormField>

        <FormField label="Recurring Subsidy">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="₹0.00"
            value={formData.recurringSubsidy ?? ''}
            onChange={(event) => onFieldChange('recurringSubsidy', event.target.value as Account['recurringSubsidy'])}
          />
        </FormField>
      </div>
    </div>
  );
}
