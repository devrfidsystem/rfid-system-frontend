# Putaway Status Transition Matrix

> Scope: `putaway` only.

## Purpose

Define exactly which status transitions are allowed for the first version of `putaway`.

## Statuses

- `draft`
- `posted`
- `done`
- `canceled`

## Role Intent

### Admin

- creates the document
- edits the document while it is still draft
- posts the task when it is ready for execution
- cancels the task if it is no longer valid

### Executor

- opens the posted task from the mobile list
- completes the task after storage placement is confirmed

## Allowed Transitions

### `draft -> posted`

Trigger:

- admin posts the task

Effect:

- task becomes visible in the mobile list
- document becomes executable

### `draft -> canceled`

Trigger:

- admin cancels the task before activation

Effect:

- task is removed from active selection
- document is no longer executable

### `posted -> done`

Trigger:

- executor completes the task

Effect:

- task leaves the mobile list
- document is closed for execution

### `posted -> canceled`

Trigger:

- admin invalidates the task after activation

Effect:

- task leaves the mobile list
- document is no longer executable

## Disallowed Transitions

- `posted -> draft`
- `done -> draft`
- `done -> posted`
- `done -> canceled`
- `canceled -> draft`
- `canceled -> posted`
- `canceled -> done`

## Endpoint Ownership

### Admin-owned actions

- `POST /putaway/:id/post`
- `POST /putaway/:id/cancel`

### Executor-owned action

- `POST /putaway/:id/complete`

### Draft editing

- `PATCH /putaway/:id`

Only allowed while status is `draft`.

## Validation Rules

### Posting

- must reject non-draft documents
- must not mutate lines unexpectedly
- must leave lines intact for execution

### Completing

- must reject non-posted documents
- must not allow completion after cancellation
- must move the document to `done`

### Canceling

- must reject done documents
- should be allowed from `draft` and `posted`
- must remove the document from the mobile list

## Mobile Picker Rule

The mobile list must only show `posted` documents.

That means:

- `draft` is not executable
- `done` is not executable
- `canceled` is not executable

## Implementation Notes

- keep status checks in the service layer
- avoid duplicating transition logic in the controller
- do not introduce extra statuses in v1 unless a concrete execution step requires them
