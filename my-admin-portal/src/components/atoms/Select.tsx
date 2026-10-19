import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  options: SelectOption[];
  hasError?: boolean;
  value?: string | number | Array<string | number>;
  onChange?: (value: string | string[]) => void;
}

export function Select({ options, hasError = false, className = '', onChange, value, ...props }: SelectProps) {
  const baseStyles = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 dark:bg-slate-800 dark:text-white';
  const stateStyles = hasError
    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700';

  const normalizedValue = props.multiple
    ? Array.isArray(value)
      ? value.map((item) => String(item))
      : [String(value ?? '')]
    : String(value ?? '');

  return (
    <select
      {...props}
      value={normalizedValue}
      onChange={(event) => {
        if (props.multiple) {
          const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value);
          onChange?.(selectedValues);
          return;
        }
        onChange?.(event.target.value);
      }}
      className={`${baseStyles} ${stateStyles} ${className}`.trim()}
    >
      {options.map((option) => (
        <option key={`${option.label}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}