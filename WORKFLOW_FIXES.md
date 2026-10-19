# Migration Plan: Guest/Resident-Level Pricing (Prisma + Backend + Frontend)

## Context (paste this for the AI editor)

We are moving pricing off fixed inventory records (`Unit.pricePerNight`,
`Unit.recurringMonthlyRate`, `HostelWeeklyMenu.fullMessPrice`) and onto the
actual assignment/booking records, so admins can set a custom negotiated
price per guest/resident instead of a fixed price per room or mess plan.

Rules to follow throughout:
- Do NOT delete the old price fields outright in the same migration that
  starts using new ones — rename them to `default*` fields first (reference
  values only, shown to staff as a suggestion), then wire billing logic to
  read exclusively from the new per-assignment fields.
- Every schema change needs a corresponding Prisma migration, a data
  backfill step (copy old value into new field so no booking silently
  becomes free), and an update to any TypeScript types/DTOs/zod schemas
  that reference the old field names.
- Do not touch `FoodMenuItem.price` / `FoodOrderItem` — restaurant menu
  pricing stays fixed for all customers, that logic is unaffected.
- Work phase by phase. Do not start a phase until the previous one compiles
  and existing tests (if any) pass. After each phase, run `npx prisma
  validate` and `npx prisma generate` and report the diff before moving on.

---

## Phase 0 — Baseline safety net

1. Create a new git branch: `feat/guest-level-pricing`.
2. Run `npx prisma migrate dev --create-only --name pre_pricing_refactor_baseline`
   only if there are pending unmigrated schema drifts — otherwise skip.
3. Grep the codebase for every usage of the fields being touched so nothing
   is missed later:
   - `pricePerNight`
   - `recurringMonthlyRate`
   - `fullMessPrice`
   List every file/line found in a short report before proceeding.

---

## Phase 1 — Schema changes (Prisma)

1. In `schema.prisma`, rename on `Unit`:
   - `pricePerNight` → `defaultPricePerNight` (keep `@default(0.00)
     @db.Decimal(10,2)`, but make it optional: `Decimal? @db.Decimal(10,2)`
     with no default, since it's now just a reference value).
   - `recurringMonthlyRate` → `defaultRecurringMonthlyRate` (unchanged
     otherwise).
   - Add a code comment above both: `// Reference/default rate shown to
     staff when creating a UnitAssignment. NOT used for billing.`

2. On `UnitAssignment`, add:
   ```prisma
   agreedPricePerNight  Decimal? @db.Decimal(10, 2)
   agreedMonthlyRate    Decimal? @db.Decimal(10, 2)
   isCustomRate         Boolean  @default(false)
   ```
   Add a comment: `// The actual agreed rate for this guest/resident in this
   unit, set by admin at booking/check-in time. Exactly one of
   agreedPricePerNight / agreedMonthlyRate is meaningful, depending on
   billingStrategy.`

3. On `HostelWeeklyMenu`, rename `fullMessPrice` → `suggestedMessPrice`,
   same reference-only comment style as Unit. `HostelMealAssignment.
   monthlyRate` stays untouched — it's already the per-resident field.

4. Run:
   ```
   npx prisma format
   npx prisma validate
   npx prisma migrate dev --name rename_to_default_rates_add_agreed_rates
   ```
5. Confirm the generated migration SQL only does column renames + adds
   (no drops of data). Paste the SQL for review before applying to any
   shared/staging database.

---

## Phase 2 — Data backfill

Write a one-off script (`scripts/backfill-agreed-rates.ts`) that:

1. For every existing `UnitAssignment` row, set:
   - `agreedPricePerNight = unit.defaultPricePerNight` if
     `billingStrategy === PER_NIGHT_STAY`
   - `agreedMonthlyRate = unit.defaultRecurringMonthlyRate` if
     `billingStrategy === RECURRING_MONTHLY`
   - `isCustomRate = false` for all backfilled rows (since they're just
     copies of the unit default, not a real override).
2. Run it once against dev DB, log a summary count of rows updated /
   skipped (e.g., skipped if unit had no default price and assignment is
   still active — flag those for manual review).
3. Do NOT run this against staging/production without explicit approval —
   stop and print a warning if `NODE_ENV !== 'development'`.

---

## Phase 3 — Backend logic (services/controllers)

1. Find every place that currently computes accommodation charges for
   `FinancialLedger` (accommodation fee generation, invoice generation,
   nightly billing cron, etc.). Update the rate lookup to:
   ```
   const rate = billingStrategy === 'PER_NIGHT_STAY'
     ? unitAssignment.agreedPricePerNight
     : unitAssignment.agreedMonthlyRate;
   if (rate == null) {
     throw new Error(`UnitAssignment ${id} has no agreed rate set`);
   }
   ```
   No silent fallback to `unit.defaultPricePerNight` in production billing
   logic — a missing agreed rate should be a hard validation error caught
   at assignment-creation time, not patched at billing time.

2. In the `UnitAssignment` create/update controller (wherever staff
   assigns a guest to a unit):
   - Add request fields `agreedPricePerNight` / `agreedMonthlyRate`.
   - If the admin submits a value that differs from
     `unit.defaultPricePerNight` / `defaultRecurringMonthlyRate`, set
     `isCustomRate = true`, else `false`.
   - Validate that a rate is present for whichever `billingStrategy` was
     selected before allowing the assignment to be created (reject with a
     clear error otherwise).

3. In the `HostelMealAssignment` controller:
   - Keep using `monthlyRate` as-is, but when building the "create
     assignment" form response, expose
     `menu.suggestedMessPrice` as a hint/default value for the frontend to
     pre-fill (not enforce).

4. Update any DTO/zod/type definitions that reference the renamed fields
   (`pricePerNight`, `recurringMonthlyRate`, `fullMessPrice`) throughout
   the codebase, using the Phase 0 grep report as the checklist.

5. Add/update unit tests for:
   - Billing throws when `agreedPricePerNight`/`agreedMonthlyRate` is null.
   - `isCustomRate` flips correctly based on comparison to unit defaults.

---

## Phase 4 — Frontend: Room/Unit edit form

1. In the Unit create/edit form, rename the price inputs to reflect they
   are now defaults/suggestions only:
   - Label: "Default price per night (reference only)"
   - Label: "Default monthly rate (reference only)"
   - Add a small helper text: "This is shown to staff as a starting point.
     Actual guest pricing is set per booking."

---

## Phase 5 — Frontend: Guest/Reservation edit form (the checkbox UX)

1. Add a checkbox: **"Use custom rate for this guest"**.
   - Unchecked (default): show a read-only field pre-filled with
     `unit.defaultPricePerNight` (or `defaultRecurringMonthlyRate`
     depending on billing strategy). This value is what gets submitted as
     `agreedPricePerNight`/`agreedMonthlyRate` unless the checkbox is
     ticked.
   - Checked: the field becomes editable; admin types the negotiated
     amount. On submit, send `isCustomRate: true` along with the typed
     value.
2. Toggle which field is shown/editable based on the reservation's
   `billingStrategy` (per-night vs recurring monthly) — same pattern as
   whatever conditional logic already switches other fields by billing
   strategy.
3. Same checkbox pattern for the mess/food assignment section:
   - Checkbox: **"Use custom mess rate for this resident"**.
   - Unchecked: pre-fill from `menu.suggestedMessPrice`.
   - Checked: editable field feeding `HostelMealAssignment.monthlyRate`.
4. Client-side validation: block submit if the rate field is empty,
   regardless of checkbox state — there must always be a number going to
   the backend for `agreedPricePerNight`/`agreedMonthlyRate`/`monthlyRate`.

---

## Phase 6 — Cleanup & verification

1. Re-run the Phase 0 grep for the old field names — should now return
   zero results outside of migration history files.
2. Full run: `npx prisma validate`, `npx prisma generate`, type-check the
   whole project (`tsc --noEmit` or equivalent), run existing test suite.
3. Manually test end-to-end: create a reservation → assign unit with a
   custom rate → generate ledger entry → confirm the ledger's
   `subTotal`/`totalAmount` reflects the custom rate, not the unit default.
4. Write a short migration note in `CHANGELOG.md` describing the pricing
   model change for future reference.

---

## Open decision to confirm before Phase 3

Billing should hard-fail (not fall back to unit defaults) if
`agreedPricePerNight`/`agreedMonthlyRate` is missing on an assignment —
confirm this is the desired behavior before implementing Phase 3, step 1,
since it changes how forgiving the system is toward incomplete data entry.