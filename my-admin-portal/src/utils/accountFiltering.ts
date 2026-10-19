import type { Account } from '../types/account.types';

export interface AccountFilters {
  search: string;
  department: string;
  status: string;
  sort: string;
  role?: string;
}

export function getScopedAccounts(accounts: Account[], viewerRole: string | null | undefined) {
  if (viewerRole === 'MANAGER') {
    return accounts.filter((account) => account.role === 'STAFF' || account.role === 'MANAGER' || account.role === 'SUPER_ADMIN');
  }

  if (viewerRole === 'SUPER_ADMIN') {
    return accounts.filter((account) => account.role !== 'SUPER_ADMIN' || account.role === 'SUPER_ADMIN');
  }

  return accounts;
}

export function computeStats(accounts: Account[]) {
  const activePersonnel = accounts.filter((account) => account.isActive && (account.role === 'MANAGER' || account.role === 'STAFF')).length;
  const committedBudget = accounts.reduce((total, account) => {
    if (account.role === 'MANAGER' || account.role === 'STAFF') {
      const value = Number(account.baseSalary ?? 0);
      return total + (Number.isFinite(value) ? value : 0);
    }
    return total;
  }, 0);

  const roleDistribution = accounts.reduce<Record<string, number>>((accumulator, account) => {
    if (account.role === 'MANAGER' || account.role === 'STAFF') {
      accumulator[account.role] = (accumulator[account.role] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  return {
    activePersonnel,
    committedBudget,
    roleDistribution,
  };
}

export function filterAndSortAccounts(accounts: Account[], filters: AccountFilters) {
  const query = filters.search.trim().toLowerCase();
  const byDepartment = filters.department;
  const byStatus = filters.status;
  const byRole = filters.role;

  const filtered = accounts.filter((account) => {
    const matchesSearch =
      !query ||
      `${account.firstName} ${account.lastName}`.toLowerCase().includes(query) ||
      (account.email || '').toLowerCase().includes(query) ||
      (account.department || '').toLowerCase().includes(query);

    const matchesDepartment = !byDepartment || account.department === byDepartment;
    const matchesStatus =
      !byStatus ||
      (byStatus === 'active' && account.isActive) ||
      (byStatus === 'inactive' && !account.isActive);
    const matchesRole = !byRole || account.role === byRole;

    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  return filtered.sort((left, right) => {
    switch (filters.sort) {
      case 'name-desc':
        return `${right.firstName} ${right.lastName}`.localeCompare(`${left.firstName} ${left.lastName}`);
      case 'joined-asc':
        return new Date(left.joinDate || 0).getTime() - new Date(right.joinDate || 0).getTime();
      case 'joined-desc':
        return new Date(right.joinDate || 0).getTime() - new Date(left.joinDate || 0).getTime();
      default:
        return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
    }
  });
}
