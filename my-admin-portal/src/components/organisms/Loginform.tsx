import { useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

export interface LoginFormProps {
  action: (formData: FormData) => void;
  error: string | null;
  isPending: boolean;
}

export const LoginForm = ({ action, error, isPending }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(error);

  return (
    <form action={action} className="space-y-5 form-container">
      <div className="flex flex-col gap-2 stagger-el">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Administrator Email</label>
        <Input
          type="email"
          name="email"
          icon="fa-envelope"
          placeholder="admin@maharanapratap.com"
          hasError={hasError}
          required
        />
      </div>

      <div className="flex flex-col gap-2 stagger-el">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          icon="fa-key"
          placeholder="••••••••"
          hasError={hasError}
          required
          rightElement={
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
            </button>
          }
        />
      </div>

      {error && (
        <div className="stagger-el flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-600 shadow-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <i className="fas fa-circle-exclamation mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
        Access Dashboard
      </Button>
    </form>
  );
};