import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../atoms/Button';
import { SectionHeading } from '../atoms/SectionHeading';
import type { SelectOption } from '../atoms/Select';
import { UnitBasicFields } from '../molecules/UnitBasicFields';
import { UnitTypeCategoryFields } from '../molecules/UnitTypeCategoryFields';
import { UnitCapacityPricingFields } from '../molecules/UnitCapacityPricingFields';
import { FeatureToggleGroup } from '../molecules/FeatureToggleGroup';
import type { Unit, UnitFormState as UnitFormStateType } from '../../types/unit.types';


interface UnitFormPanelProps {
  formState: UnitFormStateType;
  typeOptions: SelectOption[];
  categoryOptions: SelectOption[];
  availableFeatures: string[];
  propertyType: string;
  capacityEditable: boolean;
  selectedUnit: Unit | null;
  isSaving: boolean;
  canEditUnit: boolean;
  canCreateUnit: boolean;
  isManager: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTypeChange: (value: string | string[]) => void;
  onCategoryChange: (value: string | string[]) => void;
  onToggleFeature: (feature: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}

export function UnitFormPanel({
  formState,
  typeOptions,
  categoryOptions,
  availableFeatures,
  propertyType,
  capacityEditable,
  selectedUnit,
  isSaving,
  canEditUnit,
  canCreateUnit,
  isManager,
  onInputChange,
  onTypeChange,
  onCategoryChange,
  onToggleFeature,
  onSubmit,
  onCancelEdit,
}: UnitFormPanelProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center justify-between gap-4 mb-6">
        <SectionHeading>{selectedUnit ? 'Edit Unit' : 'Create Unit'}</SectionHeading>
        <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
          {propertyType === 'HOTEL' ? 'Hotel mode' : 'Hostel mode'}
        </span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <UnitBasicFields unitNumber={formState.unitNumber} floor={formState.floor} onChange={onInputChange} />

        <UnitTypeCategoryFields
          typeValue={formState.type}
          typeOptions={typeOptions}
          onTypeChange={onTypeChange}
          categoryValue={formState.category}
          categoryOptions={categoryOptions}
          onCategoryChange={onCategoryChange}
        />

        <UnitCapacityPricingFields
          capacity={formState.capacity}
          defaultPricePerNight={formState.defaultPricePerNight}
          defaultRecurringMonthlyRate={formState.defaultRecurringMonthlyRate}
          propertyType={propertyType}
          capacityEditable={capacityEditable}
          onChange={onInputChange}
        />

        <FeatureToggleGroup
          availableFeatures={availableFeatures}
          selectedFeatures={formState.features}
          onToggle={onToggleFeature}
          helperLabel={propertyType === 'HOTEL' ? 'Hotel room presets' : 'Hostel feature selection'}
          hint={
            propertyType !== 'HOTEL'
              ? 'Hostel rooms must include either AC or NON-AC so the backend validation passes.'
              : undefined
          }
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isSaving} disabled={!canEditUnit || (!selectedUnit && !canCreateUnit)}>
            {selectedUnit ? 'Update Unit' : canCreateUnit ? 'Create Unit' : 'Create Disabled'}
          </Button>
          {selectedUnit && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancel Edit
            </Button>
          )}
        </div>

        {isManager && !selectedUnit && (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            Managers can edit existing rooms, but new room creation requires Super Admin privileges.
          </p>
        )}
      </form>
    </section>
  );
}