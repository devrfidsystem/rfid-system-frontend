# Register, Inbound, Putaway Execution Plan

> Scope locked to:
>
> - `register`
> - `inbound`
> - `putaway`

## Objective

Align web admin task creation and mobile document selection around three modules:

- `register` as a header-only task/document flow
- `inbound` as a receipt task/document flow
- `putaway` as a new task/document module

Mobile behavior is limited to:

- select module
- select active document number from a dropdown
- open the selected task detail

## Current State

### Register

Already exists and is close to final:

- frontend list/create/detail all route through the transaction module
- backend exposes `POST /register`, `GET /register`, `GET /register/:id`, `POST /register/:id/post`, `POST /register/:id/cancel`
- active task state for mobile selection should be `draft`

### Inbound

Already exists as a task/document module:

- backend has create/list/detail/update/post/cancel
- current posting mutates stock
- mobile selection should use active task state `draft`

### Putaway

Already implemented:

- has its own backend module
- has its own lifecycle
- should not be modeled as a rename of `inbound`

## Implementation Order

### Phase 1: Finalize mobile selection contract

Goal:

- document number dropdown works the same way across modules
- mobile can consume active tasks with minimal branching

Actions:

- finalize active status per module
- define dropdown label/value shape

Expected outcome:

- `register` and `inbound` use `status=draft`
- `putaway` uses `status=posted`

### Phase 2: Lock down `register`

Goal:

- ensure `register` is fully consistent as an admin-created task/document

Actions:

- keep list filter on `docDate`
- keep detail showing `registeredBy` and `createdBy`
- keep create copy task-oriented

Expected outcome:

- no legacy RFID wording in register UI
- backend response contains the fields the frontend uses
- mobile can safely use `GET /register` for task selection

### Phase 3: Align `inbound` for task selection

Goal:

- make sure inbound remains consumable as a task list for mobile while web admin stays read-only

Actions:

- keep `GET /inbound` as the source of truth for selectable tasks
- filter to active status only in the mobile picker
- do not change inbound posting behavior yet
- keep inbound create hidden/blocked in web admin

Expected outcome:

- mobile can select an inbound document number from active tasks
- no backend redesign is needed to start

### Phase 4: Define `putaway`

Goal:

- keep `putaway` aligned with the implemented backend/frontend contract

Actions:

- keep create/list/detail/update/post/cancel endpoints stable
- keep lines required in v1
- keep `posted` as the active mobile state for dropdown selection

Expected outcome:

- `putaway` becomes a first-class module
- mobile selection contract can be applied the same way as register/inbound
- web admin labels stay aligned with task-oriented terminology

## Decisions Needed Before Code

### Register

- Should `register` remain header-only permanently?
- Do we need mobile to filter `register` by warehouse or executor ownership?

### Inbound

- Is mobile only selecting draft inbound documents, or will it also execute scan/confirmation per line?
- If line execution is needed, do we add line-level endpoints now or later?

### Putaway

- Should a `putaway` task be created from an inbound reference?
- Should the first version include lines?
- Should task ownership be user-specific?

## Recommended MVP

### Register

- keep as header-only
- mobile selects from `draft` only

### Inbound

- keep current document lifecycle
- mobile selects from `draft` only
- web admin only reviews inbound records sourced from register

### Putaway

- create a new module
- include lines from the start
- use a simple lifecycle
- activate tasks with `posted`
- expose one list endpoint for mobile selection

## Exit Criteria

The scope is done when:

- `register` is final and consistent in web admin
- `inbound` is confirmed usable as a mobile task list and stays read-only in web admin
- `putaway` contract remains aligned with the implemented backend/frontend module
- no module outside `register`, `inbound`, or `putaway` is changed as part of this work
