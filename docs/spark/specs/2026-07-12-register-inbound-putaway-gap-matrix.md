# Register, Inbound, Putaway Gap Matrix

> Scope locked to:
>
> - `register`
> - `inbound`
> - `putaway`

## Purpose

Convert the existing process analysis into a concrete implementation matrix for web admin task creation and the mobile task list.

## Module Matrix

| Module   | Web Admin Role                                             | Mobile Role                           | Active State | Notes                                      |
| -------- | ---------------------------------------------------------- | ------------------------------------- | ------------ | ------------------------------------------ |
| Register | Admin creates task header                                  | Executor picks task from list         | `draft`      | Header-only; no line items                 |
| Inbound  | Admin reviews read-only inbound data sourced from register | Executor picks inbound task from list | `draft`      | Web admin does not create inbound directly |
| Putaway  | Admin creates warehouse task                               | Executor picks posted task from list  | `posted`     | Line-item workflow with storage placement  |

### Register

Current state:

- Already implemented as a transaction-style document module.
- Header-only.
- Frontend already routes through register pages.
- Backend supports list, detail, post, and cancel.

Current gap:

- The wording and contract must stay task-oriented instead of legacy RFID-oriented.
- Mobile selection currently depends on `draft` status only.
- No user-specific task ownership field exists.

Next actions:

- Keep the admin UI terminology as task/document, not RFID tag.
- Keep `GET /register` as the source of truth for active tasks.
- Add executor ownership only if mobile inboxes must be personal.

Acceptance criteria:

- Register is treated as an admin-created task.
- Mobile list shows active register documents only.
- Detail view exposes the task metadata needed by the executor.
- Web admin can continue to create and maintain register tasks.

### Inbound

Current state:

- Already implemented as a document with lines and lifecycle actions.
- Backend supports create, list, detail, update, post, and cancel.
- Posting already mutates stock.
- Web admin treats inbound as read-only review data sourced from register.

Current gap:

- The mobile list contract is still implicit in some docs, even though the backend already supports the document list.
- No line-level execution endpoint is defined for scan/confirmation use cases.
- No task ownership field exists.

Next actions:

- Keep `GET /inbound` as the source of truth for active tasks in mobile.
- Use `draft` as the active selection state for the list.
- Defer line-level execution endpoints until the mobile flow explicitly needs them.

Acceptance criteria:

- Inbound can be selected from the mobile list.
- Active inbound tasks are limited to draft documents.
- No backend redesign is required for the initial mobile flow.
- Web admin does not present inbound as a create flow.
- Web admin only exposes detail/review for inbound data originating from register.

### Putaway

Current state:

- Implemented in the backend and synced into the frontend transaction contract.

Current gap:

- Needs the mobile contract wording to stay explicit in the docs.
- Needs line handling because it is a storage workflow, not just a header-only document.
- Needs a clear active state for mobile selection.

Next actions:

- Define the Prisma model and migration.
- Define create/list/detail/update/post/cancel endpoints.
- Start with `draft -> posted -> done -> canceled`.
- Use `posted` as the active mobile selection state.

Acceptance criteria:

- Putaway exists as a first-class module.
- Mobile can list active putaway tasks from the module list.
- The module does not rely on inbound/register semantics to function.
- Web admin create flow is task-oriented and line-aware.

## Mobile Selection Contract

Recommended base behavior:

- User selects module first.
- App loads active tasks for that module.
- App shows document number as the primary label.
- App opens the task detail for execution.

Recommended active states:

- `register`: `draft`
- `inbound`: `draft`
- `putaway`: `posted`

## Implementation Priority

1. Finalize register copy and keep the current backend contract stable.
2. Formalize inbound as a mobile-selectable document task.
3. Implement putaway as the new module with its own state machine.
4. Add ownership filtering only if the mobile inbox must be user-specific.
