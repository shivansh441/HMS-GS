import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  rightElement?: ReactNode;
  hasError?: boolean;
}

export function Input({ icon, rightElement, hasError = false, className = '', ...props }: InputProps) {
  const baseStyles = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500';
  const stateStyles = hasError
    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700';

  return (
    <div className="relative group">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <i className={`fas ${icon} text-slate-400 transition-colors group-focus-within:text-indigo-500`} />
        </div>
      )}
      <input
        {...props}
        className={`${baseStyles} ${stateStyles} ${icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-12' : 'pr-3'} ${className}`.trim()}
      />
      {rightElement}
    </div>
  );
}