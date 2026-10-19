import { Select } from '../atoms/Select';
import { Input } from '../atoms/Input';
import { MONTH_NAMES } from '../../utils/payrollCalculation';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onChange: (period: string) => void;
}

export function PeriodSelector({ selectedPeriod, onChange }: PeriodSelectorProps) {
  const [year, month] = selectedPeriod.split('-');

  return (
    <div className="flex items-center gap-3">
      <Select
        options={MONTH_NAMES.map((name, index) => ({ label: name, value: String(index + 1) }))}
        value={String(Number(month))}
        onChange={(value) => {
          const nextMonth = Array.isArray(value) ? value[0] : value;
          onChange(`${year}-${String(nextMonth).padStart(2, '0')}`);
        }}
      />
      <Input
        type="number"
        min="2020"
        max="2100"
        value={year}
        onChange={(event) => onChange(`${event.target.value}-${month}`)}
        className="w-28"
      />
    </div>
  );
}