# Putaway DTO Checklist

> Scope: `putaway` only.

## Purpose

List the DTOs and validation responsibilities needed for the first implementation of `putaway`.

## DTO Inventory

### Create

`CreatePutawayDto`

Used by:

- `POST /putaway`

Responsibilities:

- validate required header fields
- validate non-empty `lines[]`
- validate line item shape
- map optional reference fields

Suggested fields:

- `companyId`
- `docNumber`
- `docDate`
- `warehouseId`
- `referenceType?`
- `referenceId?`
- `notes?`
- `lines[]`

Suggested line fields:

- `lineNo`
- `productId`
- `qty`
- `sourceLocationId?`
- `targetLocationId`
- `notes?`

### Update

`UpdatePutawayDto`

Used by:

- `PATCH /putaway/:id`

Responsibilities:

- allow edits only for draft documents
- support partial updates
- validate updated lines

Suggested fields:

- `docDate?`
- `warehouseId?`
- `referenceType?`
- `referenceId?`
- `notes?`
- `lines?`

### Query

`PutawayListQueryDto`

Used by:

- `GET /putaway`

Responsibilities:

- validate supported filters
- normalize pagination if the codebase uses it later

Suggested fields:

- `companyId?`
- `warehouseId?`
- `status?`
- `docNumber?`
- `dateFrom?`
- `dateTo?`

### Detail

`PutawayDetailDto`

Used by:

- `GET /putaway/:id`

Responsibilities:

- shape the response for mobile and admin detail views
- include header fields
- include line fields and relations

Suggested fields:

- `id`
- `companyId`
- `docNumber`
- `docDate`
- `warehouseId`
- `warehouse?`
- `referenceType?`
- `referenceId?`
- `status`
- `notes?`
- `createdById`
- `createdAt`
- `updatedAt`
- `lines[]`

### Action DTOs

`PutawayActionDto`

Used by:

- `POST /putaway/:id/post`
- `POST /putaway/:id/cancel`
- `POST /putaway/:id/complete`

Responsibilities:

- keep action endpoints consistent
- carry no business payload unless future versions need audit metadata

Suggested fields:

- none for MVP

## Validation Rules

### Create / Update

- `docNumber` is required for create.
- `docDate` is required for create.
- `warehouseId` is required for create.
- `lines` cannot be empty on create.
- each line requires `lineNo`, `productId`, `qty`, and `targetLocationId`.
- `qty` must be greater than zero.

### Query

- `status` must be one of the allowed states if supplied.
- date filters should be optional and independently valid.

### Actions

- draft-only actions must reject non-draft documents.
- post must reject canceled or completed documents.
- complete must reject non-posted documents.

## Implementation Order

1. create DTOs
2. wire validation
3. connect controller methods
4. enforce transitions in service
