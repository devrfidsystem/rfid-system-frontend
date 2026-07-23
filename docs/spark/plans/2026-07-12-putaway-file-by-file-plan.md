# Putaway File-by-File Plan

> Scope: `putaway` only.

## Purpose

Translate the master implementation package into concrete files that need to be added or updated.

## Expected Backend Files

### Module Registration

- add `putaway.module.ts`
- register service and controller providers
- export the module where the warehouse feature tree expects it

### Controller

- add `putaway.controller.ts`
- wire `POST /putaway`
- wire `GET /putaway`
- wire `GET /putaway/:id`
- wire `PATCH /putaway/:id`
- wire `POST /putaway/:id/post`
- wire `POST /putaway/:id/cancel`
- wire `POST /putaway/:id/complete`

### Service

- add `putaway.service.ts`
- implement create/list/detail/update
- implement post/cancel/complete transitions
- enforce draft-only updates
- enforce posted-only completion
- keep transition rules in the service layer

### DTOs

- add `create-putaway.dto.ts`
- add `update-putaway.dto.ts`
- add `putaway-list-query.dto.ts`
- add `putaway-detail.dto.ts`
- add `putaway-action.dto.ts` if the codebase uses explicit action payloads

### Prisma

- add `PutawayDoc` model
- add `PutawayLine` model
- add status enum or equivalent field
- add relations for company, warehouse, product, and location
- add migration for the new tables

### Tests

- add `putaway.service.spec.ts`
- add controller or e2e tests if the repo uses them for new modules
- cover create, list, detail, update, post, cancel, and complete behavior

## File Responsibilities

### `putaway.module.ts`

- declare controller
- declare service
- import shared dependencies

### `putaway.controller.ts`

- validate request boundaries
- delegate business logic to service
- avoid transition logic in controller

### `putaway.service.ts`

- own data access
- own transitions
- own list filtering
- own validation guards that require domain context

### DTO files

- validate structure
- normalize payloads
- keep API contracts stable

### Prisma schema and migration

- persist header and line data
- make relation loading possible for detail endpoints
- make status transitions queryable

## Build Sequence

1. Prisma model and migration.
2. DTOs.
3. Service.
4. Controller.
5. Module wiring.
6. Tests.

## Done When

- every endpoint in the contract has a corresponding file or method
- every file has a single responsibility
- putaway can be implemented without touching register or inbound
