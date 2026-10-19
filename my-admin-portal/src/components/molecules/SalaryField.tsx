import { Input } from '../atoms/Input';

interface SalaryFieldProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function SalaryField({ value, onChange, error }: SalaryFieldProps) {
  return (
    <div className="mt-6 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
      <label className="block text-[11px] font-black text-emerald-700 dark:text-emerald-500 mb-2 uppercase tracking-wide">
        Base Monthly Payroll (₹) <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-500 z-10">₹</span>
        <Input
          required
          type="number"
          placeholder="0"
          className="pl-9 font-mono font-bold"
          hasError={!!error}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      {error && <span className="text-rose-500 text-xs mt-1 block">{error}</span>}
      <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 mt-2">
        <i className="fas fa-info-circle mr-1"></i> This is the fixed 30-day salary. Absences or advances will be
        managed in the Payroll Tracker.
      </p>
    </div>
  );
}