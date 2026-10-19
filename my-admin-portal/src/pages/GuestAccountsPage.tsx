import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector, usePropertySelection } from '../store/hooks';
import { addAccount, updateAccount } from '../store/slices/accountsSlice';
import { fetchGuestCards } from '../store/slices/guestCardsSlice';
import type { GuestCard } from '../types/guestCard.types';
import type { Account } from '../types/account.types';
import { ResidentFormPanel } from '../components/organisms/ResidentFormPanel';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { Select } from '../components/atoms/Select';
import { Avatar } from '../components/atoms/Avatar';
import { HotelBookingForm } from '../components/organisms/HotelBookingForm';
import { fetchReservations } from '../store/slices/reservationsSlice';
import { updateReservationStatus } from '../store/slices/reservationsSlice';
import type { Reservation } from '../types/reservation.types';
import { Badge } from '../components/atoms/Badge';
import { updateReservationApi } from '../services/reservationService';
import { updateAssignmentApi } from '../services/propertyService';
import { FormField } from '../components/molecules/FormField';

interface AggregatedGuestCard {
  cardType: 'aggregate';
  guest: Account;
  stays: GuestCard[];
}


const cardDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric',
});

function formatCardDate(value: string | null | undefined, fallback = 'Open') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : cardDateFormatter.format(date);
}

function getPreferredStay(stays: GuestCard[]) {
  const now = Date.now();
  return [...stays].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    const aIsFuture = new Date(a.checkIn).getTime() > now;
    const bIsFuture = new Date(b.checkIn).getTime() > now;
    if (aIsFuture !== bIsFuture) return aIsFuture ? -1 : 1;
    const aTime = new Date(a.checkIn).getTime() || 0;
    const bTime = new Date(b.checkIn).getTime() || 0;
    return aIsFuture ? aTime - bTime : bTime - aTime;
  })[0];
}

function sortGuestCards(cards: GuestCard[]) {
  const now = Date.now();
  return [...cards].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    const aTime = new Date(a.checkIn).getTime() || 0;
    const bTime = new Date(b.checkIn).getTime() || 0;
    const aIsFuture = aTime > now;
    const bIsFuture = bTime > now;
    if (aIsFuture !== bIsFuture) return aIsFuture ? -1 : 1;
    return aIsFuture ? aTime - bTime : bTime - aTime;
  });
}

function isFutureStay(card: GuestCard) {
  return (new Date(card.checkIn).getTime() || 0) > Date.now();
}

function GuestStayCard({ card, propertyTypeLabel, onHistory, onRebook, onEdit }: {
  card: GuestCard | AggregatedGuestCard;
  propertyTypeLabel: string;
  onHistory: () => void;
  onRebook: () => void;
  onEdit?: () => void;
}) {
  const guest = card.cardType === 'booking' ? card.primaryGuest : card.guest;
  const fullName = `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim() || 'Guest';
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const isActive = card.cardType === 'aggregate' ? card.stays.some((stay) => stay.isCurrent) : card.isCurrent;
  const latestStay = card.cardType === 'aggregate'
    ? getPreferredStay(card.stays)
    : card;
  const badgeClass = 'inline-flex max-w-full rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300';
  const actionClass = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-16px_rgba(30,41,59,0.18)] dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <header className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-base font-bold text-white shadow-sm sm:h-14 sm:w-14">{initials}</div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{fullName}</h3>
          <div className="mt-2">
            <span className={badgeClass}>
              {card.cardType === 'aggregate'
                ? `${card.stays.length} ${card.stays.length === 1 ? 'stay' : 'stays'}`
                : `${card.propertyName} (${propertyTypeLabel})`}
            </span>
          </div>
          <span title={isActive ? 'Currently staying' : 'Not currently staying'} aria-label={isActive ? 'Currently staying' : 'Not currently staying'} className="mt-2 inline-flex items-center">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ring-[3px] ${isActive ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-500/20' : 'bg-slate-400 ring-slate-100 dark:ring-slate-700'}`} />
          </span>
        </div>
        {onEdit ? (
          <button type="button" onClick={onEdit} title="Edit guest" aria-label={`Edit ${fullName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 shadow-sm transition-colors hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <i aria-hidden="true" className="fas fa-pen text-sm" />
          </button>
        ) : null}
      </header>

      <div className="flex-1 space-y-5 py-5">
        <div className="flex items-start gap-4 text-sm">
          <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{card.cardType === 'aggregate' ? 'Properties' : 'Room'}</span>
          {card.cardType === 'aggregate' ? (
            <span className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{Array.from(new Set(card.stays.map((stay) => stay.propertyName))).join(', ') || '—'}</span>
          ) : (
            <span className={badgeClass}>{card.cardType === 'guest' ? card.bed.unitNumber : card.room.unitNumber}</span>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          {card.cardType === 'aggregate' ? <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Latest stay</p> : null}
          <dl className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div className="min-w-0 pr-3">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Check-in</dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatCardDate(latestStay?.checkIn, '—')}</dd>
            </div>
            <div className="min-w-0 pl-3">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Check-out</dt>
              <dd className="mt-1.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatCardDate(latestStay?.checkOut)}</dd>
            </div>
          </dl>
        </div>

        {card.cardType !== 'aggregate' ? (
          <dl className="space-y-3 text-sm">
            {[{ label: 'Mobile', value: guest.phone }, { label: 'Emergency', value: guest.parentPhone }].map(({ label, value }) => (
              <div key={label} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <dt className="flex w-28 shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400"><i aria-hidden="true" className="fas fa-phone text-xs" />{label}</dt>
                <dd className="min-w-0 break-all font-medium tabular-nums text-slate-900 dark:text-slate-200">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {card.cardType === 'booking' ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Occupants</p>
            <div className="flex flex-wrap gap-2">
              {[{ id: card.primaryGuest.id, firstName: card.primaryGuest.firstName, lastName: card.primaryGuest.lastName, parentPhone: card.primaryGuest.parentPhone }, ...card.occupants].map((occupant) => (
                <span key={`${occupant.firstName}-${occupant.lastName}-${occupant.id ?? 'primary'}`} className="break-words rounded-lg bg-violet-50 px-2.5 py-1 text-xs text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  {occupant.firstName} {occupant.lastName}{occupant.parentPhone ? ` · ${occupant.parentPhone}` : ''}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button type="button" onClick={onHistory} className={`${actionClass} flex-1 text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800`}><i aria-hidden="true" className="fas fa-history" />History</button>
        <button type="button" onClick={onRebook} className={`${actionClass} flex-1 bg-violet-600 text-white shadow-sm hover:bg-violet-700`}><i aria-hidden="true" className="fas fa-calendar-plus" />Rebook</button>
        {/* Checkout had no handler in the supplied file; connect the existing checkout flow here. */}
        {isActive ? <button type="button" className={`${actionClass} flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20`}><i aria-hidden="true" className="fas fa-sign-out-alt" />Checkout</button> : null}
      </footer>
    </article>
  );
}

function BookingRequests({
  reservations,
  status,
  canManage,
  onStatusChange,
}: {
  reservations: Reservation[];
  status: string;
  canManage: boolean;
  onStatusChange: (reservation: Reservation, nextStatus: Reservation['status']) => void;
}) {
  const visibleReservations = reservations.filter(
    (reservation) => reservation.status === 'PENDING',
  );

  if (status === 'loading') {
    return <div className="p-10 text-center text-slate-500">Loading booking requests...</div>;
  }

  if (visibleReservations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
        No reservation requests found.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {visibleReservations.map((reservation) => (
        <div key={reservation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{reservation.guestName}</h3>
              <p className="mt-1 text-sm text-slate-500">{reservation.requestedType} � {reservation.requestedCategory} � {reservation.numberOfAdults + reservation.numberOfChildren} member(s)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Website Request
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{reservation.status}</span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3 dark:text-slate-300">
            <span>Check-in: {new Date(reservation.expectedCheckIn).toLocaleDateString()}</span>
            <span>Check-out: {reservation.expectedCheckOut ? new Date(reservation.expectedCheckOut).toLocaleDateString() : 'Open'}</span>
            <span>Contact: {reservation.mobile}</span>
          </div>

          {canManage && reservation.status === 'PENDING' ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <Button variant="primary" onClick={() => onStatusChange(reservation, 'APPROVED')}>Approve</Button>
              <Button variant="secondary" onClick={() => onStatusChange(reservation, 'REJECTED')}>Decline</Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function GuestAccountsPage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const { selectedProperty, selectedProperties, properties } = usePropertySelection();
  const [viewMode, setViewMode] = useState<'bookings' | 'form' | 'booking' | 'rebook' | 'requests'>('bookings');
  const [stayFilter, setStayFilter] = useState<'all' | 'current' | 'previous'>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | 'HOSTEL' | 'HOTEL'>('all');
  const [search, setSearch] = useState('');
  const [editingGuest, setEditingGuest] = useState<Account | null>(null);
  const [editingGuestCard, setEditingGuestCard] = useState<Extract<GuestCard, { cardType: 'guest' }> | null>(null);
  const [editingBookingProperty, setEditingBookingProperty] = useState<typeof selectedProperty>(null);
  const [editingBookingCard, setEditingBookingCard] = useState<Extract<GuestCard, { cardType: 'booking' }> | null>(null);
  const [rebookingGuest, setRebookingGuest] = useState<Account | null>(null);
  const [rebookingProperty, setRebookingProperty] = useState<typeof selectedProperty>(null);
  const [historyGuestId, setHistoryGuestId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reservations = useAppSelector((state) => state.reservations?.items ?? []);
  const reservationsStatus = useAppSelector((state) => state.reservations?.status ?? 'idle');
  const token = useAppSelector((state) => state.auth?.accessToken ?? null);
  const guestCardBuckets = useAppSelector((state) => state.guestCards.byProperty);
  const guestCards = useMemo(
    () => selectedProperties.flatMap((property) => guestCardBuckets[property.id] ?? []),
    [guestCardBuckets, selectedProperties],
  );
  const guestCardsAreLoading = useAppSelector((state) =>
    selectedProperties.some((property) => (state.guestCards?.statusByProperty?.[property.id] ?? 'idle') === 'loading'),
  );

  const getPropertyTypeLabel = (propertyId: number, propertyType?: string) => {
    const normalizedPropertyType = propertyType ?? selectedProperties.find((item) => item.id === propertyId)?.type;
    if (!normalizedPropertyType) return 'Property';
    if (normalizedPropertyType.startsWith('HOSTEL')) return 'Hostel';
    if (normalizedPropertyType === 'HOTEL' || normalizedPropertyType === 'CO_LIVING') return 'Hotel';
    return normalizedPropertyType.replace(/_/g, ' ');
  };

  const filteredGuestCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return guestCards.filter((card) => {
      const propertyTypeLabel = getPropertyTypeLabel(card.propertyId, card.propertyType);
      const guestName = card.cardType === 'guest'
        ? `${card.guest.firstName} ${card.guest.lastName}`.toLowerCase()
        : `${card.primaryGuest.firstName} ${card.primaryGuest.lastName}`.toLowerCase();
      const matchesType = propertyTypeFilter === 'all'
        || (propertyTypeFilter === 'HOSTEL' && propertyTypeLabel === 'Hostel')
        || (propertyTypeFilter === 'HOTEL' && propertyTypeLabel === 'Hotel');
      const matchesStay = stayFilter === 'all'
        || (stayFilter === 'current' && card.isCurrent)
        || (stayFilter === 'previous' && !card.isCurrent);
      const matchesSearch = !query || guestName.includes(query) || `${card.propertyName}`.toLowerCase().includes(query);

      return matchesType && matchesStay && matchesSearch;
    });
  }, [guestCards, propertyTypeFilter, stayFilter, search, selectedProperties]);

  const centralGuestCards = useMemo(() => sortGuestCards(filteredGuestCards), [filteredGuestCards]);
  const displayGuestCards = useMemo<(GuestCard | AggregatedGuestCard)[]>(() => {
    if (selectedProperty) return centralGuestCards;

    const grouped = new Map<number, GuestCard[]>();
    centralGuestCards.forEach((card) => {
      const account = card.cardType === 'guest' ? card.guest : card.primaryGuest;
      const stays = grouped.get(account.id) ?? [];
      stays.push(card);
      grouped.set(account.id, stays);
    });

    return Array.from(grouped.entries()).map(([, stays]) => {
      const latestCard = stays[0]!;
      return {
        cardType: 'aggregate',
        guest: latestCard.cardType === 'guest' ? latestCard.guest : latestCard.primaryGuest,
        stays,
      };
    });
  }, [centralGuestCards, selectedProperty]);
  const historyCards = useMemo(() => sortGuestCards(guestCards.filter((card) => {
    const accountId = card.cardType === 'guest' ? card.guest.id : card.primaryGuest.id;
    return accountId === historyGuestId;
  })), [guestCards, historyGuestId]);
  const historyGuest = historyCards[0]
    ? historyCards[0].cardType === 'guest' ? historyCards[0].guest : historyCards[0].primaryGuest
    : null;

  useEffect(() => {
    if (!token || selectedProperties.length === 0) return;
    void Promise.all(selectedProperties.map((property) => dispatch(fetchGuestCards(property.id)).unwrap()));
  }, [dispatch, selectedProperties, token]);

  useEffect(() => {
    void dispatch(fetchReservations(selectedProperty ? { propertyId: selectedProperty.id } : {}));
  }, [dispatch, selectedProperty?.id]);

  const handleSubmit = async (data: Partial<Account> & { unitId?: string; checkIn?: string | null; checkOut?: string | null }) => {
    try {
      if (editingGuest) {
        const { checkIn, checkOut, unitId, ...accountData } = data;
        const propertyId = editingGuestCard?.propertyId ?? selectedProperty?.id ?? null;
        const reservationId = editingGuestCard?.reservationId ?? null;
        const nextCheckIn = checkIn ?? editingGuestCard?.checkIn ?? undefined;
        const nextCheckOut = checkOut ?? editingGuestCard?.checkOut ?? undefined;
        const currentUnitId = editingGuest.unitAssignments?.[0]?.unitId;
        const unitChanged = unitId !== undefined && String(unitId) !== String(currentUnitId ?? '');

        console.log('[GuestAccountsPage] hostel guest update payload', {
          editingGuestId: editingGuest.id,
          propertyId,
          reservationId,
          nextCheckIn,
          nextCheckOut,
          formCheckIn: checkIn,
          formCheckOut: checkOut,
          savedCheckIn: editingGuestCard?.checkIn,
          savedCheckOut: editingGuestCard?.checkOut,
        });

        await dispatch(updateAccount({
          ...accountData,
          id: editingGuest.id,
          ...(unitChanged ? { unitId } : {}),
        })).unwrap();

        if (propertyId && reservationId && token && (nextCheckIn || nextCheckOut)) {
          await updateReservationApi(propertyId, reservationId, {
            expectedCheckIn: nextCheckIn,
            expectedCheckOut: nextCheckOut,
          }, token);
        } else if (propertyId && editingGuestCard?.assignmentId && token && (nextCheckIn || nextCheckOut)) {
          await updateAssignmentApi(propertyId, editingGuestCard.assignmentId, {
            expectedCheckIn: nextCheckIn,
            expectedCheckOut: nextCheckOut,
          }, token);
        }

        const propertiesToRefresh = Array.from(
          new Set([
            propertyId,
            selectedProperty?.id,
          ].filter((id): id is number => typeof id === 'number')),
        );

        if (propertiesToRefresh.length > 0 && token) {
          await Promise.all(propertiesToRefresh.map((id) => dispatch(fetchGuestCards(id)).unwrap()));
        }
      } else {
        const { checkIn, checkOut, ...accountData } = data;
        await dispatch(addAccount({
          ...accountData,
          role: 'CUSTOMER',
          ...(checkIn !== undefined ? { checkIn: checkIn ?? null } : {}),
          ...(checkOut !== undefined ? { checkOut: checkOut ?? null } : {}),
        } as Partial<Account> & { checkIn?: string | null; checkOut?: string | null; role: 'CUSTOMER' })).unwrap();
      }

      setViewMode('bookings');
      setEditingGuest(null);
      setEditingGuestCard(null);
      setEditingBookingCard(null);
      setEditingBookingProperty(null);
      setMessage(editingGuest ? 'Guest updated successfully.' : 'Guest created successfully.');
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Request failed.');
    }
  };

  const isHotel = selectedProperty?.type === 'HOTEL';
  const refreshReservations = () => void dispatch(fetchReservations(selectedProperty ? { propertyId: selectedProperty.id } : {}));
  const canManageReservations = authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'MANAGER';

  const handleReservationStatus = async (reservation: Reservation, nextStatus: Reservation['status']) => {
    try {
      await dispatch(updateReservationStatus({ propertyId: reservation.propertyId, reservationId: reservation.id, status: nextStatus })).unwrap();
      refreshReservations();
      setMessage(`Reservation marked ${nextStatus === 'NO_SHOW' ? 'walked out' : nextStatus.toLowerCase()}.`);
    } catch (reservationError) {
      setMessage(reservationError instanceof Error ? reservationError.message : 'Failed to update reservation.');
    }
  };

  const refreshGuestCards = (propertyIds: number[] = selectedProperties.map((property) => property.id)) => {
    if (!token) return;
    const uniquePropertyIds = Array.from(new Set(propertyIds));
    void Promise.all(uniquePropertyIds.map((propertyId) => dispatch(fetchGuestCards(propertyId)).unwrap()));
  };

  const clearFormState = () => {
    setEditingGuest(null);
    setEditingGuestCard(null);
    setEditingBookingCard(null);
    setEditingBookingProperty(null);
    setRebookingGuest(null);
    setRebookingProperty(null);
    setViewMode('bookings');
  };

  const handleBackToList = () => {
    clearFormState();
  };

  const handleStartRebook = (guest: Account) => {
    setEditingGuest(null);
    setEditingGuestCard(null);
    setEditingBookingCard(null);
    setEditingBookingProperty(null);
    setRebookingGuest(guest);
    setRebookingProperty(null);
    setViewMode('rebook');
  };

  const handleEditGuest = (card: Extract<GuestCard, { cardType: 'guest' }>) => {
    setEditingGuest(card.guest);
    setEditingGuestCard(card);
    setEditingBookingCard(null);
    setEditingBookingProperty(selectedProperties.find((property) => property.id === card.propertyId) ?? selectedProperty);
    setViewMode('form');
  };

  const handleEditBooking = (card: Extract<GuestCard, { cardType: 'booking' }>) => {
    setEditingGuest(card.primaryGuest);
    setEditingBookingCard(card);
    setEditingGuestCard(null);
    setEditingBookingProperty(selectedProperties.find((property) => property.id === card.propertyId) ?? selectedProperty);
    setViewMode('booking');
  };

  const isFormView = viewMode === 'form' || viewMode === 'booking' || viewMode === 'rebook';
  const isListView = viewMode === 'bookings';

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        {isFormView ? (
          <>
            <div>
              <SectionHeading accent="indigo">{viewMode === 'booking' ? 'New Booking' : (editingGuest ? 'Edit Guest' : 'New Guest')}</SectionHeading>
              <p className="text-sm text-slate-500">
                {viewMode === 'booking' ? 'Create or edit a hotel booking.' : 'Fill in the guest details below.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={handleBackToList}>Back</Button>
            </div>
          </>
        ) : viewMode === 'requests' ? (
          <>
            <div>
              <SectionHeading accent="indigo">Reservation Requests</SectionHeading>
              <p className="text-sm text-slate-500">Review and manage pending guest reservations.</p>
            </div>
            <Button variant="secondary" type="button" onClick={handleBackToList}>Back to Guests</Button>
          </>
        ) : (
          <>
            <div>
              <SectionHeading accent="indigo">Guests</SectionHeading>
              <p className="text-sm text-slate-500">Available and previously approved guests for the selected property.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedProperty?.type?.startsWith('HOSTEL_') ? (
                <Button variant="secondary" onClick={() => { setEditingGuest(null); setEditingGuestCard(null); setEditingBookingCard(null); setEditingBookingProperty(null); setViewMode('form'); }}>New Guest</Button>
              ) : null}
              {isHotel ? (
                <Button variant="primary" onClick={() => { setEditingGuest(null); setEditingGuestCard(null); setEditingBookingCard(null); setEditingBookingProperty(null); setViewMode('booking'); }}>New Booking</Button>
              ) : null}
              <Button variant="secondary" onClick={() => setViewMode('requests')}>Reservation Requests</Button>
            </div>
          </>
        )}
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      {isListView && selectedProperties.length > 0 ? (
        <div className="space-y-4">
          {historyGuestId && historyGuest ? (
            <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${historyGuest.firstName} ${historyGuest.lastName}`} className="h-11 w-11 text-[11px]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Guest history</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{historyGuest.firstName} {historyGuest.lastName}</h3>
                  </div>
                </div>
                <Button variant="secondary" icon="fa-times" onClick={() => setHistoryGuestId(null)}>Close History</Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {historyCards.map((card) => {
                  const isHostelCard = card.cardType === 'guest';
                  const unit = isHostelCard ? card.bed : card.room;
                  return (
                    <div key={`${card.cardType}-${card.assignmentId}`} className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-500/20 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-900 dark:text-white">Room {unit.unitNumber}</p>
                        <Badge variant={card.isCurrent ? 'success' : 'neutral'}>{card.isCurrent ? 'Current' : isFutureStay(card) ? 'Upcoming' : 'Previous'}</Badge>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{card.propertyName} · {getPropertyTypeLabel(card.propertyId, card.propertyType)}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span>Check-in<br /><strong>{new Date(card.checkIn).toLocaleDateString()}</strong></span>
                        <span>Check-out<br /><strong>{card.checkOut ? new Date(card.checkOut).toLocaleDateString() : 'Open'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Search guest name" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select
                options={[
                  { label: 'All property types', value: 'all' },
                  { label: 'Hostel', value: 'HOSTEL' },
                  { label: 'Hotel', value: 'HOTEL' },
                ]}
                value={propertyTypeFilter}
                onChange={(value) => setPropertyTypeFilter(String(value) as 'all' | 'HOSTEL' | 'HOTEL')}
              />
              <Select
                options={[
                  { label: 'All stays', value: 'all' },
                  { label: 'Current', value: 'current' },
                  { label: 'Previous', value: 'previous' },
                ]}
                value={stayFilter}
                onChange={(value) => setStayFilter(String(value) as 'all' | 'current' | 'previous')}
              />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-stretch gap-5">
            {guestCardsAreLoading ? (
              <p className="text-sm text-slate-500">Loading current and previous guests...</p>
            ) : displayGuestCards.length === 0 ? (
              <p className="text-sm text-slate-500">No booked or previous guests found for this property.</p>
            ) : displayGuestCards.map((card) => {
              const account = card.cardType === 'booking' ? card.primaryGuest : card.guest;
              const editCard = card.cardType === 'aggregate'
                ? [...card.stays].sort((a, b) => (new Date(b.checkIn).getTime() || 0) - (new Date(a.checkIn).getTime() || 0))[0]
                : card;
              return (
                <GuestStayCard
                  key={card.cardType === 'aggregate' ? `aggregate-${account.id}` : `${card.cardType}-${card.propertyId}-${card.assignmentId}`}
                  card={card}
                  propertyTypeLabel={card.cardType === 'aggregate' ? '' : getPropertyTypeLabel(card.propertyId, card.propertyType)}
                  onHistory={() => setHistoryGuestId(account.id)}
                  onRebook={() => handleStartRebook(account)}
                  onEdit={editCard ? () => {
                    if (editCard.cardType === 'guest') handleEditGuest(editCard);
                    else handleEditBooking(editCard);
                  } : undefined}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {isFormView ? (
        viewMode === 'rebook' ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50/60 p-6 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <SectionHeading accent="indigo">Rebook Guest</SectionHeading>
              <p className="text-sm text-slate-600 dark:text-slate-300">{rebookingGuest?.firstName} {rebookingGuest?.lastName} is being rebooked with their saved profile.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FormField label="Booking Property" required>
                  <Select
                    options={[{ label: 'Select property', value: '' }, ...properties.map((property) => ({ label: `${property.name} (${property.type})`, value: String(property.id) }))]}
                    value={rebookingProperty?.id ? String(rebookingProperty.id) : ''}
                    onChange={(value) => {
                      const propertyId = Number(Array.isArray(value) ? value[0] : value);
                      setRebookingProperty(properties.find((property) => property.id === propertyId) ?? null);
                    }}
                  />
                </FormField>
              </div>
            </div>
            {rebookingGuest && rebookingProperty ? (
              <HotelBookingForm
                property={rebookingProperty}
                rebookingAccount={rebookingGuest}
                onCancel={handleBackToList}
                onSuccess={() => {
                  refreshGuestCards();
                  clearFormState();
                  setRebookingGuest(null);
                  setRebookingProperty(null);
                  setMessage('Guest rebooked successfully.');
                }}
              />
            ) : null}
          </div>
        ) : viewMode === 'booking' && (editingBookingProperty || selectedProperty) ? (
          <HotelBookingForm
            property={(editingBookingProperty || selectedProperty)!}
            editAccount={editingGuest}
            editBooking={editingBookingCard}
            onCancel={() => {
              clearFormState();
            }}
            onSuccess={() => {
              refreshReservations();
              refreshGuestCards();
              clearFormState();
              setMessage(editingGuest ? 'Guest updated successfully.' : 'Booking created successfully.');
            }}
          />
        ) : viewMode === 'form' ? (
          <ResidentFormPanel
            guestMode
            editing={editingGuest}
            onCancel={() => {
              clearFormState();
            }}
            onSubmit={handleSubmit}
            showHeading={false}
            initialCheckIn={editingGuestCard?.checkIn ?? null}
            initialCheckOut={editingGuestCard?.checkOut ?? null}
          />
        ) : null
      ) : viewMode === 'requests' ? (
        <BookingRequests
          reservations={reservations}
          status={reservationsStatus}
          canManage={canManageReservations}
          onStatusChange={handleReservationStatus}
        />
      ) : null}
    </div>
  );
}
