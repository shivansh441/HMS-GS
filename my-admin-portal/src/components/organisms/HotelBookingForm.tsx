import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUnits } from '../../store/slices/unitsSlice';
import { createHotelBookingApi, updateReservationApi, type HotelOccupant, type HotelBookingPayload } from '../../services/reservationService';
import { refreshTokenApi } from '../../services/authService';
import { updateAccessToken } from '../../store/slices/authSlice';
import type { Property } from '../../types/property.types';
import type { Account } from '../../types/account.types';
import type { GuestCard } from '../../types/guestCard.types';
import type { Unit } from '../../types/unit.types';
import { updateAccount } from '../../store/slices/accountsSlice';
import { updateGuestCardOccupants } from '../../services/guestCardService';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from '../molecules/FormField';
import { PhotoUploadField } from '../atoms/PhotoUploadField';
import { GenderSelect } from '../atoms/GenderSelect';

interface HotelBookingFormProps {
  property: Property;
  onCancel: () => void;
  onSuccess: () => void;
  editAccount?: Account | null;
  editBooking?: Extract<GuestCard, { cardType: 'booking' }> | null;
  rebookingAccount?: Account | null;
}

const emptyOccupant = (): HotelOccupant => ({
  firstName: '',
  lastName: '',
  gender: null,
  parentPhone: null,
  age: undefined,
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  idType: 'AADHAAR',
  idNumber: '',
});

const EMPTY_UNITS: Unit[] = [];

const toDateInputValue = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getAge = (dateOfBirth: string) => {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthOffset = today.getMonth() - birthDate.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
};

const normalizeGender = (value: string | null | undefined): HotelOccupant['gender'] => (
  value === 'MALE' || value === 'FEMALE' || value === 'OTHER' ? value : null
);

interface NumberStepperProps {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}

function NumberStepper({ label, value, min, onChange }: NumberStepperProps) {
  return (
    <FormField label={label}>
      <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="h-full w-11 text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={value}
          onChange={(event) => {
            const nextValue = Number(event.target.value.replace(/\D/g, ''));
            onChange(Number.isFinite(nextValue) ? Math.max(min, nextValue) : min);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none dark:text-white"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="h-full w-11 text-lg font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </FormField>
  );
}

export function HotelBookingForm({ property, onCancel, onSuccess, editAccount = null, editBooking = null, rebookingAccount = null }: HotelBookingFormProps) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth?.accessToken ?? null);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);
  const units = useAppSelector((state) => state.units?.items[property.id] ?? EMPTY_UNITS);
  const unitsStatus = useAppSelector((state) => state.units?.statusByProperty[property.id] ?? 'idle');
  const [unitId, setUnitId] = useState('');
  const selectedRoomId = editBooking ? String(editBooking.room.id) : unitId;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Account['gender']>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [idType, setIdType] = useState('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [idProofPhotoUrl, setIdProofPhotoUrl] = useState<string | undefined>();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [occupants, setOccupants] = useState<HotelOccupant[]>([]);
  const [sameAddressForOccupants, setSameAddressForOccupants] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sourceAccount = editAccount ?? rebookingAccount;
    if (!sourceAccount) return;
    setFirstName(sourceAccount.firstName);
    setLastName(sourceAccount.lastName);
    setMobile(sourceAccount.phone ?? '');
    setParentPhone(sourceAccount.parentPhone ?? '');
    setEmail(sourceAccount.email ?? '');
    setGender(sourceAccount.gender ?? null);
    setDateOfBirth(sourceAccount.dateOfBirth ? toDateInputValue(sourceAccount.dateOfBirth) : '');
    setAddress(sourceAccount.address ?? '');
    setCity(sourceAccount.city ?? '');
    setState(sourceAccount.state ?? '');
    setPincode(sourceAccount.pincode ?? '');
    setIdType(sourceAccount.idType ?? 'AADHAAR');
    setIdNumber(sourceAccount.idNumber ?? '');
    setPhotoUrl(sourceAccount.photoUrl ?? undefined);
  }, [editAccount, rebookingAccount]);

  useEffect(() => {
    if (!editBooking) return;
    if (import.meta.env.DEV) {
      console.debug('[HotelBookingForm] Hydrating booking occupants', editBooking.occupants.map((occupant) => ({
        name: `${occupant.firstName} ${occupant.lastName}`,
        age: occupant.age,
        dateOfBirth: occupant.dateOfBirth ?? null,
        gender: occupant.gender,
      })));
    }
    setUnitId(String(editBooking.room.id));
    setCheckIn(toDateInputValue(editBooking.checkIn));
    setCheckOut(toDateInputValue(editBooking.checkOut));
    setFirstName(editBooking.primaryGuest.firstName);
    setLastName(editBooking.primaryGuest.lastName);
    setMobile(editBooking.primaryGuest.phone ?? '');
    setParentPhone(editBooking.primaryGuest.parentPhone ?? '');
    setEmail(editBooking.primaryGuest.email ?? '');
    setGender(editBooking.primaryGuest.gender ?? null);
    setDateOfBirth(editBooking.primaryGuest.dateOfBirth ? toDateInputValue(editBooking.primaryGuest.dateOfBirth) : '');
    setAddress(editBooking.primaryGuest.address ?? '');
    setCity(editBooking.primaryGuest.city ?? '');
    setState(editBooking.primaryGuest.state ?? '');
    setPincode(editBooking.primaryGuest.pincode ?? '');
    setIdType(editBooking.primaryGuest.idType ?? 'AADHAAR');
    setIdNumber(editBooking.primaryGuest.idNumber ?? '');
    setPhotoUrl(editBooking.primaryGuest.photoUrl ?? undefined);
    const adultOccupants = 1 + editBooking.occupants.filter((occupant) => Number(occupant.age ?? 0) >= 18).length;
    const childOccupants = editBooking.occupants.filter((occupant) => Number(occupant.age ?? 0) < 18).length;
    setAdultCount(Math.max(1, adultOccupants));
    setChildCount(Math.max(0, childOccupants));
    setOccupants(editBooking.occupants.map((occupant) => ({
      firstName: occupant.firstName,
      lastName: occupant.lastName,
      gender: normalizeGender(occupant.gender),
      parentPhone: occupant.parentPhone ?? null,
      age: occupant.age ?? undefined,
      dateOfBirth: occupant.dateOfBirth ? toDateInputValue(occupant.dateOfBirth) : '',
      address: occupant.address ?? '',
      city: occupant.city ?? '',
      state: occupant.state ?? '',
      pincode: occupant.pincode ?? '',
      idType: occupant.idType ?? 'AADHAAR',
      idNumber: occupant.idNumber ?? '',
      photoUrl: occupant.photoUrl ?? undefined,
      idProofPhotoUrl: occupant.idProofPhotoUrl ?? undefined,
    })));
    setSameAddressForOccupants(editBooking.occupants.map(() => false));
  }, [editBooking]);

  useEffect(() => {
    if (unitsStatus === 'idle') void dispatch(fetchUnits({ propertyId: property.id }));
  }, [dispatch, property.id, unitsStatus]);

  useEffect(() => {
    if (editBooking) {
      setUnitId(String(editBooking.room.id));
    }
  }, [editBooking]);

  const availableRooms = useMemo(() => {
    const currentSelection = editBooking ? String(editBooking.room.id) : null;
    return units.filter((unit) => {
      const validUnitTypes = property.type?.startsWith('HOSTEL_') ? ['BED'] : ['ROOM', 'SUITE'];
      if (!validUnitTypes.includes(unit.type)) return false;
      return unit.status === 'AVAILABLE' || unit.status === 'OCCUPIED' || (currentSelection && String(unit.id) === currentSelection);
    });
  }, [editBooking, units]);

  useEffect(() => {
    const additionalOccupantCount = Math.max(0, adultCount + childCount - 1);
    setOccupants((current) => {
      const source = current.length > 0
        ? current
        : (editBooking ? editBooking.occupants.map((occupant) => ({
            firstName: occupant.firstName,
            lastName: occupant.lastName,
            gender: normalizeGender(occupant.gender),
            parentPhone: occupant.parentPhone ?? null,
            age: occupant.age ?? undefined,
            dateOfBirth: occupant.dateOfBirth ? toDateInputValue(occupant.dateOfBirth) : '',
            address: occupant.address ?? '',
            city: occupant.city ?? '',
            state: occupant.state ?? '',
            pincode: occupant.pincode ?? '',
            idType: occupant.idType ?? 'AADHAAR',
            idNumber: occupant.idNumber ?? '',
            photoUrl: occupant.photoUrl ?? undefined,
            idProofPhotoUrl: occupant.idProofPhotoUrl ?? undefined,
          })) : []);
      const next = Array.from({ length: additionalOccupantCount }, (_, index) => source[index] ?? emptyOccupant());
      return next;
    });
  }, [adultCount, childCount, editBooking]);

  const updateOccupant = (index: number, field: keyof HotelOccupant, value: string) => {
    setOccupants((current) => current.map((occupant, occupantIndex) => {
      if (occupantIndex !== index) return occupant;
      if (field === 'dateOfBirth') {
        const nextDob = value;
        return { ...occupant, dateOfBirth: nextDob, age: nextDob ? getAge(nextDob) : undefined };
      }
      if (field === 'age') {
        return { ...occupant, age: value ? Number(value) : undefined };
      }
      return { ...occupant, [field]: value };
    }));
  };

  const readPhoto = (event: React.ChangeEvent<HTMLInputElement>, onRead: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onRead(String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!sameAddressForOccupants.some(Boolean)) return;
    setOccupants((current) => current.map((occupant, index) => sameAddressForOccupants[index]
      ? { ...occupant, address, city, state, pincode }
      : occupant));
  }, [address, city, state, pincode, sameAddressForOccupants]);

  const buildBookingOccupants = () => {
    const primaryOccupant: HotelOccupant = {
      isPrimary: true,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: mobile.trim() || null,
      gender,
      parentPhone: parentPhone.trim() || null,
      age: getAge(dateOfBirth),
      dateOfBirth,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      idType,
      idNumber: idNumber.trim(),
      photoUrl,
      idProofPhotoUrl,
    };
    return [primaryOccupant, ...occupants.filter((occupant) => occupant.firstName.trim() || occupant.lastName.trim() || occupant.idNumber.trim())];
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requiredPrimaryFields: Array<[string, string]> = [
      ['First name', firstName],
      ['Last name', lastName],
      ['Gender', gender ?? ''],
      ['Date of birth', dateOfBirth],
      ['Address', address],
      ['City', city],
      ['State', state],
      ['Pincode', pincode],
      ['ID number', idNumber],
      ['Check-in date', checkIn],
      ['Check-out date', checkOut],
    ];
    const missingPrimaryFields = requiredPrimaryFields
      .filter(([, value]) => !String(value).trim())
      .map(([label]) => label);

    if (missingPrimaryFields.length > 0) {
      if (import.meta.env.DEV) {
        console.debug('[HotelBookingForm] Missing required primary fields', {
          missing: missingPrimaryFields,
          values: { firstName, lastName, gender, dateOfBirth, address, city, state, pincode, idNumber, checkIn, checkOut },
        });
      }
      return setError(`Complete the required fields: ${missingPrimaryFields.join(', ')}.`);
    }
    if (new Date(checkIn) >= new Date(checkOut)) return setError('Check-out must be after check-in.');

    if (editAccount && editBooking) {
      setIsSaving(true);
      setError(null);
      try {
        await dispatch(updateAccount({
          id: editAccount.id,
          role: 'CUSTOMER',
          customerType: 'HOTEL_GUEST',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: mobile.trim(),
          parentPhone: parentPhone.trim() || null,
          email: email.trim() || null,
          gender,
          dateOfBirth: dateOfBirth || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          idType: idType as Account['idType'],
          idNumber: idNumber.trim() || null,
          photoUrl: photoUrl ?? null,
          propertyIds: editAccount.propertyIds?.length ? editAccount.propertyIds : [editBooking.propertyId],
        })).unwrap();

        if (editBooking.reservationId && token) {
          await updateReservationApi(
            editBooking.propertyId,
            editBooking.reservationId,
            {
              guestName: `${firstName.trim()} ${lastName.trim()}`,
              mobile: mobile.trim(),
              email: email.trim() || null,
              expectedCheckIn: checkIn,
              expectedCheckOut: checkOut,
              numberOfAdults: adultCount,
              numberOfChildren: childCount,
            },
            token
          );
        }

        if (token) {
          const payload = {
            primaryAccountKyc: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: mobile.trim(),
              email: email.trim() || null,
              dateOfBirth: dateOfBirth || null,
              address: address.trim() || null,
              city: city.trim() || null,
              state: state.trim() || null,
              pincode: pincode.trim() || null,
              idType: idType as Account['idType'],
              idNumber: idNumber.trim() || null,
              photoUrl: photoUrl ?? null,
              gender,
              parentPhone: parentPhone.trim() || null,
            },
            accompanyingGuests: occupants
              .filter((occupant) => occupant.firstName.trim() || occupant.lastName.trim() || occupant.idNumber.trim())
              .map((occupant) => ({
                firstName: occupant.firstName.trim(),
                lastName: occupant.lastName.trim(),
                age: occupant.age ?? null,
                gender: occupant.gender ?? null,
                parentPhone: occupant.parentPhone?.trim() || null,
                dateOfBirth: occupant.dateOfBirth || null,
                idType: occupant.idType ?? 'AADHAAR',
                idNumber: occupant.idNumber.trim(),
                address: occupant.address.trim(),
                city: occupant.city.trim(),
                state: occupant.state.trim(),
                pincode: occupant.pincode.trim(),
                photoUrl: occupant.photoUrl ?? null,
              })),
          };
          await updateGuestCardOccupants(editBooking.propertyId, editBooking.assignmentId, payload, token);
        }

        onSuccess();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Booking update failed.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (rebookingAccount) {
      const selectedUnit = availableRooms.find((unit) => String(unit.id) === unitId);
      if (!token || !authUser || !selectedUnit) return setError('Select an available room.');
      if (!dateOfBirth || !idNumber.trim()) return setError('Complete the returning guest date of birth and ID details.');
      if (adultCount + childCount > selectedUnit.capacity) return setError(`This room capacity is ${selectedUnit.capacity}; guest count cannot exceed capacity.`);
      if (occupants.some((occupant) => !occupant.firstName.trim() || !occupant.lastName.trim() || !occupant.gender || !occupant.address.trim() || !occupant.city.trim() || !occupant.state.trim() || !occupant.pincode.trim() || !occupant.idNumber.trim())) return setError('Complete every additional occupant name, gender, address, and ID number.');

      setIsSaving(true);
      setError(null);
      const isHostelRebooking = property.type?.startsWith('HOSTEL_') ?? false;
      const payload: HotelBookingPayload = {
        existingAccountId: rebookingAccount.id,
        propertyId: property.id,
        unitId: selectedUnit.id,
        guestName: `${firstName.trim()} ${lastName.trim()}`,
        mobile: mobile.trim(),
        parentPhone: parentPhone.trim() || undefined,
        email: email.trim() || undefined,
        dateOfBirth,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        idType,
        idNumber: idNumber.trim(),
        photoUrl,
        idProofPhotoUrl,
        bookingSource: 'MANUAL' as const,
        customerType: isHostelRebooking ? 'HOSTEL_GUEST' as const : 'HOTEL_GUEST' as const,
        requestedCategory: selectedUnit.category,
        requestedType: selectedUnit.type as 'BED' | 'ROOM' | 'SUITE',
        requestedQuantity: 1,
        numberOfAdults: adultCount,
        numberOfChildren: childCount,
        expectedCheckIn: checkIn,
        expectedCheckOut: checkOut,
        occupants: buildBookingOccupants(),
      };

      try {
        await createHotelBookingApi(payload, token);
        onSuccess();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Rebooking failed.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (editAccount) {
      if (!dateOfBirth || !idNumber.trim()) return setError('Complete the guest date of birth and ID details.');
      setIsSaving(true);
      setError(null);
      try {
        await dispatch(updateAccount({
          id: editAccount.id,
          role: 'CUSTOMER',
          customerType: 'HOTEL_GUEST',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: mobile.trim(),
          parentPhone: parentPhone.trim() || null,
          email: email.trim() || null,
          gender,
          dateOfBirth: dateOfBirth || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          idType: idType as Account['idType'],
          idNumber: idNumber.trim() || null,
          photoUrl: photoUrl ?? null,
          propertyIds: editAccount.propertyIds ?? [],
        })).unwrap();
        onSuccess();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Guest update failed.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const selectedUnit = availableRooms.find((unit) => String(unit.id) === unitId);
    if (!token || !authUser || !selectedUnit) return setError('Select an available room.');
    if (!dateOfBirth || !idNumber.trim()) return setError('Complete the primary guest, date of birth, address, ID, and stay details.');
    if (adultCount + childCount > selectedUnit.capacity) return setError(`This room capacity is ${selectedUnit.capacity}; guest count cannot exceed capacity.`);
    if (occupants.some((occupant) => !occupant.firstName.trim() || !occupant.lastName.trim() || !occupant.gender || !occupant.address.trim() || !occupant.city.trim() || !occupant.state.trim() || !occupant.pincode.trim() || !occupant.idNumber.trim())) return setError('Complete every additional occupant name, gender, address, and ID number.');

    setIsSaving(true);
    setError(null);
    const payload = {
      propertyId: property.id,
      unitId: selectedUnit.id,
      guestName: `${firstName.trim()} ${lastName.trim()}`,
      mobile: mobile.trim(),
      parentPhone: parentPhone.trim() || undefined,
      email: email.trim() || undefined,
      dateOfBirth,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      idType,
      idNumber: idNumber.trim(),
      photoUrl,
      idProofPhotoUrl,
      bookingSource: 'MANUAL' as const,
      customerType: 'HOTEL_GUEST' as const,
      requestedCategory: selectedUnit.category,
      requestedType: selectedUnit.type as 'BED' | 'ROOM' | 'SUITE',
      requestedQuantity: 1 as const,
      numberOfAdults: adultCount,
      numberOfChildren: childCount,
      expectedCheckIn: checkIn,
      expectedCheckOut: checkOut,
      occupants: buildBookingOccupants(),
    };

    if (import.meta.env.DEV) {
      console.debug('[HotelBookingForm] Submitting booking occupants', payload.occupants.map((occupant) => ({
        name: `${occupant.firstName} ${occupant.lastName}`,
        age: occupant.age,
        dateOfBirth: occupant.dateOfBirth ?? null,
        gender: occupant.gender,
        parentPhone: occupant.parentPhone ?? null,
      })));
    }

    try {
      await createHotelBookingApi(payload, token);
      onSuccess();
    } catch (submitError) {
      const status = submitError instanceof Error && (submitError as Error & { status?: number }).status;
      if (status === 401) {
        try {
          const refreshed = await refreshTokenApi();
          dispatch(updateAccessToken(refreshed.accessToken));
          await createHotelBookingApi(payload, refreshed.accessToken);
          onSuccess();
          return;
        } catch (retryError) {
          setError(retryError instanceof Error ? retryError.message : 'Booking failed after token refresh.');
        }
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Booking failed.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeading accent="indigo">{editAccount ? 'Edit Guest' : rebookingAccount ? 'Rebook Guest' : 'New Booking'}</SectionHeading>
      </div>
      <p className="text-sm text-slate-500">{property.name}: select one available room and enter every occupant staying in it.</p>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40">
        <SectionHeading accent="emerald">Room Association</SectionHeading>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <FormField label="Available Room" required>
              <Select
                options={[{ label: unitsStatus === 'loading' ? 'Loading rooms...' : 'Select room', value: '' }, ...availableRooms.map((unit) => ({ label: `${unit.unitNumber} - ${unit.type} / ${unit.category} (capacity ${unit.capacity})`, value: String(unit.id) }))]}
                value={selectedRoomId}
                onChange={(value) => setUnitId(String(Array.isArray(value) ? value[0] : value))}
              />
            </FormField>
          </div>
          <NumberStepper label="Adults" value={adultCount} min={1} onChange={setAdultCount} />
          <NumberStepper label="Children" value={childCount} min={0} onChange={setChildCount} />
        </div>
        <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">
          Room capacity: {availableRooms.find((unit) => String(unit.id) === unitId)?.capacity ?? '-'} | Members: {adultCount + childCount}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40">
        <SectionHeading accent="amber">Primary Guest</SectionHeading>

        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <SectionHeading accent="indigo">Basic Profile</SectionHeading>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="First Name" required>
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              </FormField>
              <FormField label="Last Name" required>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </FormField>
              <FormField label="Mobile">
                <Input value={mobile} onChange={(event) => setMobile(event.target.value)} />
              </FormField>
              <FormField label="Emergency Number">
                <Input value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="Emergency contact number" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </FormField>
              <FormField label="Gender" required>
                <GenderSelect value={gender ?? ''} onChange={(value) => setGender(value as Account['gender'])} />
              </FormField>
              <FormField label="Date of Birth" required>
                <Input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
              </FormField>
              <FormField label="Age">
                <Input value={dateOfBirth ? String(getAge(dateOfBirth)) : ''} readOnly />
              </FormField>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <SectionHeading accent="emerald">Address</SectionHeading>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField label="Address" required>
                  <Input value={address} onChange={(event) => setAddress(event.target.value)} />
                </FormField>
              </div>
              <FormField label="City" required>
                <Input value={city} onChange={(event) => setCity(event.target.value)} />
              </FormField>
              <FormField label="State" required>
                <Input value={state} onChange={(event) => setState(event.target.value)} />
              </FormField>
              <FormField label="Pincode" required>
                <Input value={pincode} onChange={(event) => setPincode(event.target.value)} />
              </FormField>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <SectionHeading accent="indigo">Identity & Documents</SectionHeading>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="ID Type" required>
                <Select
                  options={[{ label: 'Aadhaar', value: 'AADHAAR' }, { label: 'PAN', value: 'PAN' }, { label: 'Passport', value: 'PASSPORT' }, { label: 'Driving License', value: 'DRIVING_LICENSE' }, { label: 'Other', value: 'OTHER' }]}
                  value={idType}
                  onChange={(value) => setIdType(String(Array.isArray(value) ? value[0] : value))}
                />
              </FormField>
              <FormField label="ID Number" required>
                <Input value={idNumber} onChange={(event) => setIdNumber(event.target.value)} />
              </FormField>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <PhotoUploadField label="Guest Photo" preview={photoUrl ?? null} onChange={(event) => readPhoto(event, setPhotoUrl)} />
              <PhotoUploadField label="ID Proof Photo" preview={idProofPhotoUrl ?? null} onChange={(event) => readPhoto(event, setIdProofPhotoUrl)} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <SectionHeading accent="amber">Stay Details</SectionHeading>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Check-in" required>
                <Input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
              </FormField>
              <FormField label="Check-out" required>
                <Input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
              </FormField>
            </div>
          </section>
        </div>
      </div>

      {occupants.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/40">
          <SectionHeading accent="indigo">Additional Occupants</SectionHeading>
          <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">
            <span>Room capacity: {availableRooms.find((unit) => String(unit.id) === unitId)?.capacity ?? '-'} | Members: {adultCount + childCount}</span>
            <span>Use the checkbox in each occupant's Address section to copy the primary address.</span>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {occupants.map((occupant, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Occupant {index + 2}</h4>

                <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Basic Profile</h5>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <FormField label="First Name" required><Input value={occupant.firstName} onChange={(event) => updateOccupant(index, 'firstName', event.target.value)} /></FormField>
                    <FormField label="Last Name" required><Input value={occupant.lastName} onChange={(event) => updateOccupant(index, 'lastName', event.target.value)} /></FormField>
                    <FormField label="Gender" required><GenderSelect value={occupant.gender ?? ''} onChange={(value) => updateOccupant(index, 'gender', value)} /></FormField>
                    <FormField label="Emergency Number"><Input value={occupant.parentPhone ?? ''} onChange={(event) => updateOccupant(index, 'parentPhone', event.target.value)} placeholder="Emergency contact number" /></FormField>
                    <FormField label="Date of Birth"><Input type="date" value={occupant.dateOfBirth ?? ''} onChange={(event) => updateOccupant(index, 'dateOfBirth', event.target.value)} /></FormField>
                    <FormField label="Age"><Input value={occupant.dateOfBirth ? String(getAge(occupant.dateOfBirth)) : occupant.age !== undefined ? String(occupant.age) : ''} readOnly /></FormField>
                  </div>
                </section>

                <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Address</h5>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(sameAddressForOccupants[index])}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSameAddressForOccupants((current) => {
                          const next = [...current];
                          next[index] = checked;
                          return next;
                        });
                        if (checked) {
                          setOccupants((current) => current.map((item, itemIndex) => itemIndex === index
                            ? { ...item, address, city, state, pincode }
                            : item));
                        }
                      }}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Same as primary address
                  </label>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2"><FormField label="Address" required><Input value={occupant.address} disabled={sameAddressForOccupants[index]} onChange={(event) => updateOccupant(index, 'address', event.target.value)} /></FormField></div>
                    <FormField label="City" required><Input value={occupant.city} disabled={sameAddressForOccupants[index]} onChange={(event) => updateOccupant(index, 'city', event.target.value)} /></FormField>
                    <FormField label="State" required><Input value={occupant.state} disabled={sameAddressForOccupants[index]} onChange={(event) => updateOccupant(index, 'state', event.target.value)} /></FormField>
                    <FormField label="Pincode" required><Input value={occupant.pincode} disabled={sameAddressForOccupants[index]} onChange={(event) => updateOccupant(index, 'pincode', event.target.value)} /></FormField>
                  </div>
                </section>

                <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <h5 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Identity & Documents</h5>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <FormField label="ID Type" required><Select options={[{ label: 'Aadhaar', value: 'AADHAAR' }, { label: 'PAN', value: 'PAN' }, { label: 'Passport', value: 'PASSPORT' }, { label: 'Driving License', value: 'DRIVING_LICENSE' }, { label: 'Other', value: 'OTHER' }]} value={occupant.idType ?? 'AADHAAR'} onChange={(value) => updateOccupant(index, 'idType', String(Array.isArray(value) ? value[0] : value))} /></FormField>
                    <FormField label="ID Number" required><Input value={occupant.idNumber} onChange={(event) => updateOccupant(index, 'idNumber', event.target.value)} /></FormField>
                    <PhotoUploadField label="Occupant Photo" preview={occupant.photoUrl ?? null} onChange={(event) => readPhoto(event, (value) => setOccupants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, photoUrl: value } : item)))} />
                    <PhotoUploadField label="ID Proof Photo" preview={occupant.idProofPhotoUrl ?? null} onChange={(event) => readPhoto(event, (value) => setOccupants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, idProofPhotoUrl: value } : item)))} />
                  </div>
                </section>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={isSaving}>{editAccount ? 'Save Guest' : 'Create Booking'}</Button>
      </div>
    </form>
  );
}
