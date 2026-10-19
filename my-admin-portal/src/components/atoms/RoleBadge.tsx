import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';
import type { AccountRole } from '../../types/account.types';

const ROLE_CONFIG: Record<AccountRole, { icon: string; variant: BadgeVariant; label: string }> = {
  SUPER_ADMIN: { icon: 'fa-crown', variant: 'info', label: 'SUPER ADMIN' },
  MANAGER: { icon: 'fa-user-tie', variant: 'success', label: 'MANAGER' },
  STAFF: { icon: 'fa-people-carry', variant: 'info', label: 'STAFF' },
  CUSTOMER: { icon: 'fa-user', variant: 'neutral', label: 'CUSTOMER' },
};

export interface RoleBadgeProps {
  role: AccountRole | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as AccountRole] ?? { icon: 'fa-user', variant: 'neutral' as BadgeVariant, label: role };

  return (
    <Badge variant={config.variant} className={className}>
      <i className={`fas ${config.icon} mr-1.5`}></i> {config.label}
    </Badge>
  );
}