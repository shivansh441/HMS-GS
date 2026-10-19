import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { RoleBadge } from '../atoms/RoleBadge';
import { Card } from '../molecules/Card';
import type { Account } from '../../types/account.types';
import { canDeleteAccount, canManageAccount } from '../../utils/accountPermissions';

interface EmployeeCardProps {
  account: Account;
  currentAccount?: Account | null;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function EmployeeCard({ account, currentAccount, onEdit, onDelete }: EmployeeCardProps) {
  const isInactive = account.isActive === false;
  const department = account.department || 'General';
  const isCurrentUser = currentAccount?.id === account.id;
  const canEdit = canManageAccount(currentAccount, account);
  const canDelete = canDeleteAccount(currentAccount, account);

  return (
    <Card isInactive={isInactive} className={`${isInactive ? 'opacity-70' : ''} ${isCurrentUser ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10' : ''}`}>
      <Card.Header>
        <div className="flex items-center gap-4">
          <Avatar src={account.photoUrl ?? undefined} name={`${account.firstName} ${account.lastName}`} isInactive={isInactive} className="h-14 w-14" />
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{account.firstName} {account.lastName}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <RoleBadge role={account.role} />
              {isInactive ? <Badge variant="danger">Inactive</Badge> : null}
              <Badge variant="neutral">{department}</Badge>
            </div>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i className="fas fa-phone" />
            <span>{account.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i className="fas fa-envelope" />
            <span>{account.email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <i className="fas fa-calendar" />
            <span>{account.joinDate ? String(account.joinDate).split('T')[0] : 'N/A'}</span>
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" icon="fa-pen" onClick={() => onEdit(account)} className="flex-1" disabled={!canEdit}>
          Edit Profile
        </Button>
        {canDelete ? (
          <Button variant="danger" icon="fa-trash-alt" onClick={() => onDelete(account)} />
        ) : null}
      </Card.Footer>
    </Card>
  );
}

export default EmployeeCard;