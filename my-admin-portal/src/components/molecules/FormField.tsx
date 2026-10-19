
import type { ReactNode } from 'react';
 
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}
 
export function FormField({ label, required = false, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <span className="text-rose-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}
 
