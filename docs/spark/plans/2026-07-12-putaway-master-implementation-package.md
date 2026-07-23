# Putaway Master Implementation Package

> Scope: `putaway` only.

## Goal

Provide one consolidated reference for implementing `putaway` without needing to jump between multiple planning docs.

## Canonical Decisions

- `putaway` is a new module, not a rename of `register` or `inbound`.
- `putaway` uses a document + line-item structure.
- `putaway` lifecycle is `draft -> posted -> done/canceled`.
- Mobile selection uses `status=posted`.
- Ownership filtering is deferred unless explicitly required later.

## Workflow Summary

### Admin

1. Create the putaway document in `draft`.
2. Edit it while it remains draft.
3. Post it when ready for execution.
4. Cancel it if invalid.

### Executor

1. Open the posted task from the mobile dropdown.
2. Review line items and target locations.
3. Complete the task once placement is confirmed.

## Files In Scope

### Specs

- [Putaway Module Design](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-module-design.md)
- [Putaway Backend Contract](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-backend-contract.md)
- [Putaway Implementation Blueprint](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-implementation-blueprint.md)
- [Putaway API Payload Contract](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-api-payload-contract.md)
- [Putaway Status Transition Matrix](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-12-putaway-status-transition-matrix.md)

### Plans

- [Putaway Implementation Map](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-implementation-map.md)
- [Putaway DTO Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-dto-checklist.md)
- [Putaway Endpoint Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-endpoint-checklist.md)
- [Putaway Test Checklist](/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/plans/2026-07-12-putaway-test-checklist.md)

## Build Order

1. Data model.
2. DTOs.
3. Service logic.
4. Controller routes.
5. Module wiring.
6. Tests.

## Implementation Requirements

### Data Model

- `PutawayDoc`
- `PutawayLine`
- relations to company, warehouse, product, and location
- status enum covering `draft`, `posted`, `done`, `canceled`

### DTOs

- `CreatePutawayDto`
- `UpdatePutawayDto`
- `PutawayListQueryDto`
- `PutawayDetailDto`
- optional action DTOs for post, cancel, and complete

### Endpoints

- `POST /putaway`
- `GET /putaway`
- `GET /putaway/:id`
- `PATCH /putaway/:id`
- `POST /putaway/:id/post`
- `POST /putaway/:id/cancel`
- `POST /putaway/:id/complete`

### Status Rules

- only `draft` can be edited
- only `draft` can be posted
- only `posted` can be completed
- `draft` and `posted` can be canceled
- `done` and `canceled` are terminal

### Mobile Rules

- module selector first
- active list endpoint next
- primary label is `docNumber`
- only `posted` docs appear in the dropdown

## Test Minimum

- create validation
- list filtering
- detail payload
- draft-only updates
- post transition
- complete transition
- cancel transition
- mobile list filtering

## Exit Criteria

- `putaway` can be created, posted, completed, and canceled
- mobile can pick only executable tasks
- the module does not depend on `register` or `inbound` semantics to function
