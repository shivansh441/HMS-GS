import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { usePropertySelection } from '../store/hooks';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { Button } from '../components/atoms/Button';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { DeleteConfirmDialog } from '../components/organisms/DeleteConfirmDialog';
import { Card } from '../components/molecules/Card';
import {
  setSelectedPropertyId,
  createProperty,
  editProperty,
  deactivateProperty,
} from '../store/slices/propertiesSlice';
import type { Property, ManagerDTO } from '../types/property.types';


const AVAILABLE_FACILITIES = ['WiFi', 'Mess', 'Gym', 'Laundry', 'Parking', 'CCTV', 'Power Backup', 'Library'];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOSTEL_BOYS: 'Hostel (Boys)',
  HOSTEL_GIRLS: 'Hostel (Girls)',
  HOSTEL_COED: 'Hostel (Co-ed)',
  HOTEL: 'Hotel / Transient',
  CO_LIVING: 'Co-living',
};

function formatType(type?: Property['type']) {
  return (type && PROPERTY_TYPE_LABELS[type]) ?? type?.replace('_', ' ') ?? 'Unknown';
}

export function PropertyPage() {
  const dispatch = useAppDispatch();
  const { properties } = usePropertySelection();
  const currentPropertyId = useAppSelector((state) => state.properties?.selectedPropertyId ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const accounts = useAppSelector((state) => state.accounts?.items ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    type: 'HOSTEL_COED',
    floors: 1,
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<number[]>([]);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const token = useAppSelector((state) => state.auth?.accessToken ?? undefined);

  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isSuperAdmin && !currentPropertyId && properties.length > 0) {
      dispatch(setSelectedPropertyId(String(properties[0].id)));
    }
  }, [currentPropertyId, properties, dispatch, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || !authUser || !token) {
      return;
    }

    void dispatch(fetchAccounts({
      role: 'MANAGER',
      authUserId: authUser.id,
      authUserRole: authUser.role,
    }));
  }, [authUser, dispatch, isSuperAdmin, token]);

  const availableManagers: ManagerDTO[] = accounts
    .filter((account) => account.role === 'MANAGER')
    .map((account) => ({
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
    }));


  const showSuccess = (text: string) => {
    setApiMessage({ type: 'success', text });
    setTimeout(() => setApiMessage(null), 5000);
  };

  const showError = (text: string) => {
    setApiMessage({ type: 'error', text });
    setTimeout(() => setApiMessage(null), 5000);
  };

  const openForm = (property?: Property | null) => {
    setEditingProperty(property ?? null);
    if (property) {
      setFormData({
        name: property.name ?? '',
        type: property.type ?? 'HOSTEL_COED',
        floors: property.floors ?? 1,
        address: property.address ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        pincode: property.pincode ?? '',
        contactPhone: property.contactPhone ?? '',
        contactEmail: property.contactEmail ?? '',
      });
      setSelectedFacilities(property.facilities ?? []);
      setSelectedManagers(property.managers?.map((manager) => manager.id) ?? []);
    } else {
      setFormData({
        name: '',
        type: 'HOSTEL_COED',
        floors: 1,
        address: '',
        city: '',
        state: '',
        pincode: '',
        contactPhone: '',
        contactEmail: '',
      });
      setSelectedFacilities([]);
      setSelectedManagers([]);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'floors' ? Number(value) : value,
    }));
  };

  const handleToggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((item) => item !== facility) : [...prev, facility]
    );
  };

  const handleToggleManager = (managerId: number) => {
    setSelectedManagers((prev) =>
      prev.includes(managerId) ? prev.filter((id) => id !== managerId) : [...prev, managerId]
    );
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      floors: Number(formData.floors || 1),
      facilities: selectedFacilities,
      managerIds: selectedManagers,
    };

    try {
      if (editingProperty) {
        await dispatch(editProperty({ propertyId: editingProperty.id, payload })).unwrap();
        showSuccess('Property updated successfully.');
      } else {
        await dispatch(createProperty(payload)).unwrap();
        showSuccess('Property created successfully.');
      }
      handleCloseForm();
    } catch (error: any) {
      showError(error instanceof Error ? error.message : 'Property action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    setIsSubmitting(true);

    try {
      await dispatch(deactivateProperty({ propertyId: propertyToDelete.id, password: deletePassword })).unwrap();
      setPropertyToDelete(null);
      setDeletePassword('');
      showSuccess('Property deactivated successfully.');
    } catch (error: any) {
      showError(error instanceof Error ? error.message : 'Deactivate failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 w-full">
      {apiMessage && (
        <div className={`rounded-2xl border p-4 text-sm ${apiMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {apiMessage.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div>
          <SectionHeading accent="indigo">{showForm ? (editingProperty ? 'Edit Property' : 'New Property') : 'Properties Hub'}</SectionHeading>
          <p className="text-sm text-slate-500">{showForm ? 'Complete the property details before returning to the portfolio.' : 'Manage properties and assign managers across your portfolio.'}</p>
        </div>
        {showForm ? <Button variant="secondary" onClick={handleCloseForm}>Cancel</Button> : isSuperAdmin ? <Button variant="primary" onClick={() => openForm(null)}>+ New Property</Button> : null}
      </div>

      {showForm && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <PropertyForm
            isSubmitting={isSubmitting}
            editingProperty={editingProperty}
            formData={formData}
            errors={{}}
            selectedFacilities={selectedFacilities}
            availableFacilities={AVAILABLE_FACILITIES}
            availableManagers={availableManagers}
            selectedManagers={selectedManagers}
            onCancel={handleCloseForm}
            onSubmit={handleFormSubmit}
            onChange={handleChange}
            onToggleFacility={handleToggleFacility}
            onToggleManager={handleToggleManager}
          />
        </div>
      )}

      {!showForm && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No properties found. Create a new property to get started.
          </div>
        ) : (
          properties.map((property) => (
            <Card
              key={property.id}
              onClick={() => dispatch(setSelectedPropertyId(String(property.id)))}
              className={`cursor-pointer ${String(property.id) === String(currentPropertyId) ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' : ''}`}
            >
              <Card.Body>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{property.name}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{formatType(property.type)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{property.address}, {property.city}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${property.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {property.status}
                  </span>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div><strong>Type:</strong> {formatType(property.type)}</div>
                  <div><strong>Floors:</strong> {property.floors ?? '—'}</div>
                  <div><strong>Managers:</strong> {(property.managers?.length ?? 0) || '0'}</div>
                </div>
              </Card.Body>
              <Card.Footer>
                <Button variant="secondary" type="button" onClick={() => openForm(property)}>
                  Edit
                </Button>
                {isSuperAdmin && (
                  <Button variant="danger" type="button" onClick={() => setPropertyToDelete(property)}>
                    Deactivate
                  </Button>
                )}
              </Card.Footer>
            </Card>
          ))
        )}
      </div>}

      <DeleteConfirmDialog
        isOpen={!!propertyToDelete}
        title="Deactivate Property"
        description={`Deactivate ${propertyToDelete?.name ?? 'this property'} and remove it from active operations.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onCancel={() => setPropertyToDelete(null)}
        onConfirm={handleDeleteConfirm}
      >
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Admin Password</label>
          <input
            type="password"
            placeholder="Enter password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            required
          />
        </div>
      </DeleteConfirmDialog>
    </div>
  );
}
