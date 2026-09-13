# Register, Inbound, Putaway Master Scope

> Scope locked to:
>
> - `register`
> - `inbound`
> - `putaway`

## Purpose

Provide one final reference for the current analysis phase so the implementation phase can start without re-deriving the requirements.

## Final Decisions

### Register

- Admin task/document flow
- Mobile list endpoint: `GET /register`
- Active status: `draft`
- Primary label: `docNumber`
- Secondary label: `docDate`, `registeredBy.fullName`
- List row priority: `docNumber`, `docDate`, `registeredBy.fullName`, `status`

### Inbound

- Admin receipt task/document flow
- Mobile list endpoint: `GET /inbound`
- Active status: `draft`
- Primary label: `inbound_no` or normalized `docNo`
- Secondary label: `inbound_date`, `warehouse`
- List row priority: `docNo`, `inbound_date`, `warehouse`, `supplier`, `status`

### Putaway

- New warehouse module
- Document + line-item workflow
- Mobile list endpoint: `GET /putaway`
- Active status: `posted`
- Primary label: `docNumber`
- Secondary label: `docDate`, `warehouse`
- List row priority: `docNumber`, `docDate`, `warehouse`, `referenceType`, `status`

## Canonical Module Rules

- Mobile chooses a module first.
- Mobile then loads active documents for that module.
- Mobile renders them as a list.
- Mobile uses document `id` as the navigation key.
- Finalized records must not appear in the list.
- Ownership filtering is deferred unless explicitly required later.

## Web Admin Split

- `register` is an admin-created task/document flow.
- `inbound` is read-only in web admin and only reflects data that already came from `register`.
- `putaway` is an admin-created warehouse task with its own lifecycle.
- Web admin create flows should not expose inbound as a direct entry point.

## Status Summary

- `register`: `draft` is executable
- `inbound`: `draft` is executable
- `putaway`: `posted` is executable

## Putaway Baseline

- lifecycle: `draft -> posted -> done/canceled`
- lines are required in v1
- `POST /putaway/:id/complete` closes the task
- `PATCH /putaway/:id` is draft-only

## Implementation Artifacts

### Register / Inbound Audit

- [Register and Inbound Mobile List Audit](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-register-inbound-mobile-picker-audit.md)

### Putaway Specs

- [Putaway Module Design](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-module-design.md)
- [Putaway Backend Contract](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-backend-contract.md)
- [Putaway Implementation Blueprint](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-implementation-blueprint.md)
- [Putaway API Payload Contract](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-api-payload-contract.md)
- [Putaway Status Transition Matrix](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-status-transition-matrix.md)

### Putaway Plans

- [Putaway Master Implementation Package](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-master-implementation-package.md)
- [Putaway File-by-File Plan](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-file-by-file-plan.md)
- [Putaway Implementation Map](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-implementation-map.md)
- [Putaway DTO Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-dto-checklist.md)
- [Putaway Endpoint Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-endpoint-checklist.md)
- [Putaway Test Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-test-checklist.md)

## Current Gap Summary

### Register

- Mostly ready.
- Main concern is keeping the task/document wording consistent across web admin and mobile.

### Inbound

- Mostly ready.
- Main concern is keeping the mobile list contract explicit while keeping web admin read-only.

### Putaway

- Implemented.
- Main remaining concern is keeping the mobile list contract and admin UI labels aligned.

## Exit Criteria For This Analysis

- `register` and `inbound` are locked to `draft` in the mobile list contract.
- `putaway` is locked to `posted` in the mobile list contract.
- The backend contract for `putaway` is implemented and the mobile list contract uses the standard list endpoints.
- Web admin does not create inbound directly; it only reviews inbound records sourced from register.
- No out-of-scope modules are required to finish this work.
