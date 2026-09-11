# Warehouse Follow-Up Notes

Added: 2026-08-29
Source: Manual notes from product/project discussion.
Status: Implementation in progress. Items marked below reflect verified code changes in the frontend/backend/mobile worktrees.

Progress:

- 2026-08-29: Location handling batch implemented. `locationType` supports `product`, and transaction task location selectors request `excludeTypes=product`.
- 2026-08-29: Outbound optional-location-tag batch implemented in backend. Outbound create/post no longer require pick location EPC, and existing complete-scan behavior remains posted without auto-done.
- 2026-08-29: Document-number format batch implemented in frontend and backend. New transaction forms default to `PREFIX-YYMMDD-001`, backend create DTOs allow omitted doc numbers, and backend services generate/retry unique numbers using the same date sequence format.
- 2026-08-29: Opname web status/location filter batch implemented. Tree and summary requests now send status/location filters to the backend, and filtered trees preserve matched ancestors.
- 2026-08-29: Putaway location-first batch implemented in frontend. Putaway lines now select source location before product, product picker stays disabled until source location is selected, and products are loaded from stock balance for the selected warehouse/location with quantity in the label.
- 2026-08-30: Mobile task scan flow batch implemented. Putaway/outbound do not auto-submit/auto-done on complete scans, optional location tags can proceed without EPC confirmation, outbound back navigation clears incomplete scan state, and opname task count updates local rack lines after submit.
- 2026-08-30: Stock balance display batch implemented. Frontend stock balance rows preserve warehouse/location/product IDs while displaying names, with composite row IDs per warehouse/location/product.
- 2026-08-30: Frontend and backend verification completed. Frontend unit tests/type-check/build pass; backend full Jest suite/build pass. Mobile Flutter verification is blocked because `dart` and `flutter` are not available in PATH.
- 2026-08-30: Frontend Selenium regression was repaired and verified outside sandbox; all 9 regression suites pass.
- 2026-08-30: Prisma migration history was repaired by restoring local migration `20260824000000_add_opname_task_scope`; pending migration `20260829090000_add_location_type` was applied with `prisma migrate deploy`, and migration status now reports the database schema is up to date.

## Putaway

- Putaway flow should be location-first. Frontend putaway lines now start with source location.
- Putaway product lists should filter out products that do not have a location. Frontend putaway product options now come from stock balance for the selected source location.
- Put away product list should show/count quantity per product. Frontend putaway product option labels now include available quantity.
- Remove auto submit when all scanned products are complete in putaway. Mobile putaway scan completion now stays user-submitted.

## Cutaway / Counting

- Counting location is not updated in the cutaway app. Mobile opname submit now refreshes current rack line counts locally.
- Location tag should be optional. Mobile putaway/opname/outbound can proceed when a location has no EPC tag.

## Opname

- Difference display in opname should use negative values where appropriate. Backend verified: `variance_qty = counted - system`; mobile item table displays signed diff values.
- Submit should be available for all opname flows. Web detail action now applies selected lifecycle action across matching descendant task nodes.
- Adjust relocation quantity/handling in opname. Web detail action drawer supports adjust and relocation lifecycle actions.
- Web opname status view needs filters by location and status. Web tree and summary now support API-backed status/location filters.

## Location Selection

- Location lists in all tasks should exclude product-type locations. Location option calls support excluding `product` locations.

## Document Numbering

- All document numbers should use the format `OUT-250826-001`. Frontend create forms and backend generated document numbers now use `PREFIX-YYMMDD-001`; backend retries generated numbers on concurrent unique conflicts.

## Outbound

- Outbound foreign/name display still shows EPC and needs correction. Mobile outbound unexpected-product handling now resolves display names from product registry/API matches instead of leaving EPC as the label.
- Outbound should not auto-complete automatically. Backend verified: `complete-scan` does not change status to `done`.
- On outbound page back/navigation, state should not be saved per state. Mobile outbound location scan page clears incomplete group scans on dispose.
- Do not add an in-progress status for outbound page back/navigation behavior.
- Location should be rescanned after returning/back navigation.

## Stock

- Stock balance should be tracked/displayed per location. Frontend stock balance normalization preserves location IDs and displays per-location rows.

## Implementation Notes

- Treat these as shared FE/BE requirements. Confirm API contracts before changing UI-only behavior.
- Any automatic completion or automatic submission change must be checked against backend status transitions.
- Remaining validation: run Flutter tests/manual QA once Flutter tooling is available in the environment.
