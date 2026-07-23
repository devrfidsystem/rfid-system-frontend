# Register, Inbound, Putaway Implementation Checklist

> Scope locked to:
>
> - `register`
> - `inbound`
> - `putaway`

## Goal

Turn the gap matrix into a concrete work checklist that can be executed without re-deriving the process every time.

## Workstreams

### 1) Register

Status:

- Functionally ready for the current mobile picker model.

Checklist:

- Keep the admin wording task-oriented.
- Keep `GET /register` as the active task source for mobile selection.
- Keep the active state as `draft`.
- Keep task metadata visible in detail.
- Do not introduce ownership filtering unless mobile requires per-user inboxes.

Done when:

- Register documents can be treated as active tasks without any extra transformation layer.

### 2) Inbound

Status:

- Functionally ready for the current mobile picker model.

Checklist:

- Keep `GET /inbound` as the active task source for mobile selection.
- Keep the active state as `draft`.
- Preserve line-item detail for execution.
- Keep web admin read-only for inbound.
- Defer scan/confirmation endpoints until the mobile flow explicitly needs them.
- Do not introduce ownership filtering unless mobile requires per-user inboxes.

Done when:

- Inbound documents can be selected and opened from the mobile picker without backend redesign.
- Web admin only reviews inbound records sourced from register.

### 3) Putaway

Status:

- Implemented in backend and frontend contract.

Checklist:

- Keep the module distinct from inbound.
- Keep line items with source/target locations.
- Keep lifecycle states `draft`, `posted`, `done`, `canceled`.
- Make `posted` the active mobile selection state.
- Keep list/detail/create/update/post/cancel endpoints.
- Add optional line completion only if the mobile flow needs it.
- Add ownership fields only if the inbox must be user-specific.

Done when:

- Putaway exists as its own module and the mobile dropdown can consume it using the same pattern as the other modules.

## Execution Order

1. Lock register copy and contract behavior.
2. Keep inbound selection behavior stable for mobile while web admin stays read-only.
3. Keep putaway contract aligned with the final backend/frontend implementation.
4. Add ownership semantics only if product decides the inbox must be executor-specific.

## Validation

- Register still behaves as a header-only task module.
- Inbound still behaves as a line-item task module in mobile and read-only in web admin.
- Putaway is available as a separate task module with its own state machine.
- Mobile selection is based on module + active status, not on finalized records.
