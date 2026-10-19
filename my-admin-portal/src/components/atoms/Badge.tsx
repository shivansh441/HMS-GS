import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400',
    warning: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
    danger: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400',
    info: 'border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400',
    neutral: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300',
  };

  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
