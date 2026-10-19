import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Account } from '../../types/account.types';
import { EmployeeCard } from './EmployeeCard';

interface EmployeeGridProps {
  accounts: Account[];
  currentAccount: Account | null;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function EmployeeGrid({ accounts, currentAccount, onEdit, onDelete }: EmployeeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' }
      );
    },
    { dependencies: [accounts] }
  );

  if (accounts.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
        <i className="fas fa-users text-3xl" />
        <p className="mt-3 text-lg font-semibold">No matching personnel found.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => (
        <EmployeeCard key={account.id} account={account} currentAccount={currentAccount} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
