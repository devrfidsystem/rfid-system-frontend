# Transaction Summary One Row Design

- Last Updated: 2026-08-09
- Scope: `src/views/transactions/components/TransactionSummaryWidget.vue`

## Goal

Show transaction summary widget cards in one row on desktop-width transaction pages while preserving mobile responsiveness.

## Design

`TransactionSummaryWidget` remains the single owner of the summary widget layout. Its root grid changes from two desktop columns to four large-screen columns: one column on mobile, two columns from `sm`, and four columns from `lg`.

Error and empty states must still occupy the full visible row for the active breakpoint. Loading state still renders four skeleton blocks.

## Testing

Update the existing SSR component test to assert the root layout includes `lg:grid-cols-4` and full-width error/empty cards include the matching large-screen span class.
