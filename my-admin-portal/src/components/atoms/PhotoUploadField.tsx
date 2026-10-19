import type { ChangeEvent } from 'react';

interface PhotoUploadFieldProps {
  preview: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: string;
}

export function PhotoUploadField({ preview, onChange, disabled, label = 'Photo' }: PhotoUploadFieldProps) {
  return (
    <div className="flex min-w-[220px] flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[999px] border border-slate-200 bg-slate-100 text-slate-500 shadow-inner dark:border-slate-700 dark:bg-slate-800">
        {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : <i className="fas fa-camera text-2xl" />}
      </div>
      <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={disabled} />
        Upload {label}
      </label>
    </div>
  );
}
