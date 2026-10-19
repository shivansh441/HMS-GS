import { useEffect } from "react";
import { Select, type SelectOption } from "../atoms/Select";
import { useAppSelector, usePropertySelection } from "../../store/hooks";

interface PropertySelectorProps {
  currentHostelId?: string;
  onChange: (id: string) => void;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOSTEL_BOYS: 'Hostel (Boys)',
  HOSTEL_GIRLS: 'Hostel (Girls)',
  HOSTEL_COED: 'Hostel (Co-ed)',
  HOTEL: 'Hotel',
  CO_LIVING: 'Co-living',
};

export function PropertySelector({ currentHostelId, onChange }: PropertySelectorProps) {
  const { properties, selectedPropertyId } = usePropertySelection();
  const isSuperAdmin = useAppSelector((state) => state.auth?.user?.role === "SUPER_ADMIN");
  const list = properties;

  const selectOptions: SelectOption[] = [
    ...(isSuperAdmin ? [{ value: "", label: "All properties" }] : []),
    ...list.map((h) => {
      const propertyType = h.type;
      const typeLabel = propertyType ? PROPERTY_TYPE_LABELS[propertyType] ?? propertyType : '';
      return {
        value: String(h.id),
        label: `${h.name}${typeLabel ? ` (${typeLabel})` : ''}`,
      };
    }),
  ];
  const selectorValue = currentHostelId ?? (selectedPropertyId ? String(selectedPropertyId) : "");

  useEffect(() => {
    console.log('[PropertySelector] Available properties:', {
      count: properties.length,
      properties: properties.map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type,
      })),
      selectedPropertyId,
      selectorValue,
      options: selectOptions.map((option) => option.value),
    });
  }, [properties, selectedPropertyId, selectorValue, isSuperAdmin]);

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-700">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
        Active Property
      </p>
      
      <Select
        value={selectorValue}
        onChange={(value) => {
          const nextValue = typeof value === "string" ? value : value[0] ?? "";
          console.log('[PropertySelector] Property selected:', {
            previousValue: selectorValue,
            nextValue,
            selectedProperty: properties.find((property) => String(property.id) === nextValue) ?? null,
          });
          onChange(nextValue);
        }}
        options={selectOptions}
      />
    </div>
  );
}