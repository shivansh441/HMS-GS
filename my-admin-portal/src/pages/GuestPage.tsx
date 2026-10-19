import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { fetchReservations, updateReservationStatus } from '../store/slices/reservationsSlice';
import type { Reservation } from '../types/reservation.types';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { Badge } from '../components/atoms/Badge';
import { EmptyState } from '../components/atoms/EmptyState';
import { Card } from '../components/molecules/Card';
import { DeleteConfirmDialog } from '../components/organisms/DeleteConfirmDialog';

gsap.registerPlugin(useGSAP);

const HOSTEL_PROPERTY_TYPES = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED'];
const HOTEL_PROPERTY_TYPES = ['HOTEL', 'CO_LIVING'];

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PROPERTY_VIEW_OPTIONS = [
  { label: 'All Properties', value: 'all' },
  { label: 'Hostels', value: 'hostel' },
  { label: 'Hotels', value: 'hotel' },
];

const GUEST_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Hotel Guest', value: 'HOTEL_GUEST' },
  { label: 'Hostel Guest', value: 'HOSTEL_GUEST' },
  { label: 'Hosteler', value: 'HOSTELER' },
];

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
};

export default function GuestPage() {
  const dispatch = useAppDispatch();
  const reservations = useAppSelector((state) => state.reservations?.items ?? []);
  const reservationsStatus = useAppSelector((state) => state.reservations?.status ?? 'idle');
  const selectedPropertyId = useAppSelector((state) => state.properties?.selectedPropertyId ?? null);
  const properties = useAppSelector((state) => state.properties?.list ?? []);
  const accounts = useAppSelector((state) => state.residents?.items ?? []);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);

  const [statusFilter, setStatusFilter] = useState('');
  const [guestTypeFilter, setGuestTypeFilter] = useState('');
  const [propertyView, setPropertyView] = useState<'all' | 'hostel' | 'hotel'>('all');
  const [search, setSearch] = useState('');
  const [reservationToAction, setReservationToAction] = useState<Reservation | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPropertyId) {
      void dispatch(fetchReservations({ propertyId: Number(selectedPropertyId) }));
      return;
    }

    const normalizedPropertyTypes = propertyView === 'hostel'
      ? HOSTEL_PROPERTY_TYPES
      : propertyView === 'hotel'
        ? HOTEL_PROPERTY_TYPES
        : [...new Set([...HOSTEL_PROPERTY_TYPES, ...HOTEL_PROPERTY_TYPES])];

    const propertyIds = properties
      .filter((property) => !property.type || normalizedPropertyTypes.includes(property.type))
      .map((property) => property.id);

    void dispatch(fetchReservations({
      propertyIds: propertyIds.length ? propertyIds : undefined,
      propertySubTypes: propertyView === 'all' ? undefined : normalizedPropertyTypes,
    }));
  }, [dispatch, properties, propertyView, selectedPropertyId]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus = !statusFilter || reservation.status === statusFilter;
      const matchesType = !guestTypeFilter || reservation.requestedCustomerType === guestTypeFilter;
      const matchesSearch = !search || 
        reservation.guestName.toLowerCase().includes(search.toLowerCase()) ||
        reservation.mobile.includes(search) ||
        (reservation.email && reservation.email.toLowerCase().includes(search.toLowerCase()));
      
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [reservations, statusFilter, guestTypeFilter, search]);

  const canApproveReservation = (reservation: Reservation) => {
    // SUPER_ADMIN can approve any reservation
    if (authUser?.role === 'SUPER_ADMIN') return true;
    
    // MANAGER can only approve reservations for their properties
    if (authUser?.role === 'MANAGER') {
      const currentAccount = accounts.find(acc => acc.id === Number(authUser.id));
      const managedProperties = currentAccount?.managedProperties || [];
      
      const canManage = managedProperties.some(prop => 
        typeof prop === 'number' ? prop === reservation.propertyId : prop.id === reservation.propertyId
      );
      return canManage;
    }
    
    return false;
  };

  const isPaymentCompleted = (reservation: Reservation) => {
    // Check if reservation has payment status from financial ledgers
    if (reservation.paymentStatus === 'PAID') return true;
    
    // Check if any financial ledger is fully paid
    if (reservation.financialLedgers && reservation.financialLedgers.length > 0) {
      return reservation.financialLedgers.some((ledger: any) => ledger.status === 'PAID');
    }
    
    return false;
  };

  const getAccountForReservation = useCallback((reservation: Reservation) => {
    return accounts.find(account => 
      account.email === reservation.email || 
      account.phone === reservation.mobile ||
      `${account.firstName} ${account.lastName}` === reservation.guestName
    );
  }, [accounts]);

  const accountStats = useMemo(() => {
    const withAccountsCount = reservations.filter(r => {
      return accounts.some(account => 
        account.email === r.email || 
        account.phone === r.mobile ||
        `${account.firstName} ${account.lastName}` === r.guestName
      );
    }).length;

    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'PENDING').length,
      withAccounts: withAccountsCount
    };
  }, [reservations, accounts]);

  // GSAP Animations
  useGSAP(() => {
    const scope = containerRef.current;
    if (!scope) {
      console.debug('[GuestPage] Animation skipped: container is not mounted');
      return;
    }

    const headers = scope.querySelectorAll<HTMLElement>('.guest-header');
    const cards = scope.querySelectorAll<HTMLElement>('.guest-card');
    console.debug('[GuestPage] Animation targets', {
      reservationCount: reservations.length,
      accountCount: accounts.length,
      headerCount: headers.length,
      cardCount: cards.length,
    });

    if (headers.length === 0 && cards.length === 0) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (headers.length > 0) {
      tl.fromTo(headers,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      );
    }

    if (cards.length > 0) {
      tl.fromTo(cards,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)'
        },
        headers.length > 0 ? '-=0.4' : undefined
      );
    }
  }, { scope: containerRef, dependencies: [reservations, accounts] });

  const handleAction = (reservation: Reservation, action: 'approve' | 'reject' | 'cancel') => {
    setReservationToAction(reservation);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!reservationToAction || !actionType) return;

    try {
      const newStatus = actionType === 'approve' ? 'APPROVED' : 
                         actionType === 'reject' ? 'REJECTED' : 'CANCELLED';
      
      await dispatch(updateReservationStatus({
        propertyId: Number(selectedPropertyId),
        reservationId: reservationToAction.id,
        status: newStatus
      })).unwrap();
      
      void dispatch(fetchReservations({ propertyId: Number(selectedPropertyId) }));
    } catch (error) {
      console.error('Failed to update reservation:', error);
    } finally {
      setReservationToAction(null);
      setActionType(null);
    }
  };

  const getActionDialogInfo = () => {
    if (!reservationToAction || !actionType) return null;

    const messages = {
      approve: {
        title: 'Approve Reservation',
        description: `Approve reservation for ${reservationToAction.guestName}? This will allocate the requested units.`,
        confirmLabel: 'Approve',
      },
      reject: {
        title: 'Reject Reservation',
        description: `Reject reservation for ${reservationToAction.guestName}? This action cannot be undone.`,
        confirmLabel: 'Reject',
      },
      cancel: {
        title: 'Cancel Reservation',
        description: `Cancel reservation for ${reservationToAction.guestName}? This will release the allocated units.`,
        confirmLabel: 'Cancel',
      },
    };

    return messages[actionType];
  };

  // Show empty state when no hostel is selected
  if (!selectedPropertyId) {
    return (
      <div ref={containerRef} className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <SectionHeading accent="indigo">Guest Reservations</SectionHeading>
        <EmptyState 
          icon="🏢"
          title="Please Select a Hostel"
          description="When 'All Properties' is selected, please select a specific hostel to view guest reservations."
          fullHeight={true}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Header */}
      <div className="guest-header flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionHeading accent="indigo">Guest Reservations</SectionHeading>
          <p className="text-sm text-slate-500">Manage booking requests and guest accommodations.</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{accountStats.total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{accountStats.pending}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">With Accounts</p>
            <p className="text-2xl font-bold text-emerald-600">{accountStats.withAccounts}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="guest-header rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="grid gap-4 md:grid-cols-5">
          <Input 
            placeholder="Search by name, phone, or email" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <Select
            options={PROPERTY_VIEW_OPTIONS}
            value={propertyView}
            onChange={(value) => setPropertyView(value as 'all' | 'hostel' | 'hotel')}
          />
          <Select 
            options={STATUS_OPTIONS} 
            value={statusFilter} 
            onChange={(value) => setStatusFilter(value as string)} 
          />
          <Select 
            options={GUEST_TYPE_OPTIONS} 
            value={guestTypeFilter} 
            onChange={(value) => setGuestTypeFilter(value as string)} 
          />
        </div>
      </div>

      {/* Reservation Cards */}
      {reservationsStatus === 'loading' ? (
        <div className="guest-card text-center py-20 text-slate-500">Loading reservations...</div>
      ) : filteredReservations.length === 0 ? (
        <div className="guest-card text-center py-20 text-slate-500">
          <p>No reservations found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="guest-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Guest Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {reservation.guestName}
                    </h3>
                    <Badge className={STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS]}>
                      {reservation.status}
                    </Badge>
                    {getAccountForReservation(reservation) && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        Account Exists
                      </Badge>
                    )}
                    {reservation.status === 'PENDING' && (
                      <Badge className={isPaymentCompleted(reservation) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                        {isPaymentCompleted(reservation) ? 'Payment Done' : 'Payment Pending'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Phone:</span>
                      <span>{reservation.mobile}</span>
                    </div>
                    {reservation.email && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email:</span>
                        <span>{reservation.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{reservation.requestedCustomerType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Check-in:</span>
                      <span>{new Date(reservation.expectedCheckIn).toLocaleDateString()}</span>
                    </div>
                    {reservation.expectedCheckOut && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Check-out:</span>
                        <span>{new Date(reservation.expectedCheckOut).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Requested:</span>
                      <span>{reservation.requestedQuantity} {reservation.requestedType === 'BED' ? 'bed(s)' : 'room(s)'} ({reservation.requestedCategory})</span>
                    </div>
                    {reservation.purpose && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Purpose:</span>
                        <span>{reservation.purpose}</span>
                      </div>
                    )}
                    {reservation.specialRequests && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Special Requests:</span>
                        <span>{reservation.specialRequests}</span>
                      </div>
                    )}
                    {getAccountForReservation(reservation) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                        <span className="font-medium text-emerald-600">Linked Account:</span>
                        <span className="text-emerald-600">{getAccountForReservation(reservation)?.firstName} {getAccountForReservation(reservation)?.lastName}</span>
                      </div>
                    )}
                    {reservation.status === 'PENDING' && !isPaymentCompleted(reservation) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200">
                        <span className="font-medium text-rose-600">⚠️ Payment Required:</span>
                        <span className="text-rose-600">Booking can only be approved after payment completion</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 md:flex-col">
                  {reservation.status === 'PENDING' && (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={() => handleAction(reservation, 'approve')}
                        disabled={!isPaymentCompleted(reservation) || !canApproveReservation(reservation)}
                        className={!isPaymentCompleted(reservation) || !canApproveReservation(reservation) ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleAction(reservation, 'reject')}
                        disabled={!canApproveReservation(reservation)}
                        className={!canApproveReservation(reservation) ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {(reservation.status === 'APPROVED' || reservation.status === 'CONVERTED') && (
                    <Button 
                      variant="secondary" 
                      onClick={() => handleAction(reservation, 'cancel')}
                      disabled={!canApproveReservation(reservation)}
                      className={!canApproveReservation(reservation) ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!reservationToAction}
        title={getActionDialogInfo()?.title || ''}
        description={getActionDialogInfo()?.description || ''}
        confirmLabel={getActionDialogInfo()?.confirmLabel || ''}
        cancelLabel="Cancel"
        onCancel={() => {
          setReservationToAction(null);
          setActionType(null);
        }}
        onConfirm={confirmAction}
      />
    </div>
  );
}