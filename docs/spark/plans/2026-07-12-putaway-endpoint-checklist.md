# Putaway Endpoint Checklist

> Scope: `putaway` only.

## Purpose

Map each `putaway` endpoint to the minimum implementation tasks required for v1.

## Endpoints

### `POST /putaway`

Checklist:

- validate create payload
- reject empty line array
- create header row
- create line rows
- persist `draft` status
- return full document detail or create response in the agreed shape

Notes:

- this is the only place where a new document is created

### `GET /putaway`

Checklist:

- accept list filters
- return admin-ready rows
- support mobile filter `status=posted`
- include enough summary fields for the dropdown

Notes:

- list endpoint must serve both admin and mobile use cases

### `GET /putaway/:id`

Checklist:

- load header
- load lines
- load relation data needed by the executor
- return not found when the document id does not exist

Notes:

- this is the canonical detail source for mobile execution

### `PATCH /putaway/:id`

Checklist:

- reject non-draft documents
- allow header edits while draft
- allow line edits while draft
- validate updated line payloads
- persist changes without changing status

Notes:

- once posted, use explicit action endpoints instead of PATCH

### `POST /putaway/:id/post`

Checklist:

- reject non-draft documents
- change status to `posted`
- keep lines intact
- make the task visible to mobile picker queries

Notes:

- posting does not complete the task

### `POST /putaway/:id/cancel`

Checklist:

- reject already done documents
- allow draft cancellation
- allow posted cancellation
- change status to `canceled`
- make the task disappear from mobile picker queries

Notes:

- cancel is terminal

### `POST /putaway/:id/complete`

Checklist:

- reject non-posted documents
- change status to `done`
- keep document history intact
- make the task disappear from mobile picker queries

Notes:

- this endpoint is executor-owned

## Shared Guards

- enforce valid status transitions in the service layer
- do not allow controller-level bypasses
- keep document lines immutable after post unless a specific execution rule is added later

## Recommended Order of Work

1. create endpoint
2. list endpoint
3. detail endpoint
4. post/cancel transitions
5. complete transition
6. update route for draft-only edits

## Definition of Done

- every endpoint matches the blueprint and payload contract
- mobile picker only sees posted documents
- draft, done, and canceled documents never leak into active selection
