import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'neutral';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: ButtonVariant | string;
  icon?: string;
  children?: ReactNode;
}

export function Button({
  loading = false,
  variant = 'primary',
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles: Record<string, string> = {
    primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/40',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    danger: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 hover:shadow-rose-500/40',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/40',
    neutral: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    ghost: 'bg-transparent text-slate-600 shadow-none hover:bg-slate-100 hover:shadow-none dark:text-slate-300 dark:hover:bg-slate-800',
  };

  const currentVariantStyle = variantStyles[variant] || variantStyles.primary;
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-70';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyles} ${currentVariantStyle} ${className}`.trim()}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <i className="fas fa-circle-notch fa-spin" />
          {typeof children === 'string' ? children : 'Loading...'}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <i className={`fas ${icon}`} />}
          {children}
        </span>
      )}
    </button>
  );
}