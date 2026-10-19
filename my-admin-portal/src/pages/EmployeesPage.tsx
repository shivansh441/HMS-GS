import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAccount, deleteAccount, fetchAccounts, updateAccount } from '../store/slices/accountsSlice';
import type { Account } from '../types/account.types';
import { EmployeeFormPanel } from '../components/organisms/EmployeeFormPanel';
import { EmployeeGrid } from '../components/organisms/EmployeeGrid';
import PayrollPanel from '../components/organisms/PayrollPanel';
import { DashboardStats } from '../components/organisms/DashboardStats';
import { DeleteConfirmDialog } from '../components/organisms/DeleteConfirmDialog';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { filterAndSortAccounts, getScopedAccounts } from '../utils/accountFiltering';

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((state) => state.accounts?.items ?? []);
  const accountsStatus = useAppSelector((state) => state.accounts?.status ?? 'idle');
  const accountsError = useAppSelector((state) => state.accounts?.error ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const selectedPropertyId = useAppSelector((state) => state.properties?.selectedPropertyId ?? null);
  const properties = useAppSelector((state) => state.properties?.list ?? []);
  const propertiesStatus = useAppSelector((state) => state.properties?.status ?? 'idle');

  const currentAccount = useMemo<Account | null>(() => {
    if (!authUser) return null;

    const matchingAccount = accounts.find((account: Account) => {
      const accountId = String(account.id);
      const authId = String(authUser.id);
      return accountId === authId || account.email === authUser.email;
    });

    if (matchingAccount) {
      return matchingAccount;
    }

    return {
      id: Number(authUser.id),
      role: (authUser.role || 'CUSTOMER') as Account['role'],
      customerType: 'NONE',
      firstName: authUser.firstName || '',
      lastName: authUser.lastName || '',
      email: authUser.email || null,
      phone: null,
      parentPhone: null,
      dateOfBirth: null,
      gender: null,
      idType: null,
      idNumber: null,
      address: null,
      city: null,
      state: null,
      pincode: null,
      photoUrl: null,
      department: null,
      designation: null,
      baseSalary: null,
      recurringSubsidy: null,
      joinDate: null,
      leftDate: null,
      isActive: true,
      isDeleted: false,
      managedProperties: [],
      staffProperties: [],
    };
  }, [accounts, authUser]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [roleTab, setRoleTab] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPayrollPanel, setShowPayrollPanel] = useState(false);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  useEffect(() => {
    if (!authUser?.id || !authUser.role || (!selectedPropertyId && propertiesStatus !== 'succeeded')) return;
    console.debug('[EmployeesPage] Loading employees', {
      authUserId: authUser.id,
      authUserRole: authUser.role,
      selectedPropertyId,
      accessiblePropertyIds: properties.map((property) => property.id),
    });
    void dispatch(fetchAccounts({
      role: 'STAFF,MANAGER,SUPER_ADMIN',
      accountType: 'Employee',
      propertyId: selectedPropertyId ? String(selectedPropertyId) : undefined,
      propertyIds: selectedPropertyId ? undefined : properties.map((property) => String(property.id)).join(','),
      authUserId: Number(authUser.id),
      authUserRole: authUser.role,
    }));
  }, [authUser?.id, authUser?.role, dispatch, properties, propertiesStatus, selectedPropertyId]);

  const scopedAccounts = useMemo(() => getScopedAccounts(accounts, currentAccount?.role), [accounts, currentAccount?.role]);
  const propertyScopedAccounts = useMemo(() => {
    if (!selectedPropertyId) {
      return scopedAccounts;
    }

    const propertyId = Number(selectedPropertyId);
    if (!Number.isFinite(propertyId)) {
      return scopedAccounts;
    }

    return scopedAccounts.filter((account) => {
      if (account.role === 'SUPER_ADMIN') {
        return true;
      }

      const propertyIds = [
        ...(account.managedProperties ?? []),
        ...(account.staffProperties ?? []),
      ]
        .map((property) => (typeof property === 'number' ? property : property?.id))
        .filter((propertyIdValue): propertyIdValue is number => Number.isFinite(propertyIdValue));

      return propertyIds.includes(propertyId);
    });
  }, [scopedAccounts, selectedPropertyId]);

  const filteredAccounts = useMemo(() => {
    const roleFilter = roleTab === 'ALL' ? '' : roleTab;
    return filterAndSortAccounts(propertyScopedAccounts, { search, department, status, sort, role: roleFilter });
  }, [propertyScopedAccounts, department, roleTab, search, sort, status]);

  const handleStartCreate = () => {
    setEditingAccount(null);
    setViewMode('form');
    setSuccessMessage(null);
  };

  const handleStartEdit = (account: Account) => {
    setEditingAccount(account);
    setViewMode('form');
    setSuccessMessage(null);
  };

  const handleCancelForm = () => {
    setEditingAccount(null);
    setViewMode('list');
  };

  const handleOpenPayroll = () => {
    setShowPayrollPanel(true);
  };

  const handleClosePayroll = () => {
    setShowPayrollPanel(false);
  };

  const handleFormSubmit = async (data: Partial<Account>) => {
    try {
      if (editingAccount) {
        await dispatch(updateAccount({ ...data, id: editingAccount.id } as Partial<Account> & { id: number })).unwrap();
        setSuccessMessage('Account updated successfully');
      } else {
        await dispatch(addAccount(data)).unwrap();
        setSuccessMessage('Account created successfully');
      }
      if (authUser?.id && authUser.role) {
        await dispatch(fetchAccounts({
          role: 'STAFF,MANAGER,SUPER_ADMIN',
          accountType: 'Employee',
          propertyId: selectedPropertyId ? String(selectedPropertyId) : undefined,
          propertyIds: selectedPropertyId ? undefined : properties.map((property) => String(property.id)).join(','),
          authUserId: Number(authUser.id),
          authUserRole: authUser.role,
        })).unwrap();
      }
      setViewMode('list');
      setEditingAccount(null);
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await dispatch(deleteAccount(accountToDelete.id)).unwrap();
      if (authUser?.id && authUser.role) {
        await dispatch(fetchAccounts({
          role: 'STAFF,MANAGER,SUPER_ADMIN',
          accountType: 'Employee',
          propertyId: selectedPropertyId ? String(selectedPropertyId) : undefined,
          propertyIds: selectedPropertyId ? undefined : properties.map((property) => String(property.id)).join(','),
          authUserId: Number(authUser.id),
          authUserRole: authUser.role,
        })).unwrap();
      }
      setAccountToDelete(null);
      setSuccessMessage('Account deleted successfully');
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const handleStatusChange = (value: string | string[]) => {
    setStatus(Array.isArray(value) ? value[0] ?? '' : value);
  };

  const handleSortChange = (value: string | string[]) => {
    setSort(Array.isArray(value) ? value[0] ?? 'name-asc' : value);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        {viewMode === 'form' ? (
          <>
            <div>
              <SectionHeading accent="indigo">{editingAccount ? 'Edit Personnel' : 'Add Personnel'}</SectionHeading>
              <p className="text-sm text-slate-500">
                Fill in the details below to {editingAccount ? 'update' : 'create'} a personnel record.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={handleCancelForm}>Cancel</Button>
              <Button variant="primary" type="submit" form="employee-form" loading={isSavingEmployee}>Save</Button>
            </div>
          </>
        ) : showPayrollPanel ? (
          <>
            <div>
              <SectionHeading accent="indigo">Payroll</SectionHeading>
              <p className="text-sm text-slate-500">Review payroll for the selected property.</p>
            </div>
            <Button variant="secondary" type="button" onClick={handleClosePayroll}>Back to Directory</Button>
          </>
        ) : (
          <>
            <div>
              <SectionHeading accent="indigo">HR Directory</SectionHeading>
              <p className="text-sm text-slate-500">Manage staff and managers from one inline workspace.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={handleStartCreate}>Add Personnel</Button>
              <Button variant="primary" type="button" onClick={handleOpenPayroll}>Payroll</Button>
            </div>
          </>
        )}
      </div>

      {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}
      {accountsError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{accountsError}</div> : null}

     {viewMode === 'form' ? (
        <EmployeeFormPanel
          editing={editingAccount}
          onCancel={handleCancelForm}
          onSubmit={handleFormSubmit}
          showHeading={false}
          formId="employee-form"
          onSubmittingChange={setIsSavingEmployee}
          currentAccount={currentAccount}
        />
      ) : showPayrollPanel ? (
        <PayrollPanel
          propertyId={selectedPropertyId ? Number(selectedPropertyId) : undefined}
          employees={propertyScopedAccounts}
          onClose={handleClosePayroll}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <DashboardStats accounts={propertyScopedAccounts} />

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex flex-wrap gap-3">
              {['ALL', 'MANAGER', 'STAFF'].map((tab) => (
                <button key={tab} type="button" onClick={() => setRoleTab(tab)} className={`rounded-full px-4 py-2 text-sm font-semibold ${roleTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab === 'ALL' ? 'All Roles' : tab}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <Input placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
              <Select options={[{ label: 'All statuses', value: '' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} value={status} onChange={handleStatusChange} />
              <Select options={[{ label: 'Name A-Z', value: 'name-asc' }, { label: 'Name Z-A', value: 'name-desc' }, { label: 'Joined newest', value: 'joined-desc' }, { label: 'Joined oldest', value: 'joined-asc' }]} value={sort} onChange={handleSortChange} />
            </div>
          </div>

          {accountsStatus === 'loading' ? <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500">Loading personnel…</div> : null}
          {!accountsStatus || accountsStatus === 'succeeded' ? <EmployeeGrid accounts={filteredAccounts} currentAccount={currentAccount as Account | null} onEdit={handleStartEdit} onDelete={(account) => setAccountToDelete(account)} /> : null}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!accountToDelete}
        title="Delete Personnel"
        description={`Delete ${accountToDelete?.firstName ?? 'this account'} ${accountToDelete?.lastName ?? ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
