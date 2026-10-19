import { type ReactNode } from 'react';
import { Button } from '../atoms/Button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  children,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">{title}</p>
        <h3 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        {children ? <div className="mt-6">{children}</div> : null}
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button type="button" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
