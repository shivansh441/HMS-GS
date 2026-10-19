import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Card } from '../molecules/Card';
import type { Account } from '../../types/account.types';
import type { BadgeVariant } from '../atoms/Badge';

interface ResidentCardProps {
  resident: Account;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const CUSTOMER_TYPE_STYLES: Record<string, { label: string; variant: BadgeVariant }> = {
  HOSTELER: { label: 'Hosteler', variant: 'success' },
  HOSTEL_GUEST: { label: 'Hostel Guest', variant: 'info' },
  HOTEL_GUEST: { label: 'Hotel Guest', variant: 'warning' },
  NONE: { label: 'Customer', variant: 'neutral' },
};

export function ResidentCard({ resident, canEdit, canDelete, onEdit, onDelete }: ResidentCardProps) {
  const identity = CUSTOMER_TYPE_STYLES[resident.customerType ?? 'NONE'] ?? CUSTOMER_TYPE_STYLES.NONE;

  return (
    <Card className={resident.isActive === false ? 'opacity-80' : ''}>
      <Card.Header>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{resident.firstName} {resident.lastName}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={identity.variant}>{identity.label}</Badge>
            {resident.isActive === false ? <Badge variant="danger">Inactive</Badge> : null}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <i className="fas fa-phone" />
            <span>{resident.phone || 'Phone not provided'}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-envelope" />
            <span>{resident.email || 'Email not provided'}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt" />
            <span>{resident.city || resident.state ? `${resident.city ?? ''}${resident.city && resident.state ? ', ' : ''}${resident.state ?? ''}` : 'Location not set'}</span>
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" icon="fa-pen" onClick={onEdit} disabled={!canEdit}>
          Edit
        </Button>
        {canDelete ? (
          <Button variant="danger" icon="fa-trash-alt" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </Card.Footer>
    </Card>
  );
}
