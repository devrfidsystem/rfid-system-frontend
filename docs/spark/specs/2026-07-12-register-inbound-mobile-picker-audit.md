# Register and Inbound Mobile List Audit

> Scope: `register` and `inbound` only.

## Purpose

Lock the final mobile list contract for the two modules that are already implemented and ready for mobile selection.

## Final Decisions

### Register

- Mobile list endpoint: `GET /register`
- Active status: `draft`
- Primary label: `docNumber`
- Secondary label: `docDate`, `registeredBy.fullName`
- Final states excluded: `posted`, `canceled`
- Detail view must support executor task review

### Inbound

- Mobile list endpoint: `GET /inbound`
- Active status: `draft`
- Primary label: `inbound_no` or normalized `docNo`
- Secondary label: `inbound_date`, `warehouse`
- Final states excluded: `posted`, `canceled`, `done`
- Detail view must support line-item execution review
- Web admin remains read-only and consumes inbound as data that already originated from register.

## Shared Contract Rules

- The mobile app should select a module first.
- The mobile app should then fetch active documents for that module.
- The navigation key should be the document id.
- The list should only show documents that are still executable.
- Finalized documents must not appear in the list.

## Admin vs Mobile Semantics

### Register

- Admin creates the task/document.
- Mobile consumes the created document as an execution task.
- No ownership filter is required for MVP.

### Inbound

- Mobile consumes the inbound document as an execution task.
- Web admin does not create inbound directly and only exposes the existing document data for review.
- No ownership filter is required for MVP.

## Ambiguity Removed

- `register` is not filtered by `posted`.
- `inbound` is not filtered by `posted`.
- `putaway` is the only module in this scope that uses `posted` as the active mobile state.

## Validation Checklist

- `GET /register?status=draft` returns active register tasks.
- `GET /inbound?status=draft` returns active inbound tasks.
- `GET /register` and `GET /inbound` do not surface finalized records in mobile selection.
- Detail endpoints return enough data for task execution screens.

## Conclusion

The final mobile list model for the current scope is:

- `register` -> `draft`
- `inbound` -> `draft`
- `putaway` -> `posted`

This keeps the contract consistent and prevents the active-state mismatch from leaking into implementation.

## Verification Notes

- `register` and `inbound` now reject invalid `status` filter values instead of silently widening the result set.
- `inbound` now validates that every line location belongs to the same warehouse as the document before it is saved.
- `putaway` already had the stricter status validation model and remains the separate module in this scope.
