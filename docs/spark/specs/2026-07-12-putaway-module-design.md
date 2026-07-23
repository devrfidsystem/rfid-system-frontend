# Putaway Module Design

> Scope: `putaway` is a new module. It is not a rename of `register` or `inbound`. It needs its own document model, lifecycle, and API contract.

## Context

The current repository already has:

- `register` as a header-only task/document module
- `inbound` as a line-item receipt document with stock posting

`putaway` should sit alongside those modules as a first-class warehouse workflow.

## Product Interpretation

`putaway` represents the task of placing received stock into a storage location after the goods are available for storage. It is operationally distinct from `inbound` because:

- `inbound` is about receiving goods into the warehouse system.
- `putaway` is about assigning or confirming final storage location.

That means `putaway` needs:

- document identity
- header metadata
- item/task lines
- location assignment
- task execution status

## Recommended Workflow

### Admin side

1. Admin creates a putaway task.
2. Admin attaches the source document reference, warehouse, and task lines.
3. Admin assigns one or more target locations.
4. Task is saved in `draft`.
5. Task is posted/activated for the executor.

### Executor side

1. Executor selects a putaway task from the module list.
2. Executor sees task lines and target location instructions.
3. Executor confirms the storage location.
4. Executor confirms the item.
5. Task is marked complete.

## Proposed States

Use a simple lifecycle first:

- `draft`
- `posted`
- `done`
- `canceled`

If a more granular workflow is needed later, expand with:

- `assigned`
- `in_progress`
- `verified`

For now, keep it minimal unless the mobile team explicitly needs finer steps.

## Proposed Data Shape

### Header fields

- `id`
- `companyId`
- `docNumber`
- `docDate`
- `sourceDocType` or `referenceType`
- `sourceDocId` or `referenceId`
- `warehouseId`
- `status`
- `notes`
- `createdById`
- `createdAt`
- `updatedAt`

### Line fields

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
- source document relation if needed later
- createdBy
- optional assignedBy / executedBy if executor ownership is required

## API Contract

### Admin task creation

- `POST /putaway`
- `GET /putaway`
- `GET /putaway/:id`
- `PATCH /putaway/:id`
- `POST /putaway/:id/post`
- `POST /putaway/:id/cancel`

### Mobile execution

Keep the same endpoints if mobile is only consuming the existing document API.
If the execution flow requires line-level updates, add:

- `PATCH /putaway/:id/lines/:lineId`
- `POST /putaway/:id/complete`

Do not add these until the execution requirement is explicit.

## Dropdown Contract

The mobile list should show only task-active `putaway` documents.

Recommended:

- active status: `posted`
- after execution: `done`
- final/hidden: `canceled`

This differs from `register` and `inbound`, where `draft` is the active selection state.

## Relation To Existing Modules

### Not `register`

- `register` is header-only.
- `putaway` needs lines and location assignment.

### Not `inbound`

- `inbound` records receipt of incoming stock.
- `putaway` records the storage placement after receipt.

## Suggested Implementation Order

1. Prisma model + migration.
2. Module service/controller/DTOs.
3. Admin create/list/detail screens if needed.
4. Mobile list contract.
5. Line execution endpoint only if the mobile flow needs partial completion.

## Open Decisions

- Should `putaway` be created from an `inbound` document reference?
- Should task ownership be user-specific?
- Should task completion happen per line or per task?
- Should target location be chosen by system suggestion or admin input?

## Recommendation

Start with a minimal task model:

- one header document
- task lines with target locations
- simple `draft -> posted -> done/canceled` lifecycle

This keeps `putaway` consistent with the rest of the module architecture without over-designing the first version.
