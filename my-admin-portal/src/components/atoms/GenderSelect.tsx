import { Select } from './Select';
import type { SelectProps } from './Select';

// ASSUMPTION: adjust values to match your actual Gender enum/type if you have one in ../../../types
const GENDER_OPTIONS = [
  { label: 'Select gender', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

export interface GenderSelectProps extends Omit<SelectProps, 'options' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function GenderSelect({ value, onChange, ...rest }: GenderSelectProps) {
  return <Select {...rest} options={GENDER_OPTIONS} value={value} onChange={(nextValue) => onChange(String(nextValue))} />;
}