import type { ReactNode } from "react";

interface InfoItemProps {
  label: string;
  value: ReactNode;
  icon?: string;
  valueColorClass?: string;
  className?: string;
}

export function InfoItem({ label, value, icon, valueColorClass = "text-slate-700 dark:text-slate-200", className = "" }: InfoItemProps) {
  return (
    <div className={className}>
      <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-bold flex items-center gap-2 ${valueColorClass}`}>
        {icon && <i className={`fas ${icon} text-slate-400`}></i>} 
        {value}
      </p>
    </div>
  );
}