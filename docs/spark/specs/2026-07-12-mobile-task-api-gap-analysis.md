# Mobile Task API Gap Analysis

> Scope: web admin task creation is the current priority. Mobile only needs task APIs per module. This analysis is based on the current frontend/backend code in this repository and focuses on what already exists versus what still needs a new module or contract.

## Summary

The current backend already exposes task/document lifecycle endpoints for the existing warehouse modules. For the current scope, the strongest fit is:

- `register`: already complete as a header-only task/document module.
- `inbound`: already complete as a full task/document module with line items and post/cancel lifecycle.
- `putaway`: now implemented as a new module with its own lifecycle.

The main gap is not missing CRUD endpoints. The gap is that there is no mobile-specific task list contract yet:

- no `assignedToId` / executor ownership filter
- no mobile-optimized summary endpoint
- no dedicated DTO for "task list" versus admin document CRUD

So the backend can already support mobile task browsing at a basic level, but if mobile needs a curated list per user or per warehouse, that contract still has to be added.

## Current Contract By Module

### Register

Current backend shape:

- `POST /register`
- `GET /register`
- `GET /register/:id`
- `POST /register/:id/post`
- `POST /register/:id/cancel`

Current behavior:

- Header-only document.
- Includes `company`, `registeredBy`, and `createdBy` relations.
- Filters by `companyId`, `status`, `docNumber`, `registeredById`, and `docDate` range.
- Posting is a pure status flip.

Gap assessment:

- Good enough for a mobile task list and detail screen.
- Missing a task-assignment field if the mobile experience must be user-specific.
- If mobile only needs "show me all active register tasks", the existing list endpoint is sufficient.

### Inbound

Current backend shape:

- `POST /inbound`
- `GET /inbound`
- `GET /inbound/:id`
- `PATCH /inbound/:id`
- `POST /inbound/:id/post`
- `POST /inbound/:id/cancel`

Current behavior:

- Draft document with line items.
- Post creates stock movements and updates balances.
- List filters by `companyId`, `warehouseId`, `status`, `docNumber`, and date range.

Gap assessment:

- Good enough for a mobile task list, task detail, and post/cancel lifecycle.
- If mobile needs execution of line-level scan/confirmation, the current API already has document data but not a dedicated scan endpoint.
- If mobile only needs to consume tasks, no new backend endpoint is required.

### Putaway

Current state:

- Implemented in the backend and synced into the frontend transaction contract.

Gap assessment:

- This is a true new module.
- It already has a backend model, controller, service, DTOs, and mobile-facing task lifecycle.
- It should not be modeled as a variant of register or inbound without defining its own task state machine.

## Frontend Impact

The current web frontend already assumes a transaction-style document model for `register`:

- transaction list routing
- create/detail pages
- backend list/detail normalization
- report config for register

For mobile, there is no dedicated mobile client in this repo. The only contract that matters now is the backend API shape.

## Recommended Gap Closures

### Must have

1. Keep `register` and `inbound` exposed as standard task/document APIs.
2. Add `putaway` as a new module with its own lifecycle and DTOs.
3. Decide whether mobile inboxes are global by company/warehouse or user-specific.

### Nice to have

1. Add a dedicated mobile task list endpoint per module only if the base list needs to be reduced or reshaped for mobile.
2. Add executor/assignee fields if mobile tasks must be personal, not shared.
3. Separate "admin CRUD" DTOs from "mobile task" DTOs if payloads start diverging.

## Conclusion

The current codebase is already close for mobile task consumption on `register` and `inbound`. The real structural gap in this scope is now mostly the absence of a mobile-specific list contract if tasks need ownership or assignment semantics.

## Post-Audit Status

Backend validation issues found during audit have been closed:

- invalid `status` filters are rejected for `register` and `inbound`
- `inbound` line locations are now validated against the document warehouse during create/update

After those fixes, the remaining gap for this scope is product-level, not backend correctness:

- decide whether mobile needs assignment/ownership filters
- decide whether mobile needs a dedicated response shape or can reuse the standard list contract
