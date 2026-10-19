import type { Account } from '../../types/account.types';

interface DashboardStatsProps {
  accounts: Account[];
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function DashboardStats({ accounts }: DashboardStatsProps) {
  const activePersonnel = accounts.filter((account) => account.isActive && (account.role === 'MANAGER' || account.role === 'STAFF')).length;
  const committedBudget = accounts.reduce((total, account) => {
    if (account.role === 'MANAGER' || account.role === 'STAFF') {
      const salary = Number(account.baseSalary ?? 0);
      return total + (Number.isFinite(salary) ? salary : 0);
    }
    return total;
  }, 0);
  const roleDistribution = accounts.filter((account) => account.role === 'MANAGER' || account.role === 'STAFF').length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Active Personnel" value={String(activePersonnel)} subtitle="Current active staff and managers" />
      <StatCard title="Committed Monthly Budget" value={`₹${committedBudget.toLocaleString()}`} subtitle="Summed base salaries" />
      <StatCard title="Role Distribution" value={String(roleDistribution)} subtitle="Managers + staff in scope" />
    </div>
  );
}
