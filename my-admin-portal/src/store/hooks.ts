import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import type { Property } from "../types/property.types";
import { setSelectedPropertyId } from "./slices/propertiesSlice";

const EMPTY_PROPERTIES: Property[] = [];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Custom hook to get the currently selected property
 * @returns The selected property object or null if none selected
 */
export const useSelectedProperty = (): Property | null => {
  const selectedPropertyId = useAppSelector((state) => state.properties?.selectedPropertyId ?? null);
  const properties = useAppSelector((state) => state.properties?.list ?? EMPTY_PROPERTIES);
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find((property) => String(property.id) === String(selectedPropertyId)) ?? null;
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    console.log("[useSelectedProperty]", {
      selectedPropertyId,
      selectedProperty,
      propertyCount: properties.length,
    });
  }, [selectedPropertyId, selectedProperty, properties]);

  return selectedProperty;
};

/**
 * Custom hook to get property selection state and handlers
 * @returns Object with selected property, all properties, and selection handler
 */
export const usePropertySelection = () => {
  const dispatch = useAppDispatch();
  const selectedPropertyId = useAppSelector((state) => state.properties?.selectedPropertyId ?? null);
  const properties = useAppSelector((state) => state.properties?.list ?? EMPTY_PROPERTIES);
  const propertiesStatus = useAppSelector((state) => state.properties?.status ?? 'idle');
  const userRole = useAppSelector((state) => state.auth?.user?.role);
  const accessiblePropertyIds = useMemo(
    () => properties.map((property) => String(property.id)),
    [properties]
  );
  const selectedPropertyIds = useMemo(
    () => selectedPropertyId ? [String(selectedPropertyId)] : accessiblePropertyIds,
    [selectedPropertyId, accessiblePropertyIds]
  );
  // A specific sidebar choice narrows the active scope; null means all accessible properties.
  const selectedProperties = useMemo(
    () => selectedPropertyId
      ? properties.filter((property) => String(property.id) === String(selectedPropertyId))
      : properties,
    [properties, selectedPropertyId]
  );

  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find((property) => String(property.id) === String(selectedPropertyId)) ?? null;
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    console.debug('[usePropertySelection] Scope changed', {
      userRole,
      propertiesStatus,
      selectedPropertyId,
      propertyCount: properties.length,
      propertyIds: properties.map((property) => property.id),
      propertyTypes: properties.map((property) => property.type),
      selectedPropertyIds,
      selectedPropertyIdsType: typeof selectedPropertyIds,
      selectedProperties: selectedProperties.map((property) => ({ id: property.id, type: property.type })),
    });
    if (
      userRole !== 'SUPER_ADMIN' &&
      !selectedPropertyId &&
      propertiesStatus === 'succeeded' &&
      properties.length > 0
    ) {
      dispatch(setSelectedPropertyId(String(properties[0].id)));
    }
  }, [dispatch, properties, propertiesStatus, selectedPropertyId, userRole]);

  const handleSetSelectedPropertyId = (id: string | null) => {
    dispatch(setSelectedPropertyId(id));
  };

  return {
    selectedProperty,
    selectedPropertyId,
    selectedPropertyIds,
    selectedProperties,
    accessiblePropertyIds,
    properties,
    propertiesStatus,
    setSelectedPropertyId: handleSetSelectedPropertyId,
  };
};