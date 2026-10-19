import { Button } from '../atoms/Button';
import { SectionHeading } from '../atoms/SectionHeading';

interface BulkUnitCreatePanelProps {
  canCreateUnit: boolean;
  bulkInput: string;
  onBulkInputChange: (value: string) => void;
  onSubmit: () => void;
  isBulkSaving: boolean;
}

export function BulkUnitCreatePanel({
  canCreateUnit,
  bulkInput,
  onBulkInputChange,
  onSubmit,
  isBulkSaving,
}: BulkUnitCreatePanelProps) {
  if (!canCreateUnit) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-700 dark:bg-amber-900/20">
        <SectionHeading>Bulk Create Units</SectionHeading>
        <p className="text-sm text-amber-700 dark:text-amber-200">
          Bulk room creation is reserved for Super Admin. Managers can only edit existing rooms for their associated property.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <SectionHeading>Bulk Create Units</SectionHeading>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Paste an array of unit objects in JSON format. Each unit needs <strong>unitNumber</strong>, <strong>type</strong>, and{' '}
        <strong>category</strong>.
      </p>
      <textarea
        className="min-h-[260px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        value={bulkInput}
        onChange={(event) => onBulkInputChange(event.target.value)}
      />
      <div className="mt-4 flex gap-3">
        <Button type="button" loading={isBulkSaving} onClick={onSubmit}>
          Create Bulk Units
        </Button>
      </div>
    </section>
  );
}