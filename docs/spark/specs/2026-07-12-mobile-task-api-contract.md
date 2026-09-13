# Mobile Task API Contract

> Scope: mobile app selects a module first, then shows a list of active tasks/documents that are still executable by the user. This contract is derived from the existing admin/task document modules in the repository.

## Goal

Provide a consistent mobile task list flow:

1. User selects a module.
2. App loads active documents for that module.
3. App renders them as a list.
4. User taps a task row.
5. App opens the task detail screen for execution.

The mobile list should show only documents that are still runnable, not finalized records.

## Shared Rules

- `id` should be the navigation key.
- `docNumber` should be the primary display label.
- Optional secondary text can show `docDate`, `warehouse`, or `status`.
- Final states such as `posted`, `closed`, `done`, and `canceled` must not appear in the list.

## Module Contract

### Register

- Endpoint: `GET /register`
- Active status filter: `draft`
- Primary label: `docNumber`
- Secondary label: `docDate`, `registeredBy.fullName`, optional `status`
- Notes:
    - Register is header-only.
    - It is suitable for a simple task list without line items.

### Inbound

- Endpoint: `GET /inbound`
- Active status filter: `draft`
- Primary label: `inbound_no` or normalized `docNo`
- Secondary label: `inbound_date`, `warehouse`, optional `supplier`
- Notes:
    - In web admin, inbound is read-only and only shows data that already came from register.
    - In mobile, inbound is treated as a task list sourced from the same backend documents.
    - Inbound has line items.

### Putaway

- Endpoint: `GET /putaway`
- Active status filter: `posted`
- Primary label: `docNumber` or task reference
- Secondary label: warehouse/location/assigned executor, depending on the final module design
- Notes:
    - This is a new module and has its own state machine.

## List Response Shape

All list endpoints return the standard API envelope:

- `success`
- `message`
- `data`: array of tasks/documents
- `meta`: pagination info

Mobile should treat each row as a tappable task card with the following priority fields:

### Register row shape

- `id`
- `docNumber`
- `docDate`
- `status`
- `registeredBy.fullName`

### Inbound row shape

- `id`
- `inbound_no` or normalized `docNo`
- `inbound_date`
- `warehouse.code` / `warehouse.name`
- `supplier.name` if available
- `status`
- `lines` count if available

### Putaway row shape

- `id`
- `docNumber`
- `docDate`
- `warehouse.code` / `warehouse.name`
- `referenceType` / `referenceId` if available
- `status`
- `lines` count if available

## Recommended Query Shape

For the list-based mobile flow, the client should query the list endpoint:

```text
GET /<module>?status=draft
```

Current backend list services use a single `status` value. If the mobile list needs more than one active state in the future, add one of these later:

- `statusIn=draft,posted`
- repeated params such as `status=draft&status=posted`
- a dedicated mobile endpoint that normalizes the active-state logic per module

## List Presentation

Recommended row content:

- Main line: document number
- Sub line: date and warehouse
- Optional badge: status
- Optional meta line: user, supplier, or reference when the module has it

Example:

- `REG-001`
- `2026-07-12 · Warehouse A`
- badge: `Draft`

## Conclusion

The backend now supports the mobile list model for `register`, `inbound`, and `putaway` through the standard list endpoints.
Web admin can keep inbound read-only while mobile presents inbound as a task list sourced from the same records.

The main remaining decision is whether mobile should filter only by module and active status, or also by executor ownership. If ownership is required, add a user-specific filter later without changing the base module contract.
