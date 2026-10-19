import type { ChangeEvent } from 'react';
import { Input } from '../atoms/Input';

interface UnitBasicFieldsProps {
  unitNumber: string;
  floor: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function UnitBasicFields({ unitNumber, floor, onChange }: UnitBasicFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="unitNumber" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Unit Number
        </label>
        <Input id="unitNumber" value={unitNumber} onChange={onChange} name="unitNumber" placeholder="Unit Number" required />
      </div>
      <div>
        <label htmlFor="floor" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Floor
        </label>
        <Input id="floor" value={floor} onChange={onChange} name="floor" type="number" placeholder="Floor" min={0} />
      </div>
    </div>
  );
}