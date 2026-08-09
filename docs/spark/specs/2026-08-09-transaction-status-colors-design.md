# Transaction Status Colors Design

- Last Updated: 2026-08-09
- Scope: transaction list, detail, and summary status labels

## Goal

Make transaction status label colors consistent and visually distinct across every transaction page.

## Design

Add a transaction-scoped status utility under `src/views/transactions/utils/transactionStatus.ts`.

It owns:

- `formatTransactionStatus(status)`
- `getTransactionStatusTone(status)`

Mapping:

- draft-like states (`draft`, `pending`, `processing`, `queued`, `counting`, `assigned`, `in_progress`) use `warning`.
- in-progress/posting states (`posted`, `dispatched`) use `info`.
- `partial` uses `teal`.
- success/finished states (`done`, `completed`, `closed`, `reconciled`, `approved`, `success`) use `success`.
- failure/cancelled states (`canceled`, `cancelled`, `failed`, `error`, `rejected`, `void`, `voided`) use `error`.
- unknown or empty states use `neutral`.

## Integration

Use the shared helper from:

- `TransactionTable.vue`
- `useTransactionDetail.ts`
- `TransactionSummaryWidget.vue`

## Testing

Add direct unit tests for the helper and update existing transaction component/composable tests to prove list, detail, and summary consume the same mapping.
