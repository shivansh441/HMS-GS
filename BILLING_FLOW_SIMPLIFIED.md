# Bill Customization — Feature Spec (Hosteler Billing)

**Status:** Draft for review
**Scope:** Hosteler invoicing only. Hostel-guest and hotel-guest billing follow the same underlying tax-per-line principle but are documented separately once built.
**Related decisions already made:**
- Mess fee billing uses only `UnitAssignment.agreedMonthlyMessRate` (flat rate), not the menu-based `HostelMealAssignment` system.
- Tax is calculated per charge line at creation time — there is no separate "GST line" or reconciliation step.
- A property's enabled fee types = whichever `FeeType`s have an active `TaxRule` row for that property.

---

## 1. Purpose

"Bill Customization" is the screen/action staff use to generate or preview a hosteler's invoice for a given billing period. It has two jobs:

1. Show what's **already fixed** for this resident (Hostel Fee, Mess Fee) — computed automatically, not editable here.
2. Let staff **add variable, month-specific charges** (electricity, laundry, deposits, etc.) that can't be known in advance and differ resident to resident, month to month.

It produces one invoice: a set of `FinancialLedger` rows sharing one `unitAssignmentId` + one billing period, each individually taxed.

---

## 2. Entry points

| Trigger | Result |
|---|---|
| Staff opens a resident's profile → "Bill Customization" for the current month | Screen opens in **preview mode**, pre-filled with any charges already generated (e.g. by the nightly cron) |
| Nightly cron generates month's base charges automatically | Hostel Fee / Mess Fee lines exist before staff ever opens the screen; staff only adds variable charges on top |
| "Finalize" button on the property-wide billing page | Runs the same logic for every active hosteler on the property in one action, using the same variable-charge amounts if supplied per resident, or none if skipped |

---

## 3. Screen layout

### 3.1 Header (read-only context)
- Resident name, property name, unit/bed number
- Billing period (month + year), shown as a date range
- Current invoice status if one already exists for this period: `Draft / Unpaid / Partial / Paid / Overdue`

### 3.2 Section A — Fixed charges (auto-calculated, read-only)

| Line | Source | Editable here? |
|---|---|---|
| Hostel Fee | `UnitAssignment.agreedMonthlyRate`, prorated if this is the resident's first month | No — change the rate on the resident's profile instead |
| Mess Fee | `UnitAssignment.agreedMonthlyMessRate`, same proration rule | No — same as above. Row is hidden entirely if the resident has no mess rate set |

Each row displayed as: **Base amount → GST rate% → GST amount → Line total**, pulled from the property's active `TaxRule` for that fee type. If the property has no active rule for Hostel Fee, GST shows as 0% (not an error — some properties may be legitimately untaxed).

### 3.3 Section B — Variable charges (staff-entered this session)

This section is **dynamically generated** from the property's enabled fee types — it is never hardcoded to "electricity" and "other."

**How the field list is built:**
1. Backend returns the property's fee types that have an active `TaxRule`, excluding Hostel Fee and Mess Fee (those live in Section A).
2. One input row is rendered per fee type returned. Example: if a property has enabled Electricity Fee and Laundry Fee, staff sees exactly two input rows. A property with nothing extra enabled shows this section empty (with a note, see 3.4).
3. Each input row shows: **Fee type name** (label, not editable) · **Amount** (staff types this) · **Description** (optional free text, e.g. "March meter reading: 240 units") · GST% for that fee type shown alongside as a preview, computed live as staff types the amount.
4. Staff may leave any row blank — not every resident incurs every charge every month. Blank rows are simply not included in the invoice.
5. Multiple charges of the *same* fee type in one invoice are not supported in v1 (one Electricity Fee line per period, not two) — flag if this needs to change later.

### 3.4 Adding a brand-new fee type from this screen

**Decision needed before build — two options, pick one:**

- **Option A (restrictive, recommended default):** This screen can only use fee types already enabled on the property's Tax Rules settings page. If nothing is enabled, Section B shows: *"No variable fee types are configured for this property. Add one from Property Settings → Tax Rules."* with a link there. Keeps tax configuration centralized in one place; prevents accidental 0%-GST fee types created by typos on a billing screen.
- **Option B (flexible):** An "+ Add a charge" control lets staff type any name on the spot. If it matches an existing `FeeType`, it's added to the property (creating a new `TaxRule` at 0% GST, since no rate was set) and immediately usable. Staff would need to separately go set the correct GST% afterward, or enter it inline right there.

*This spec assumes Option A until you confirm otherwise, since it avoids silently creating 0%-GST fee types by accident.*

### 3.5 Section C — Totals

- Subtotal (sum of all base amounts, fixed + variable)
- Total tax (sum of all individual line tax amounts — never recomputed as one lump figure)
- **Grand total**
- Due date (defaults to end of billing period)

### 3.6 Actions

| Button | Behavior |
|---|---|
| **Preview** | Runs the full calculation, shows Section C totals, writes nothing to the database. Safe to click repeatedly. |
| **Finalize** | Writes one `FinancialLedger` row per line (fixed + each filled variable charge), each individually taxed at creation. Idempotent per billing period — re-running for the same month updates existing rows rather than duplicating them. |
| **Record Payment** (only visible once finalized) | Opens the payment entry flow — amount, method, reference ID — updates the invoice status (Unpaid/Partial/Paid) based on amount received vs. total. |

---

## 4. Data flow summary

```
Property Tax Rules screen
   │  admin enables fee types + sets GST% per property
   ▼
FeeType + TaxRule (propertyId, feeTypeId, rate)
   │  read by...
   ▼
Bill Customization screen (per resident, per month)
   │  Section A: auto-pulled from UnitAssignment + TaxRule
   │  Section B: dynamically rendered inputs, one per enabled
   │             non-Hostel/Mess fee type
   ▼
staff enters variable amounts → Preview → Finalize
   │
   ▼
One FinancialLedger row per line, each already taxed
   (no separate GST row, ever)
```

## 5. API shape (for reference when building)

**Fetch what to render:**
```
GET /properties/:propertyId/assignments/:assignmentId/bill-preview?period=2026-09
→ {
    fixedLines: [{ feeType: "Hostel Fee", base, taxRate, taxAmount, total }, ...],
    availableExtraFeeTypes: [{ feeTypeId, name, taxRate }, ...],
    existingInvoice: { status, totals } | null
  }
```

**Submit variable charges + finalize:**
```
POST /properties/:propertyId/assignments/:assignmentId/finalize-bill
{
  period: "2026-09",
  extraCharges: [
    { feeTypeId: 7, amount: 850, description: "March meter reading" }
  ]
}
```

This replaces the current flat `includeElectricity` / `electricityAmount` / `includeOtherCharges` / `otherChargesAmount` fields with the array form — supports any number of variable charges, not just one electricity slot and one generic "other" slot.

---

## 6. Open decisions before implementation

1. **Section 3.4** — Option A vs Option B for adding new fee types from this screen.
2. Whether staff can **edit or remove** a variable charge line after Finalize but before payment is recorded (e.g. correcting a mistyped electricity reading), or must void the whole invoice and redo it.
3. Whether the property-wide "Finalize all" action allows entering *per-resident* variable charges in bulk, or only finalizes fixed charges automatically and leaves variable charges to be added one resident at a time afterward.