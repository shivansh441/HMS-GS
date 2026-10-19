import type { ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  accent?: 'indigo' | 'emerald' | 'amber' | 'orange';
}

const ACCENT_CLASSES: Record<NonNullable<SectionHeadingProps['accent']>, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
};

export function SectionHeading({ children, accent = 'indigo' }: SectionHeadingProps) {
  return (
    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center mb-8">
      <span className={`w-8 h-1.5 rounded-full mr-3 ${ACCENT_CLASSES[accent]}`}></span>
      {children}
    </h3>
  );
}