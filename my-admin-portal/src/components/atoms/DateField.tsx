import { Input } from './Input';
import type { InputProps } from './Input';

export interface DateFieldProps extends Omit<InputProps, 'type' | 'onChange'> {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DateField({ value, onChange, min, max, ...rest }: DateFieldProps) {
  return (
    <Input
      {...rest}
      type="date"
      value={value || ''}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}