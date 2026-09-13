# Stock Opname Tree Design

> Scope: enhance the existing `opname` domain into a recursive tree for the web admin flow while preserving the execution role of `task` nodes for mobile.

## Goal

Replace the current flat stock opname management view with a hierarchical tree that supports arbitrary depth and free parent-child relationships.

The tree must support three explicit node types:

- `group` for top-level planning buckets
- `profile` for intermediate grouping
- `task` for executor-facing work items

Only `task` nodes are operational work for the warehouse executor in mobile. `group` and `profile` nodes are structural and used by web admin to organize work.

## Background

The current opname implementation is document-centric:

- one document header
- one set of snapshot/count lines
- a lifecycle of `draft -> counting -> reconciled -> closed`

That model is sufficient for a single opname document, but it does not represent the hierarchy shown in the requested UI:

- `Add New` creates a root group
- `New Profile` creates an intermediate child
- `New Task` creates the executable leaf
- the tree can be deeper or shallower depending on user input

The enhancement should preserve the existing opname business domain, but the shape of the data shown and edited by the admin must become recursive.

## Proposed Domain Model

### Node types

Each opname tree row must have a `nodeType`:

- `group`
- `profile`
- `task`

### Tree relationship

Each node must have:

- `id`
- `parentId` nullable
- `warehouseId`
- `companyId`
- `nodeType`
- `title` or display name
- `status`
- `createdAt`
- `updatedAt`
- optional metadata such as `description`, `date`, `locationSummary`, and `sortOrder`

Rules:

- root nodes have `parentId = null`
- any node can have children except `task`
- `task` nodes are leaf nodes by default
- children must stay in the same company and warehouse scope as their parent

### Execution payload

The existing opname execution data remains attached to `task` nodes:

- snapshot / line items
- counted quantity
- variance
- reconciliation / close flow

This keeps the executor model stable while the admin tree gains hierarchy.

## Backend Design

### Ownership

The existing `opname` module remains the owner of the feature.
No new bounded context is introduced.

### Data access

The backend should expose tree-oriented reads in addition to the current document detail endpoints.

Recommended API shape:

- `GET /opname/tree`
    - returns the recursive hierarchy for the selected warehouse/company scope
- `POST /opname`
    - creates a root `group`
- `POST /opname/:id/children`
    - creates a child `profile` or `task`
- existing execution endpoints remain in place for `task` nodes
    - `start-counting`
    - line updates
    - `reconcile`
    - `close`
    - `cancel`

### Validation rules

- `task` cannot accept children
- child nodes inherit warehouse/company scope from the parent
- `task` nodes must be the only nodes that can enter executor flow
- location mandatory rules must stay enforced for executable work
- warehouse mismatch must be rejected early

### Status handling

The backend may continue to use the existing opname lifecycle internally:

- `draft`
- `counting`
- `reconciled`
- `closed`
- `canceled`

The web UI can display simplified labels:

- `Draft`
- `On Going`
- `Closed`

The mapping should be derived from node state, not hardcoded in the UI.

### Compatibility strategy

The enhancement should preserve existing data where possible.

Two coexistence rules are required:

- existing flat opname documents must still be readable during transition
- new tree nodes should not break the existing stock adjustment flow for task execution

If migration is needed, it should be additive first and destructive only after the tree view is stable.

## Frontend Design

### Page structure

The web admin opname landing page should match the provided Figma pattern:

- top bar with `Select Warehouse`
- three compact filter inputs
- `Add New` button
- tree table with columns:
    - `Groups`
    - `Date`
    - `Status`
    - `Location`
    - `Detail`
    - `Action`

### Tree behavior

The table must render recursively.

Required interaction model:

- root node row can be expanded/collapsed
- each non-task row can show `New Profile`
- each non-task row can show `New Task` when the user wants to create a leaf under that branch
- `task` rows are visually distinct because they are executable items
- arbitrary nesting depth must be supported

### Action model

- `Add New` creates a root `group`
- `New Profile` creates a `profile` child
- `New Task` creates a `task` child

The UI should not assume a fixed 3-level hierarchy.

### Filtering

The three top inputs should be wired as tree filters, not decorative controls.
The initial implementation can keep the filter semantics lightweight if the backend does not yet expose all dimensions, but the UI must reserve the space for them.

## Mobile Impact

Mobile does not need a separate tree editor.

Mobile should continue to receive only `task`-level executable items for opname execution.

The admin tree is the source of truth for organizing tasks, but the mobile flow only needs the task list and execution endpoints.

## Error Handling

The feature must fail closed.

Expected errors:

- trying to add a child under a `task`
- selecting a warehouse that does not match the tree scope
- trying to execute a non-task node
- missing or invalid location for task execution
- stale status transitions such as closing a non-reconciled node

UI behavior:

- show inline error messages for failed create/update actions
- keep the tree visible when one branch fails
- do not collapse unrelated branches on error

## Testing Strategy

### Backend tests

- create root `group`
- create `profile` child
- create `task` child
- reject child creation under `task`
- fetch tree for warehouse scope
- verify execution endpoints only operate on `task` nodes
- verify existing adjustments still apply on close

### Frontend tests

- tree renders recursively
- expand/collapse state works
- root create and child create actions map to the correct node type
- filters do not break tree rendering
- `task` action buttons are shown correctly

## Out of Scope

- changing register, inbound, or putaway behavior in this spec
- redesigning the mobile opname execution UI
- reworking unrelated master data menus
- converting the whole transaction module into the tree model

## Success Criteria

The enhancement is complete when:

- the web admin opener shows a recursive tree instead of a flat list
- `group`, `profile`, and `task` are explicit node types
- `task` is the only executable node type
- admin can add root and child nodes from the tree UI
- existing opname execution logic still works for task nodes
- the UI matches the requested Figma shape closely enough to replace the current transaction list view
