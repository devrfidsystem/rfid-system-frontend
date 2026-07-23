# Putaway Backend Contract

> Scope: define a new `putaway` warehouse module that behaves like a task/document workflow, separate from `register` and `inbound`.

## Intent

`putaway` is the task of assigning stock to its final storage location after receipt. It is not the same as `inbound`:

- `inbound` records the receipt into the warehouse system.
- `putaway` records where that received stock is stored.

## Recommended Module Shape

### Prisma Models

#### `PutawayDoc`

Header-only document with line references:

- `id`
- `companyId`
- `docNumber`
- `docDate`
- `referenceType` optional
- `referenceId` optional
- `warehouseId`
- `status`
- `notes` optional
- `createdById`
- `createdAt`
- `updatedAt`

#### `PutawayLine`

Task lines:

- `id`
- `docId`
- `lineNo`
- `productId`
- `qty`
- `sourceLocationId` optional
- `targetLocationId`
- `notes` optional
- `status` optional

### Relations

- company
- warehouse
- lines
- createdBy
- optional source document relation later

## Proposed Lifecycle

Minimal version:

- `draft`
- `posted`
- `done`
- `canceled`

Meaning:

- `draft`: admin is preparing the task
- `posted`: task is active and visible to executor
- `done`: executor finished the task
- `canceled`: task is no longer valid

If later the workflow needs assignment or verification steps, extend with:

- `assigned`
- `in_progress`
- `verified`

## Proposed API

### Admin

- `POST /putaway`
- `GET /putaway`
- `GET /putaway/:id`
- `PATCH /putaway/:id`
- `POST /putaway/:id/post`
- `POST /putaway/:id/cancel`

### Optional execution detail

If per-line execution tracking is required:

- `PATCH /putaway/:id/lines/:lineId`
- `POST /putaway/:id/complete`

## DTO Summary

### Create

Expected fields:

- `companyId`
- `docNumber`
- `docDate`
- `warehouseId`
- `referenceType` optional
- `referenceId` optional
- `notes` optional
- `lines[]`

Each line:

- `productId`
- `qty`
- `targetLocationId`
- `sourceLocationId` optional
- `notes` optional

### Update

Allow update only while `draft`.

## List Filters

Recommended list filters:

- `companyId`
- `warehouseId`
- `status`
- `docNumber`
- `dateFrom`
- `dateTo`

For mobile list usage:

- active status should be the task state that is still executable
- if using the minimal lifecycle, that is likely `posted`

## Mobile Contract

Mobile should:

1. choose module `putaway`
2. fetch active docs from `GET /putaway`
3. select `docNumber`
4. open detail and execute task

Recommended list label:

- primary: `docNumber`
- secondary: `docDate`
- tertiary: `warehouse`
- optional badge: `status`

## Design Notes

- `putaway` should not be collapsed into `inbound`.
- `putaway` should not reuse `register` because it needs lines and target locations.
- Keep the first version simple and document-driven; do not over-model executor ownership until needed.

## Open Decisions

- Should `putaway` be created from an inbound reference automatically?
- Should active mobile tasks be `posted` only, or `posted + assigned` if ownership is later added?
- Should completion happen per task or per line?
- Should the system suggest target locations or only validate admin-entered ones?
