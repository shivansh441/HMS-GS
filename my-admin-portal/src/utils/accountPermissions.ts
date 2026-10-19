import type { Account, PropertyRef } from '../types/account.types';

export function normalizeRole(role?: string | null): string {
  return (role || '').toUpperCase();
}

function getPropertyIds(properties?: Array<PropertyRef | number> | null): number[] {
  return (properties ?? [])
    .map((property) => (typeof property === 'number' ? property : property.id))
    .filter((propertyId) => Number.isFinite(propertyId));
}

export function getPropertyDisplayNames(properties?: Array<PropertyRef | number> | null): string[] {
  return (properties ?? [])
    .map((property) => (typeof property === 'number' ? String(property) : property.name))
    .filter(Boolean) as string[];
}

export function hasSharedPropertyAccess(target: Account | null | undefined, viewer: Account | null | undefined): boolean {
  if (!target || !viewer) {
    return false;
  }

  if (viewer.role === 'SUPER_ADMIN') {
    return true;
  }

  if (viewer.role !== 'MANAGER') {
    return false;
  }

  const viewerPropertyIds = new Set(getPropertyIds(viewer.managedProperties));
  const targetPropertyIds = getPropertyIds(target.staffProperties ?? target.managedProperties);

  if (viewerPropertyIds.size === 0) {
    return false;
  }

  return targetPropertyIds.some((propertyId) => viewerPropertyIds.has(propertyId));
}

export function canManageAccount(viewer: Account | null | undefined, target: Account | null | undefined): boolean {
  if (!viewer || !target) {
    return false;
  }

  const viewerRole = normalizeRole(viewer.role);
  const targetRole = normalizeRole(target.role);

  if (viewerRole === 'SUPER_ADMIN') {
    return true;
  }

  if (viewerRole === 'MANAGER') {
    return targetRole === 'STAFF' && hasSharedPropertyAccess(target, viewer);
  }

  return false;
}

export function canDeleteAccount(viewer: Account | null | undefined, target: Account | null | undefined): boolean {
  if (!viewer || !target) {
    return false;
  }

  const viewerRole = normalizeRole(viewer.role);
  const targetRole = normalizeRole(target.role);

  if (viewerRole === 'SUPER_ADMIN') {
    return target.id !== viewer.id && targetRole !== 'SUPER_ADMIN';
  }

  if (viewerRole === 'MANAGER') {
    return targetRole === 'STAFF' && hasSharedPropertyAccess(target, viewer);
  }

  return false;
}

export function canCreateAccount(viewer: Account | null | undefined): boolean {
  return viewer?.role === 'SUPER_ADMIN' || viewer?.role === 'MANAGER';
}

export function canAssignRole(viewer: Account | null | undefined, nextRole: Account['role']): boolean {
  if (!viewer) {
    return false;
  }

  const viewerRole = normalizeRole(viewer.role);
  const normalizedNextRole = normalizeRole(nextRole);

  if (viewerRole === 'SUPER_ADMIN') {
    return normalizedNextRole === 'SUPER_ADMIN' || normalizedNextRole === 'MANAGER' || normalizedNextRole === 'STAFF';
  }

  if (viewerRole === 'MANAGER') {
    return normalizedNextRole === 'STAFF';
  }

  return false;
}

export function getRoleOptions(viewer: Account | null | undefined) {
  const viewerRole = normalizeRole(viewer?.role);

  if (viewerRole === 'SUPER_ADMIN') {
    return [
      { label: 'Super Admin', value: 'SUPER_ADMIN' },
      { label: 'Manager', value: 'MANAGER' },
      { label: 'Staff', value: 'STAFF' },
    ];
  }

  if (viewerRole === 'MANAGER') {
    return [{ label: 'Staff', value: 'STAFF' }];
  }

  return [{ label: 'Staff', value: 'STAFF' }];
}
