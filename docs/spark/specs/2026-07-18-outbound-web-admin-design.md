# Outbound Web Admin Design

> Scope: outbound only. This design keeps outbound in the shared transaction family, with web admin as the creation/control surface and mobile as the execution surface.

## Goal

Align outbound with the wireframe requirements while preserving the existing transaction architecture:

- web admin can create and review outbound documents
- mobile executes outbound progress from the same backend documents
- outbound status reflects execution progress with `draft`, `posted`, `partial`, `dispatched`, `done`, and `canceled`
- the web UI stays consistent with the current transaction shell and project styling

## Decision

Outbound remains a hybrid module:

- web admin creates outbound documents and can post/cancel draft documents
- mobile reads the same documents as executable tasks and advances status through execution
- backend is the source of truth for status transitions
- admin UI does not manually advance operational states beyond `draft -> posted`

## Current Baseline

The repository already has:

- outbound transaction routes under `/transactions/outbound`
- shared transaction list/create/detail composables and pages
- outbound backend controller, DTOs, and service
- outbound create payloads and detail normalization in the frontend service layer

What is missing is alignment with the new outbound wireframe and status model:

- richer outbound list/detail presentation
- outbound-specific status display for `partial`, `dispatched`, and `done`
- backend support for the expanded outbound state machine
- test coverage for outbound-specific normalization and transitions

## Scope

### In scope

- outbound list page copy and entrypoints
- outbound create page content and line-item form behavior
- outbound detail page content and action visibility
- backend outbound state machine expansion
- service-level normalization for outbound record shapes
- tests covering outbound list/create/detail/service behavior

### Out of scope

- a new outbound shell outside the shared transaction family
- drawer-based create flow
- mobile UI implementation
- unrelated transaction modules

## UI Design

### List Page

Keep the page on the existing transaction list shell:

- breadcrumb and section header use the transaction layout already used by other modules
- `Task List` / `Outbound Assignment` style copy can be reflected through the shared transaction header
- filters stay in the standard search/filter toolbar
- `Add New` remains available in web admin

The list should show outbound documents with:

- document number
- type
- assigned user if present
- deadline or date
- status chip
- detail action

The outbound list should still use the standard data table and filter positioning from the project.

### Create Page

Use the existing full page create flow, not a drawer.

Layout:

- left panel: outbound document metadata
- right panel: outbound line items

Header metadata should include:

- warehouse
- outbound document number
- outbound date
- outbound name or title if needed
- assigned date
- assigned user
- customer
- notes

Line items should include:

- product
- location
- quantity
- remove line action
- add line action

The create button should be disabled until required fields and at least one line are valid.

### Detail Page

Use the existing detail shell:

- left panel: outbound document metadata
- right panel: line items
- status chip in the header
- action buttons only when the document is editable by admin

Line item table behavior:

- show line rows with product, qty, unit, origin location, and check state where needed
- status and action affordances should match the wireframe intent
- once outbound leaves draft state, the admin UI becomes read-only

## Status Model

Outbound status values:

- `draft`
- `posted`
- `partial`
- `dispatched`
- `done`
- `canceled`

Rules:

- `draft` is the only admin-editable creation state
- `posted` means the document has been released for execution
- `partial` means some line execution is completed
- `dispatched` means the outbound has been staged and/or dispatched
- `done` means the outbound is complete
- `canceled` means the document is voided and no longer executable

## Backend Design

### State Machine

Current backend only supports draft/post/cancel behavior. Expand outbound state transitions so mobile can update operational progress.

Required behavior:

- create outbound as `draft`
- admin post transitions `draft -> posted`
- mobile progress transitions `posted -> partial -> dispatched -> done`
- cancel remains a terminal override when business rules allow it

The backend remains the source of truth for all state changes.

### Controller and DTOs

Outbound controller should continue exposing the standard document endpoints:

- `POST /outbound`
- `GET /outbound`
- `GET /outbound/:id`
- `PATCH /outbound/:id`
- `POST /outbound/:id/post`
- `POST /outbound/:id/cancel`

If the execution model requires a dedicated progress endpoint later, it should be added only if the status update semantics cannot be expressed cleanly through the existing contract.

### Validation

Outbound backend must reject:

- invalid status transitions
- missing lines
- invalid product or location references
- location and warehouse mismatches where the document rules require consistency
- mobile updates that attempt to skip or rewind the state machine

## Frontend Design

### List Flow

`useTransactionList` should keep outbound within the shared transaction family:

- title stays outbound-specific
- heading stays aligned with the page title
- create button remains available for outbound
- filter and export behavior stay consistent with other transaction pages

### Create Flow

`useTransactionCreate` should keep outbound payload generation aligned with the backend contract.

Outbound create payload should include:

- `companyId`
- `docNumber`
- `docDate`
- `customerId` if available
- `notes`
- `lines[]` with `productId`, `locationId`, and `qtyExpected`

### Detail Flow

`useTransactionDetail` should:

- render outbound detail as read-only once it is not draft
- show post/cancel controls only for draft outbound docs
- map service data into a stable detail shape for the page

## Data Flow

1. Admin opens outbound list.
2. Admin creates outbound draft from the web page.
3. Backend saves the document as `draft`.
4. Admin posts the document.
5. Backend changes status to `posted`.
6. Mobile fetches outbound documents as executable tasks.
7. Mobile executes line progress and sends status updates.
8. Backend advances outbound through `partial`, `dispatched`, and `done`.
9. Web admin detail reflects the current status and becomes read-only after posting.

## Error Handling

Outbound UI should keep the existing transaction error pattern:

- show API errors in the same alert style as other transaction pages
- show backend validation messages directly when available
- keep action buttons disabled while requests are in flight

Backend errors should be explicit and module-specific:

- invalid transition
- invalid warehouse/location reference
- insufficient stock
- missing lines
- invalid payload shape

## Testing

Add or update tests for:

- outbound list metadata and button gating
- outbound create payload generation
- outbound detail page status and action visibility
- outbound service normalization for any new response aliases or status fields
- backend outbound transition behavior

Test focus:

- preserve existing modules
- verify outbound-specific behavior only
- prevent regressions in the shared transaction shell

## Acceptance Criteria

- outbound stays under the shared transaction route family
- web admin can create outbound drafts and review them
- mobile can execute outbound progress from the same backend documents
- status values support `partial`, `dispatched`, and `done`
- admin UI does not manually advance mobile execution states
- outbound list, create, and detail pages match the project’s standard layout

