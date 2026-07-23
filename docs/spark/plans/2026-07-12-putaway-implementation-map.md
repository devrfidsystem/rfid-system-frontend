# Putaway Implementation Map

> Scope: `putaway` only.

## Purpose

Map the `putaway` blueprint into concrete backend work items by layer.

## Recommended Layer Breakdown

### 1) Data Model Layer

Work items:

- add `PutawayDoc` model
- add `PutawayLine` model
- add document-line relation
- add relations to `company`, `warehouse`, `product`, and `location`
- add status enum for `draft`, `posted`, `done`, `canceled`

Output expected:

- a persisted document structure that supports list, detail, and task execution

### 2) DTO Layer

Work items:

- create `CreatePutawayDto`
- create `UpdatePutawayDto`
- create `PutawayListQueryDto`
- create `PutawayDetailDto`
- create action DTOs for `post`, `cancel`, and `complete` if the codebase prefers explicit classes

Output expected:

- strongly typed request and response payloads for the new module

### 3) Service Layer

Work items:

- implement create
- implement list
- implement detail
- implement update while `draft`
- implement post transition
- implement cancel transition
- implement complete transition
- validate allowed status changes

Output expected:

- all `putaway` business rules enforced in one place

### 4) Controller Layer

Work items:

- expose `POST /putaway`
- expose `GET /putaway`
- expose `GET /putaway/:id`
- expose `PATCH /putaway/:id`
- expose `POST /putaway/:id/post`
- expose `POST /putaway/:id/cancel`
- expose `POST /putaway/:id/complete`

Output expected:

- API surface that matches the contract documents

### 5) Module Wiring

Work items:

- register the module in the warehouse feature tree
- ensure repository/service dependencies are wired correctly
- export the module only where needed

Output expected:

- backend can resolve the `putaway` provider chain cleanly

## Endpoint-to-Layer Mapping

### `POST /putaway`

Touches:

- controller
- create DTO
- service create
- data model

### `GET /putaway`

Touches:

- controller
- list query DTO
- service list
- data model relations

### `GET /putaway/:id`

Touches:

- controller
- detail DTO
- service detail
- data model relations

### `PATCH /putaway/:id`

Touches:

- controller
- update DTO
- service update
- data model

### `POST /putaway/:id/post`

Touches:

- controller
- service transition logic
- status validation

### `POST /putaway/:id/cancel`

Touches:

- controller
- service transition logic
- status validation

### `POST /putaway/:id/complete`

Touches:

- controller
- service transition logic
- status validation

## Suggested Build Order

1. data model
2. DTOs
3. service logic
4. controller routes
5. wiring and tests

## Definition of Ready

- payload contract is fixed
- lifecycle is fixed
- active mobile status is fixed
- ownership filtering is deferred unless explicitly required
