import { Select, type SelectOption } from '../atoms/Select';

interface UnitTypeCategoryFieldsProps {
  typeValue: string;
  typeOptions: SelectOption[];
  onTypeChange: (value: string | string[]) => void;
  categoryValue: string;
  categoryOptions: SelectOption[];
  onCategoryChange: (value: string | string[]) => void;
}

export function UnitTypeCategoryFields({
  typeValue,
  typeOptions,
  onTypeChange,
  categoryValue,
  categoryOptions,
  onCategoryChange,
}: UnitTypeCategoryFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="type" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Unit Type
        </label>
        <Select id="type" value={typeValue} name="type" onChange={onTypeChange} options={typeOptions} />
      </div>
      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Category
        </label>
        <Select id="category" value={categoryValue} name="category" onChange={onCategoryChange} options={categoryOptions} />
      </div>
    </div>
  );
}