import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useAppDispatch, useAppSelector, usePropertySelection } from "../store/hooks";
import { SectionHeading } from "../components/atoms/SectionHeading";
import { EmptyState } from "../components/atoms/EmptyState";
import { UnitFormPanel } from "../components/organisms/UnitFormPanel";
import RoomCard from "../components/molecules/RoomCard";
import AssignResidentModal from "../components/organisms/AssignResidentModal";
import { RoomStats } from "../components/organisms/RoomStats";
import { BulkUnitCreatePanel } from "../components/organisms/BulkUnitCreatePanel";
import { DeleteConfirmDialog } from "../components/organisms/DeleteConfirmDialog";
import {
  createUnitApi,
  createUnitsBulkApi,
  updateUnitApi,
  deleteUnitApi,
} from "../services/unitService";
import { fetchUnits } from "../store/slices/unitsSlice";
import { refreshTokenApi } from "../services/authService";
import { updateAccessToken } from "../store/slices/authSlice";
import type { Property } from "../types/property.types";
import type { Unit, UnitFormState, UnitTypeValue } from "../types/unit.types";
import {
  HOTEL_CATEGORIES,
  HOSTEL_CATEGORIES,
  HOTEL_FEATURE_PRESETS,
  HOSTEL_FEATURE_PRESETS,
  HOSTEL_FEATURE_OPTIONS,
  HOTEL_FEATURE_OPTIONS,
} from "../constants/rooms.constants";



const defaultFormState: UnitFormState = {
  unitNumber: "",
  floor: 0,
  type: "ROOM",
  category: "CLASSIC",
  capacity: 1,
  defaultPricePerNight: 0,
  defaultRecurringMonthlyRate: "",
  features: [],
};
const EMPTY_UNITS: Unit[] = [];
const FIXED_HOSTEL_CAPACITY: Record<string, number> = {
  SINGLE_ROOM: 1,
  DOUBLE_ROOM: 2,
  TRIPLE_ROOM: 3,
  QUADRUPLE_ROOM: 4,
};

export default function RoomsPage() {
  const dispatch = useAppDispatch();
  const { selectedPropertyId, properties } = usePropertySelection();
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const token = useAppSelector((state) => state.auth?.accessToken ?? undefined);
  const [formState, setFormState] = useState<UnitFormState>({ ...defaultFormState });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'bulk'>('list');
  const [bulkInput, setBulkInput] = useState<string>('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRoom, setAssignRoom] = useState<Unit | null>(null);
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const currentProperty = useMemo(
    () => properties.find((property: Property) => String(property.id) === String(selectedPropertyId)) ?? null,
    [properties, selectedPropertyId]
  );
  const currentPropertyIdValue = currentProperty?.id ?? null;
  const units = useAppSelector((state) => (
    currentPropertyIdValue ? state.units.items[currentPropertyIdValue] ?? EMPTY_UNITS : EMPTY_UNITS
  ));
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const isManager = authUser?.role === 'MANAGER';
  const canCreateUnit = isSuperAdmin;
  const canEditUnit = isSuperAdmin || isManager;
  const capacityEditable = currentProperty?.type === 'HOTEL' || formState.category === 'DORMITORY';

  const withUnitAuthRetry = async <T,>(request: (accessToken?: string) => Promise<T>): Promise<T> => {
    try {
      return await request(token);
    } catch (error) {
      if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 401) throw error;
      const refreshed = await refreshTokenApi();
      dispatch(updateAccessToken(refreshed.accessToken));
      return request(refreshed.accessToken);
    }
  };

  const categoryOptions = useMemo(() => {
    if (!currentProperty) return HOTEL_CATEGORIES;
    return currentProperty.type === "HOTEL" ? HOTEL_CATEGORIES : HOSTEL_CATEGORIES;
  }, [currentProperty]);

  const typeOptions = useMemo(() => {
    if (!currentProperty) return [{ label: "Room", value: "ROOM" }, { label: "Bed", value: "BED" }, { label: "Suite", value: "SUITE" }];
    if (currentProperty.type === "HOTEL") {
      return [{ label: "Room", value: "ROOM" }, { label: "Suite", value: "SUITE" }];
    }
    return [{ label: "Bed", value: "BED" }, { label: "Room", value: "ROOM" }, { label: "Suite", value: "SUITE" }];
  }, [currentProperty]);

  const availableFeatures = useMemo(() => {
    if (!currentProperty) return HOTEL_FEATURE_OPTIONS;
    if (currentProperty.type === "HOTEL") {
      return [...new Set([...HOTEL_FEATURE_OPTIONS, ...(HOTEL_FEATURE_PRESETS[formState.category] ?? [])])];
    }
    return [...new Set([...HOSTEL_FEATURE_OPTIONS, ...(HOSTEL_FEATURE_PRESETS[formState.category] ?? [])])];
  }, [currentProperty, formState.category]);

  const getDefaultFeatures = (propertyType?: string, typeValue = formState.type, categoryValue = formState.category) => {
    if (propertyType === "HOTEL") {
      if (typeValue === "SUITE") {
        return ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Balcony"];
      }
      return HOTEL_FEATURE_PRESETS[categoryValue] ?? ["WiFi", "TV", "Air Conditioning"];
    }

    return HOSTEL_FEATURE_PRESETS[categoryValue] ?? ["AC", "WiFi"];
  };

  useEffect(() => {
    if (!currentPropertyIdValue) return;
    console.log('[RoomsPage] Unit fetch scope:', {
      accountId: authUser?.id ?? null,
      selectedPropertyId: currentPropertyIdValue,
      propertyName: currentProperty?.name ?? null,
    });
    void dispatch(fetchUnits({ propertyId: currentPropertyIdValue, force: true }));
  }, [authUser?.id, currentProperty?.name, currentPropertyIdValue, dispatch]);

  const handleBulkInputChange = (value: string) => setBulkInput(value);

  const handleBulkSubmit = async () => {
    if (!currentProperty) return;
    if (!bulkInput.trim()) return showMessage('error', 'Bulk input is empty.');

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(bulkInput);
      if (!Array.isArray(parsed)) throw new Error('Bulk JSON must be an array of unit objects.');
    } catch (e) {
      return showMessage('error', e instanceof Error ? e.message : 'Invalid JSON payload.');
    }

    setIsBulkSaving(true);
    try {
      await withUnitAuthRetry((accessToken) => createUnitsBulkApi(currentProperty.id, parsed, accessToken));
      showMessage('success', 'Bulk units created.');
      setBulkInput('');
      setViewMode('list');
      await dispatch(fetchUnits({ propertyId: currentProperty.id, force: true })).unwrap();
    } catch (e) {
      showMessage('error', e instanceof Error ? e.message : 'Bulk create failed.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  useEffect(() => {
    if (!currentProperty) return;

    setFormState((prev) => ({
      ...prev,
      type: currentProperty.type === "HOTEL" ? "ROOM" : "BED",
      category: currentProperty.type === "HOTEL" ? HOTEL_CATEGORIES[0].value : HOSTEL_CATEGORIES[0].value,
      features: getDefaultFeatures(currentProperty.type, currentProperty.type === "HOTEL" ? "ROOM" : "BED", currentProperty.type === "HOTEL" ? HOTEL_CATEGORIES[0].value : HOSTEL_CATEGORIES[0].value),
    }));
    setSelectedUnit(null);
  }, [currentProperty]);

  const showMessage = (type: "success" | "error", text: string) => {
    setApiMessage({ type, text });
    setTimeout(() => setApiMessage(null), 5000);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "floor" || name === "capacity" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] ?? "" : value;
    setFormState((prev) => ({
      ...prev,
      type: selectedValue as UnitTypeValue,
      features: getDefaultFeatures(currentProperty?.type, selectedValue as UnitTypeValue, prev.category),
    }));
  };

  const handleCategoryChange = (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] ?? "" : value;
    setFormState((prev) => ({
      ...prev,
      category: selectedValue,
      capacity: FIXED_HOSTEL_CAPACITY[selectedValue] ?? prev.capacity,
      features: getDefaultFeatures(currentProperty?.type, prev.type, selectedValue),
    }));
  };

  const toggleFeature = (feature: string) => {
    setFormState((prev) => {
      const currentFeatures = prev.features;
      const isStatusFeature = feature === "AC" || feature === "NON-AC";

      if (isStatusFeature) {
        const withoutStatus = currentFeatures.filter((item) => item !== "AC" && item !== "NON-AC");
        return {
          ...prev,
          features: currentFeatures.includes(feature) ? withoutStatus : [...withoutStatus, feature],
        };
      }

      return {
        ...prev,
        features: currentFeatures.includes(feature)
          ? currentFeatures.filter((item) => item !== feature)
          : [...currentFeatures, feature],
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentProperty) return;

    setIsSaving(true);

    const normalizedFeatures = formState.features.map((item) => item.trim()).filter(Boolean);
    if (currentProperty.type !== "HOTEL" && !normalizedFeatures.some((feature) => ["AC", "NON-AC"].includes(feature.toUpperCase()))) {
      showMessage("error", "Hostel rooms must include AC or NON-AC in the selected features.");
      setIsSaving(false);
      return;
    }

    // Enforce pricing depending on property type
    if (currentProperty.type === 'HOTEL') {
      if (!formState.defaultPricePerNight || Number(formState.defaultPricePerNight) <= 0) {
        showMessage('error', 'Hotel units require a valid price per night.');
        setIsSaving(false);
        return;
      }
    } else {
      if (formState.defaultRecurringMonthlyRate === "" || Number(formState.defaultRecurringMonthlyRate) <= 0) {
        showMessage('error', 'Hostel units require a valid monthly rate.');
        setIsSaving(false);
        return;
      }
    }

    const payload: Partial<Unit> = {
      unitNumber: formState.unitNumber,
      floor: formState.floor,
      type: formState.type,
      category: formState.category,
      capacity: formState.capacity,
      defaultPricePerNight: currentProperty.type === 'HOTEL' ? Number(formState.defaultPricePerNight) : (formState.defaultPricePerNight ? Number(formState.defaultPricePerNight) : null),
      defaultRecurringMonthlyRate: currentProperty.type === 'HOTEL' ? (formState.defaultRecurringMonthlyRate === "" ? null : Number(formState.defaultRecurringMonthlyRate)) : Number(formState.defaultRecurringMonthlyRate),
      features: normalizedFeatures,
    };

    const maxFloor = currentProperty.floors ?? 1;
    if (formState.floor < 0 || formState.floor > maxFloor) {
      showMessage("error", `Floor must be between 0 and ${maxFloor}.`);
      setIsSaving(false);
      return;
    }

    if (!selectedUnit && !canCreateUnit) {
      showMessage("error", "Only Super Admin can create new rooms.");
      setIsSaving(false);
      return;
    }

    try {
      if (selectedUnit) {
        await withUnitAuthRetry((accessToken) => updateUnitApi(currentProperty.id, selectedUnit.id, payload, accessToken));
        showMessage("success", "Room updated successfully.");
      } else {
        await withUnitAuthRetry((accessToken) => createUnitApi(currentProperty.id, payload, accessToken));
        showMessage("success", "Room created successfully.");
      }
      setFormState({ ...defaultFormState });
      setSelectedUnit(null);
      setViewMode('list');
      await dispatch(fetchUnits({ propertyId: currentProperty.id, force: true })).unwrap();
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to save room.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormState({
      unitNumber: unit.unitNumber,
      floor: unit.floor,
      type: unit.type as UnitTypeValue,
      category: unit.category,
      capacity: unit.capacity,
      defaultPricePerNight: unit.defaultPricePerNight ?? "",
      defaultRecurringMonthlyRate: unit.defaultRecurringMonthlyRate ?? "",
      features: unit.features,
    });
    setViewMode('form');
  };

  const handleCancelEdit = () => {
    setSelectedUnit(null);
    setFormState({ ...defaultFormState });
    setViewMode('list');
  };

  const handleDelete = (unit: Unit) => setUnitToDelete(unit);

  const handleDeleteConfirm = async () => {
    if (!currentProperty || !unitToDelete) return;

    try {
      await withUnitAuthRetry((accessToken) => deleteUnitApi(currentProperty.id, unitToDelete.id, accessToken));
      showMessage("success", "Room removed from inventory.");
      setUnitToDelete(null);
      await dispatch(fetchUnits({ propertyId: currentProperty.id, force: true })).unwrap();
    } catch (error) {
      showMessage("error", error instanceof Error ? error.message : "Failed to delete room.");
    }
  };

  

  if (!currentProperty) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <SectionHeading>Rooms & Beds</SectionHeading>
        <EmptyState 
          icon="🏢"
          title="Please Select a Hostel"
          description="When 'All Properties' is selected, please select a specific hostel to view available rooms."
          fullHeight={true}
        />
      </div>
    );
  }

 return (
    <div className="space-y-8 pb-10 w-full">
      {apiMessage && (
        <div className={`rounded-2xl border p-4 text-sm ${apiMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {apiMessage.text}
        </div>
      )}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 flex items-center justify-between">
        <div>
          <SectionHeading>{viewMode === 'form' ? (selectedUnit ? 'Edit Unit' : 'Create Unit') : viewMode === 'bulk' ? 'Bulk Upload Units' : 'Rooms & Beds'}</SectionHeading>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {viewMode === 'list' ? <>Manage inventory for <strong>{currentProperty.name}</strong> ({currentProperty.type}).</> : 'Complete this workflow before returning to the inventory.'}
          </p>
        </div>
        <div className="flex gap-3">
          {viewMode === 'list' ? <><button onClick={() => { setSelectedUnit(null); setViewMode('form'); }} className="py-2 px-4 bg-slate-100 text-slate-800 rounded-full font-semibold">Create Unit</button><button onClick={() => { setViewMode('bulk'); }} className="py-2 px-4 bg-indigo-600 text-white rounded-full font-semibold">Bulk Upload</button></> : <button onClick={handleCancelEdit} className="py-2 px-4 bg-slate-100 text-slate-800 rounded-full font-semibold">Cancel</button>}
        </div>
      </div>

      

      <div>
        {viewMode === 'list' ? <div className="mb-6"><RoomStats units={units} /></div> : null}

        {viewMode === 'form' ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 mb-6">
            <UnitFormPanel
              formState={formState}
              typeOptions={typeOptions}
              categoryOptions={categoryOptions}
              availableFeatures={availableFeatures}
              propertyType={currentProperty.type ?? "HOTEL"}
              selectedUnit={selectedUnit}
              isSaving={isSaving}
              canEditUnit={canEditUnit}
              canCreateUnit={canCreateUnit}
              isManager={isManager}
              capacityEditable={capacityEditable}
              onInputChange={handleInputChange}
              onTypeChange={handleSelectChange}
              onCategoryChange={handleCategoryChange}
              onToggleFeature={toggleFeature}
              onSubmit={handleSubmit}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        ) : null}

        {viewMode === 'bulk' ? (
          <div className="mb-6">
            <BulkUnitCreatePanel
              canCreateUnit={canCreateUnit}
              bulkInput={bulkInput}
              onBulkInputChange={handleBulkInputChange}
              onSubmit={handleBulkSubmit}
              isBulkSaving={isBulkSaving}
            />
          </div>
        ) : null}

        {viewMode === 'list' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <RoomCard
              key={unit.id}
              room={unit}
              isHotel={currentProperty.type === 'HOTEL'}
              onView={handleEdit}
              onEdit={(u) => { setSelectedUnit(u); setViewMode('form'); }}
              onDelete={handleDelete}
              onAssignClick={(u) => { setAssignRoom(u); setShowAssignModal(true); }}
            />
          ))}
        </div> : null}
      </div>

      <AssignResidentModal
        show={showAssignModal}
        room={assignRoom}
        isHotel={currentProperty.type === 'HOTEL'}
        propertyId={currentProperty.id}
        token={token}
        onClose={() => setShowAssignModal(false)}
        onAssigned={async () => {
          try {
            await dispatch(fetchUnits({ propertyId: currentProperty.id, force: true })).unwrap();
          } catch (e) {
            console.error('Failed to refresh units after assignment', e);
          }
        }}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(unitToDelete)}
        title="Delete Unit"
        description={unitToDelete ? `Are you sure you want to remove ${unitToDelete.unitNumber} from inventory?` : ""}
        confirmLabel="Delete"
        onCancel={() => setUnitToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}