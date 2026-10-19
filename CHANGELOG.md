# Changelog

## Guest/resident-level pricing

- Renamed unit rates to `defaultPricePerNight` and `defaultRecurringMonthlyRate` as staff-facing reference values.
- Added `agreedPricePerNight`, `agreedMonthlyRate`, and `isCustomRate` to `UnitAssignment`.
- Renamed `HostelWeeklyMenu.fullMessPrice` to `suggestedMessPrice`.
- Residence and mess billing now use assignment-level agreed rates; unit/menu defaults are never used as billing fallbacks.
- Added a development-only backfill script for existing assignments.