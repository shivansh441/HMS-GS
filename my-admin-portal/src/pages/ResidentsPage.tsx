import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, usePropertySelection } from '../store/hooks';
import { addAccount, deleteAccount, updateAccount } from '../store/slices/accountsSlice';
import { fetchResidents } from '../store/slices/residentsSlice';
import type { Account } from '../types/account.types';
import { ResidentFormPanel } from '../components/organisms/ResidentFormPanel';
import { ResidentGrid } from '../components/organisms/ResidentGrid';
import { DeleteConfirmDialog } from '../components/organisms/DeleteConfirmDialog';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { RESIDENT_FILTER_OPTIONS, RESIDENT_SORT_OPTIONS } from '../constants/resident.constants';

function canManageResident(viewer: Account | null, resident: Account) {
  if (!viewer) return false;
  if (viewer.role === 'SUPER_ADMIN') return viewer.id !== resident.id;
  if (viewer.role === 'MANAGER') return resident.role === 'CUSTOMER';
  return false;
}

function canDeleteResident(viewer: Account | null, resident: Account) {
  if (!viewer) return false;
  if (viewer.role === 'SUPER_ADMIN') return viewer.id !== resident.id;
  if (viewer.role === 'MANAGER') return resident.role === 'CUSTOMER';
  return false;
}

export default function ResidentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allResidents = useAppSelector((state) => state.residents?.items ?? []);
  const accountsStatus = useAppSelector((state) => state.residents?.status ?? 'idle');
  const accountsError = useAppSelector((state) => state.residents?.error ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const { selectedProperty, selectedProperties } = usePropertySelection();
  const selectedHostelPropertyIds = useMemo(
    () => selectedProperties
      .filter((property) => property.type?.startsWith('HOSTEL_'))
      .map((property) => String(property.id)),
    [selectedProperties]
  );

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingResident, setEditingResident] = useState<Account | null>(null);
  const [residentToDelete, setResidentToDelete] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('ALL');
  const [sort, setSort] = useState('name-asc');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProperty?.type === 'HOTEL') {
      navigate('/', { replace: true });
    }
  }, [navigate, selectedProperty?.type]);

  // One request covers the current account and the sidebar's selected property scope.
  useEffect(() => {
    if (!authUser?.id || selectedHostelPropertyIds.length === 0) return;
    console.log('[ResidentsPage] Fetch scope:', {
      accountId: authUser.id,
      selectedPropertyIds: selectedHostelPropertyIds,
    });
    void dispatch(fetchResidents({
      accountId: authUser.id,
      propertyIds: selectedHostelPropertyIds,
      force: true,
    }));
  }, [authUser?.id, dispatch, selectedHostelPropertyIds]);

  const residents = allResidents;

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return residents
      .filter((resident) => {
        if (customerType !== 'ALL' && resident.customerType !== customerType) {
          return false;
        }

        const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
        return (
          !query ||
          fullName.includes(query) ||
          resident.email?.toLowerCase().includes(query) ||
          resident.phone?.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => {
        switch (sort) {
          case 'name-desc':
            return `${right.firstName} ${right.lastName}`.localeCompare(`${left.firstName} ${left.lastName}`);
          case 'created-asc':
            return new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime();
          case 'created-desc':
            return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
          default:
            return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
        }
      });
  }, [residents, search, customerType, sort]);

  const currentAccount = useMemo<Account | null>(() => {
    if (!authUser) return null;

    const authId = String(authUser.id);
    const matchingResident = residents.find(
      (resident) => String(resident.id) === authId || resident.email === authUser.email
    );

    if (matchingResident) {
      return matchingResident;
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
  }, [authUser, residents]);

  const handleStartCreate = () => {
    setEditingResident(null);
    setViewMode('form');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleStartEdit = (resident: Account) => {
    setEditingResident(resident);
    setViewMode('form');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleCancelForm = () => {
    setEditingResident(null);
    setViewMode('list');
    setErrorMessage(null);
  };

  const handleFormSubmit = async (data: Partial<Account> & {
    unitId?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    includeMess?: boolean;
  }) => {
    try {
      if (editingResident) {
        console.debug('[ResidentsPage] Updating resident', {
          accountId: editingResident.id,
          propertyIds: data.propertyIds,
          unitId: data.unitId,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          includeMess: data.includeMess,
          agreedMonthlyMessRate: data.agreedMonthlyMessRate,
        });
        await dispatch(updateAccount({ ...data, id: editingResident.id })).unwrap();
        await dispatch(fetchResidents({ accountId: authUser!.id, propertyIds: selectedHostelPropertyIds, force: true })).unwrap();
        setSuccessMessage('Resident updated successfully.');
      } else {
        await dispatch(addAccount({ role: 'CUSTOMER', ...data })).unwrap();
        await dispatch(fetchResidents({ accountId: authUser!.id, propertyIds: selectedHostelPropertyIds, force: true })).unwrap();
        setSuccessMessage('Resident added successfully.');
      }

      setViewMode('list');
      setEditingResident(null);
      setErrorMessage(null);
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(error instanceof Error ? error.message : 'Request failed.');
    }
  };

  const handleDelete = async () => {
    if (!residentToDelete) return;

    try {
      await dispatch(deleteAccount(residentToDelete.id)).unwrap();
      await dispatch(fetchResidents({ accountId: authUser!.id, propertyIds: selectedHostelPropertyIds, force: true })).unwrap();
      setResidentToDelete(null);
      setSuccessMessage('Resident deleted successfully.');
      setErrorMessage(null);
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(error instanceof Error ? error.message : 'Request failed.');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionHeading accent="indigo">{viewMode === 'form' ? (editingResident ? 'Edit Resident' : 'New Resident') : 'Residents'}</SectionHeading>
          <p className="text-sm text-slate-500">{viewMode === 'form' ? 'Update the resident details and assignment.' : 'View and manage resident profiles in a dedicated inline workspace.'}</p>
        </div>
        {viewMode === 'form' ? <Button type="button" variant="secondary" onClick={handleCancelForm}>Cancel</Button> : <Button type="button" variant="primary" onClick={handleStartCreate}>New Resident</Button>}
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div>
      ) : null}

      {(accountsError || errorMessage) ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{accountsError ?? errorMessage}</div>
      ) : null}

      {viewMode === 'form' ? (
        <ResidentFormPanel 
          key={editingResident?.id ?? 'new'} 
          editing={editingResident} 
          onCancel={handleCancelForm} 
          onSubmit={handleFormSubmit} 
          showHeading={false} 
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Search residents" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select
                options={RESIDENT_FILTER_OPTIONS}
                value={customerType}
                onChange={(value) => setCustomerType(Array.isArray(value) ? String(value[0]) : String(value))}
              />
              <Select
                options={RESIDENT_SORT_OPTIONS}
                value={sort}
                onChange={(value) => setSort(Array.isArray(value) ? String(value[0]) : String(value))}
              />
            </div>
          </div>

          {accountsStatus === 'loading' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">Loading residents…</div>
          ) : null}

          <ResidentGrid
            residents={filteredResidents}
            currentUser={currentAccount}
            onEdit={handleStartEdit}
            onDelete={setResidentToDelete}
            canEdit={canManageResident}
            canDelete={canDeleteResident}
          />
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!residentToDelete}
        title="Delete Resident"
        description={`Delete ${residentToDelete?.firstName ?? 'this resident'} ${residentToDelete?.lastName ?? ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setResidentToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
