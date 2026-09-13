# Putaway Implementation Blueprint

> Scope: `putaway` only.

## Purpose

Define the minimal implementable version of `putaway` so the backend can be built without re-litigating the workflow.

## Summary

`putaway` is a storage-placement task:

- admin creates the task
- admin defines line items and target locations
- executor selects the task from the mobile list
- executor confirms the placement
- task is completed

This module must stay separate from `register` and `inbound`.

## Core Entities

### PutawayDoc

Required fields:

- `id`
- `companyId`
- `docNumber`
- `docDate`
- `warehouseId`
- `status`
- `notes`
- `createdById`
- `createdAt`
- `updatedAt`

Optional reference fields:

- `referenceType`
- `referenceId`

### PutawayLine

Required fields:

- `id`
- `docId`
- `lineNo`
- `productId`
- `qty`
- `targetLocationId`

Optional fields:

- `sourceLocationId`
- `notes`
- `status`

## Lifecycle

Use a small state machine:

- `draft`: admin is building the task
- `posted`: task is active and selectable in mobile
- `done`: task is finished
- `canceled`: task is invalidated

Allowed transitions:

- `draft -> posted`
- `draft -> canceled`
- `posted -> done`
- `posted -> canceled`

Disallowed:

- `done -> any`
- `canceled -> any`

## Endpoint Behavior

### `POST /putaway`

Creates the document in `draft`.

Rules:

- must save header and lines together
- must require `companyId`, `docNumber`, `docDate`, `warehouseId`, and `lines[]`
- each line must include `productId`, `qty`, and `targetLocationId`

### `GET /putaway`

Returns list data for admin and mobile.

Rules:

- must support list filtering by `companyId`, `warehouseId`, `status`, `docNumber`, `dateFrom`, and `dateTo`
- mobile should filter to `status=posted`

### `GET /putaway/:id`

Returns full document detail.

Rules:

- include header and line data
- include relations needed by executor context
- the response must support opening the task detail from mobile

### `PATCH /putaway/:id`

Updates draft data only.

Rules:

- allowed only when status is `draft`
- editable fields include notes, warehouse, reference fields, and lines
- once posted, the document becomes read-only except for explicit execution endpoints

### `POST /putaway/:id/post`

Activates the task.

Rules:

- only allowed from `draft`
- sets status to `posted`
- the task becomes visible in the mobile list

### `POST /putaway/:id/cancel`

Invalidates the task.

Rules:

- allowed from `draft` or `posted`
- sets status to `canceled`
- canceled tasks must not appear in mobile selection

### `POST /putaway/:id/complete`

Marks the task as done.

Rules:

- only allowed from `posted`
- should be used when the executor finishes the task
- once completed, the task must leave the mobile list

## Mobile Contract

Mobile task list:

- module: `putaway`
- list endpoint: `GET /putaway?status=posted`
- primary label: `docNumber`
- secondary label: `docDate` and `warehouse`

Mobile execution:

- open `GET /putaway/:id`
- render line items and target locations
- confirm completion with `POST /putaway/:id/complete`

## Validation Rules

### Header

- `docNumber` must be unique within the intended scope if the backend already enforces document numbering.
- `status` must always be valid.

### Lines

- every line must point to a valid product
- every line must have a target location
- quantity must be positive

### Selection

- only `posted` docs are executable from mobile
- `draft`, `done`, and `canceled` must not appear in the list

## Open Decisions Resolved For MVP

- Start with lines in v1: yes
- Active mobile state: `posted`
- Ownership fields: no, unless later required
- Partial execution endpoint: no, unless line-by-line completion becomes necessary
