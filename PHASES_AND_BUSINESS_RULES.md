# Guest History And Rebooking Implementation Plan

## Goal

Build a reliable guest lifecycle that supports:

- One reusable guest identity across hotels and hostels.
- Property-scoped guest cards and history.
- Complete history when all properties are selected.
- Rebooking a returning guest without re-entering identity data.
- Rebooking from a hostel to a hotel or from a hotel to a hostel.
- Additional occupants saved for every reservation.
- Room reuse when date intervals do not overlap.
- Correct room capacity and maintenance validation.

## Core Business Model

`Account` represents the person. It is not a booking.

`ReservationRequest` represents one booking attempt and owns the booking-specific details:

- Property.
- Requested customer type.
- Requested room or bed type.
- Guest count.
- Check-in and check-out dates.
- Reservation status.

`UnitAssignment` represents the actual room or bed assigned for one stay.

`ReservationOccupant` stores the occupant snapshot for a reservation. It must retain the identity data used at booking time even if the guest profile changes later.

`AccompanyingGuest` stores additional occupants attached to a converted active assignment.

The property for a completed stay is always derived through:

```text
UnitAssignment -> Unit -> Property
```

The account identifies the guest; the assignment and reservation identify where and when the guest stayed.

## Customer Type Rules

Use account customer type only for broad identity classification:

- `GUEST`: short-term hotel guests and short-term hostel guests.
- `HOSTELER`: long-term hostel residents.
- `NONE`: staff and internal accounts.

Do not use `Account.customerType` as historical booking data.

Use `ReservationRequest.requestedCustomerType` for the booking-specific type:

- `HOTEL_GUEST` for hotel stays.
- `HOSTEL_GUEST` for short-term hostel stays.
- `HOSTELER` for long-term hostel stays.

A guest may therefore have a hotel reservation and a hostel reservation without changing or duplicating their identity account.

# Phase 1: Baseline And Data Audit

## Tasks

1. Inspect all current account creation, hotel booking, hostel guest, reservation conversion, assignment update, and guest-card endpoints.
2. Record every place where `customerType` is read or overwritten.
3. Identify existing duplicate accounts using email, phone, ID number, and name.
4. Identify reservations without occupants and assignments without reservation links.
5. Verify that generated Prisma client and checked-in JavaScript files match the TypeScript sources.
6. Add temporary structured logs for account matching, reservation creation, conversion, assignment allocation, and guest-card scope.

## Exit Criteria

- Existing records are backed up.
- Duplicate and incomplete-record counts are known.
- Every current guest lifecycle endpoint has an owner and test path.

# Phase 2: Schema Evolution

## Required Changes

Add a generic account type:

```prisma
enum CustomerType {
	HOSTELER
	GUEST
	NONE
}
```

Keep the existing reservation-specific enum values because historical booking type must remain available. If the current enum is shared by accounts and reservations, retain the values for compatibility during migration and stop assigning them to new accounts.

Add the primary account relation to reservations:

```prisma
model ReservationRequest {
	primaryAccountId Int?
	primaryAccount   Account? @relation(
		"ReservationPrimaryGuest",
		fields: [primaryAccountId],
		references: [id],
		onDelete: SetNull
	)
}
```

Add the inverse relation:

```prisma
model Account {
	primaryReservations ReservationRequest[] @relation("ReservationPrimaryGuest")
}
```

Link reservation occupants to accounts without removing their snapshot fields:

```prisma
model ReservationOccupant {
	accountId Int?
	account   Account? @relation(
		"ReservationOccupantAccount",
		fields: [accountId],
		references: [id],
		onDelete: SetNull
	)
}
```

Add the inverse relation:

```prisma
model Account {
	reservationOccupants ReservationOccupant[] @relation("ReservationOccupantAccount")
}
```

Optionally link converted accompanying occupants:

```prisma
model AccompanyingGuest {
	accountId Int?
	account   Account? @relation(
		"AccompanyingGuestAccount",
		fields: [accountId],
		references: [id],
		onDelete: SetNull
	)
}
```

Add indexes:

- `ReservationRequest.primaryAccountId`.
- `ReservationOccupant.accountId`.
- `AccompanyingGuest.accountId`.
- Existing assignment indexes on `accountId`, `unitId`, and `reservationRequestId` must remain.

## Snapshot Rules

The account relation is used for identity and rebooking. Snapshot fields on `ReservationOccupant` and `AccompanyingGuest` are retained for historical accuracy. Updating a guest profile must not rewrite old reservation snapshots.

## Migration Rules

1. Add nullable columns and relations first.
2. Deploy the generated Prisma client.
3. Backfill `Account.customerType`:
	 - `HOTEL_GUEST` -> `GUEST`.
	 - `HOSTEL_GUEST` -> `GUEST`.
	 - `HOSTELER` remains `HOSTELER`.
4. Backfill `ReservationRequest.primaryAccountId` from converted assignment accounts where possible.
5. Backfill primary `ReservationOccupant.accountId` from the linked assignment account.
6. Leave ambiguous additional occupants nullable until manually matched.
7. Only remove obsolete enum values after all application code and data are migrated.

## Exit Criteria

- Migration is additive and reversible.
- Existing reservations remain readable.
- Prisma generation and migration deployment pass.

# Phase 3: Guest Identity Service

## Matching Priority

For a new guest, match an existing account in this order:

1. Explicit `existingAccountId` supplied by the rebooking flow.
2. Normalized email, when present.
3. Normalized mobile number, when present.
4. Government ID type and number, when present.
5. Never match by name alone.

If no reliable identifier is supplied, create a new account only after the UI confirms that this is a new guest.

## Rules

- Rebooking must always use `existingAccountId`.
- The primary account must not be duplicated for a new reservation.
- Updating the current profile must not mutate historical occupant snapshots.
- A guest can have multiple active or historical assignments across different properties, subject to date and access rules.
- Email and mobile remain optional for the form only if another reliable identity method is available.

## Exit Criteria

- Account matching is centralized in one backend service.
- Create and rebooking flows use the same identity service.
- Duplicate account creation is covered by tests.

# Phase 4: Reservation And Occupant Persistence

## Create Reservation

The create payload must contain:

```text
propertyId
unitId or requested room criteria
existingAccountId, when rebooking
guest profile snapshot
booking-specific customer type
check-in
check-out
adult count
child count
occupants[]
```

For every occupant, persist:

- `accountId`, when matched.
- Primary flag.
- First and last name.
- Phone.
- Emergency number.
- Email.
- Gender.
- Date of birth.
- Address.
- ID type and number.
- Photos.

The primary occupant must be linked to `ReservationRequest.primaryAccountId` and `ReservationOccupant.accountId`.

## Conversion

When a reservation is converted:

1. Reuse the linked primary account.
2. Create or match additional occupant accounts when identity data is sufficient.
3. Create the `UnitAssignment` for the primary account.
4. Create `AccompanyingGuest` rows for additional occupants.
5. Preserve the reservation occupant snapshots.
6. Link the converted accompanying rows to accounts when matched.

## Update Rules

- Profile updates and stay-date updates must be separate logical operations.
- Updating a booking must not delete its reservation history.
- Updating occupants must replace only the occupants for that assignment/reservation, inside a transaction.
- All reservation, assignment, and occupant writes must succeed or roll back together.

# Phase 5: Availability And Capacity Rules

## Interval Rule

Two stays overlap only when:

```text
existingCheckIn < requestedCheckOut
AND
existingCheckOut > requestedCheckIn
```

Therefore:

- `09-11` and `11-13` are allowed.
- `09-11` and `10-13` are rejected.
- An open-ended stay blocks all later dates.

The current assignment must be excluded when validating its own edit.

## Capacity Rule

For a room with capacity `N`:

```text
1 <= total occupants <= N
```

The count must not be required to equal capacity. A capacity-2 room may have one or two occupants.

## Property And Room Rule

- The selected room must belong to the selected property.
- A room can be reused for a later non-overlapping interval even when its stored status is `OCCUPIED`.
- Availability is determined by active assignments and maintenance blocks, not by the static status alone.
- A blocked or maintenance interval always wins over an otherwise available room.

## Exit Criteria

- The same availability service is used by create, rebooking, assignment updates, and reservation updates.
- Overlap and capacity tests pass through both UI and direct API requests.

# Phase 6: Property-Scoped Guest Cards

## Selected Property Scope

When all properties are selected:

```text
fetch every accessible property
-> all UnitAssignments
-> each Unit.property
-> each ReservationRequest
```

When one hotel is selected:

```text
fetch only assignments where Unit.propertyId = selected hotel
```

When one hostel is selected:

```text
fetch only assignments where Unit.propertyId = selected hostel
```

The existing property guest-card endpoint can remain property-scoped:

```text
GET /api/properties/:propertyId/guests
```

The backend must enforce the logged-in user’s property scope rather than trusting the frontend selection.

## History Scope

History is filtered by both:

- `Account.id`.
- Selected property scope.

All-properties history includes all accessible property assignments. A selected-property history includes only assignments whose unit belongs to that property.

## Exit Criteria

- Hotel cards never show hostel stays when a hotel is selected.
- Hostel cards never show hotel stays when a hostel is selected.
- All-properties selection shows both when the user has access to both.

# Phase 7: Rebooking Experience

## UI Flow

Add a `Rebook` action to the guest card and history view.

1. Select guest.
2. Open rebooking dialog.
3. Require property selection.
4. Load rooms or beds for that property.
5. Enter check-in and check-out.
6. Select room or bed.
7. Load existing primary guest data automatically.
8. Allow adding, removing, or editing additional occupants.
9. Submit without re-entering identity details.

## Cross-Property Rules

A guest may rebook into any property accessible to the current admin, regardless of the previous booking type:

- Hotel -> hotel.
- Hotel -> hostel.
- Hostel -> hotel.
- Hostel -> hostel.

The selected property determines:

- Reservation-specific customer type.
- Valid unit type.
- Billing strategy.
- Capacity rules.
- Property permission checks.

## Rebooking Payload

```ts
{
	existingAccountId: number,
	propertyId: number,
	unitId: number,
	expectedCheckIn: string,
	expectedCheckOut: string | null,
	numberOfAdults: number,
	numberOfChildren: number,
	occupants: ReservationOccupantPayload[]
}
```

## Duplicate Rules

- Exact duplicate booking: reject with `409 Conflict`.
- Same guest, later non-overlapping dates: create a new reservation.
- Same guest, different property: create a new reservation.
- Same guest, same room, non-overlapping interval: allow.
- Same guest, overlapping interval: reject.

# Phase 8: Backend API And Authorization

## APIs

Add or extend:

```text
GET  /api/guests/search?q=...
GET  /api/accounts/:accountId/history?propertyId=...
POST /api/properties/:propertyId/rebook
```

The existing property guest-card endpoint remains available for dashboard cards.

## Authorization

For every history and rebooking request:

1. Authenticate the user.
2. Resolve accessible properties from the user role.
3. Verify the requested property is accessible.
4. Verify the selected unit belongs to that property.
5. Verify the guest history returned is limited to accessible properties.
6. Never accept a frontend-only property scope as authorization.

## Errors

Use stable error codes and user messages:

- `PROPERTY_SCOPE_DENIED`.
- `UNIT_NOT_IN_PROPERTY`.
- `ROOM_NOT_AVAILABLE`.
- `ROOM_CAPACITY_EXCEEDED`.
- `DUPLICATE_RESERVATION`.
- `GUEST_NOT_FOUND`.
- `INVALID_DATES`.

# Phase 9: Frontend Integration

## Guest Page

1. Keep the current property filter.
2. Fetch cards for every selected accessible property.
3. Group history by `Account.id`.
4. Add History and Rebook actions.
5. Refresh cards and history after rebooking.
6. Display the selected property clearly in the rebooking dialog.

## Form Behavior

- Reuse the existing hotel and hostel field components where possible.
- Show a real empty gender option instead of visually displaying Male for an empty state.
- Keep mobile and email optional if the identity policy allows ID-based matching.
- Show exact missing required fields.
- Keep Cancel below the form.
- Ensure additional occupant DOB, gender, phone, emergency phone, address, and ID values are hydrated on edit.

## State Rules

- Do not create derived arrays inside `useSelector`.
- Use stable empty arrays and memoized derived values.
- Clear stale edit/rebooking state when leaving the form.
- Refresh the selected property’s guest cards after a successful mutation.

# Phase 10: Migration And Deployment

## Deployment Order

1. Add nullable schema fields and relations.
2. Deploy the database migration.
3. Generate the Prisma client.
4. Deploy backend code that reads both old and new shapes.
5. Run data backfill.
6. Deploy frontend changes.
7. Run verification queries.
8. Remove compatibility code only after all records are migrated.

## Backfill Checks

- Every converted assignment has a primary account.
- Every primary reservation occupant has an account link where resolvable.
- Every reservation retains its original property and requested customer type.
- No existing guest account is deleted.
- No reservation snapshot is rewritten from the current profile.

# Phase 11: Testing Matrix

## Identity

- New guest creates one account.
- Same email reuses the account.
- Same mobile reuses the account.
- Explicit account ID always wins during rebooking.
- Missing identifiers do not silently merge by name.

## Property Scope

- All properties shows all accessible history.
- Hotel selection shows only hotel history.
- Hostel selection shows only hostel history.
- Unauthorized properties are rejected by the backend.

## Rebooking

- Hotel guest rebooks into another hotel.
- Hotel guest rebooks into a hostel.
- Hostel guest rebooks into a hotel.
- Hostel guest rebooks into another hostel.
- Rebooking preserves primary guest data.
- Rebooking saves all occupants in `ReservationOccupant`.
- Converted rebooking saves additional occupants in `AccompanyingGuest`.

## Availability

- `09-11` followed by `11-13` succeeds.
- `09-11` followed by `10-13` fails.
- A maintenance block rejects the stay.
- Capacity 2 accepts one occupant.
- Capacity 2 accepts two occupants.
- Capacity 2 rejects three occupants.
- Editing an assignment does not conflict with itself.

## Regression

- Existing hostel creation still works.
- Existing hotel creation still works.
- Existing hotel and hostel edits still work.
- Checkout extension updates linked reservations.
- Guest cards still show mobile and emergency contact values.
- Authentication refresh and property permissions still work.

# Phase 12: Observability And Cleanup

## Structured Logs

Log identifiers and decisions, but never raw sensitive ID numbers or photos:

- Account match strategy and matched account ID.
- Reservation ID and property ID.
- Assignment ID and unit ID.
- Requested date interval.
- Availability decision.
- Occupant count.
- Rebooking source account ID.

## Cleanup

1. Remove temporary verbose payload logs after rollout verification.
2. Keep stable error codes and audit events.
3. Remove old customer-type compatibility branches after migration confirmation.
4. Document the final API contracts and property-scope rules.

# Definition Of Done

The implementation is complete when:

- A guest has one reusable identity account.
- Hotel and hostel bookings do not conflict at the account level.
- Booking type is preserved per reservation.
- History is correct for all-property, hotel, and hostel scopes.
- Rebooking works across accessible properties.
- Rebooking does not require re-entering guest identity details.
- All primary and additional occupant data is saved and restored.
- Room availability and capacity rules are enforced consistently by frontend and backend.
- Existing creation, editing, authentication, and property permissions pass regression tests.
- Database migrations, frontend build, backend build, and integration tests pass.
