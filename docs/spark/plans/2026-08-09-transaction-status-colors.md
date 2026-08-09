# Transaction Status Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize transaction status label formatting and color mapping so status badges are consistently colored across transaction pages.

**Architecture:** Create a transaction-scoped utility and replace local duplicate status mapping in transaction list, detail, and summary components.

**Tech Stack:** Vue 3, TypeScript, Vitest.

## Global Constraints

- Do not change API contracts or transaction lifecycle behavior.
- Preserve existing labels and page structure.
- Use TDD with failing tests before implementation.
- Keep changes inside `src/views/transactions`.

---

### Task 1: Status Utility

**Files:**
- Create: `src/views/transactions/utils/transactionStatus.ts`
- Create: `src/views/transactions/utils/transactionStatus.test.ts`

**Interfaces:**
- `formatTransactionStatus(value?: string | null): string`
- `getTransactionStatusTone(value?: string | null): BadgeTone`

- [ ] Write failing tests for status tone groups and label formatting.
- [ ] Run `npx vitest run src/views/transactions/utils/transactionStatus.test.ts` and confirm failure.
- [ ] Implement the utility.
- [ ] Re-run and confirm pass.

### Task 2: Integrate Transaction Status Labels

**Files:**
- Modify: `src/views/transactions/components/TransactionTable.vue`
- Modify: `src/views/transactions/composables/useTransactionDetail.ts`
- Modify: `src/views/transactions/components/TransactionSummaryWidget.vue`
- Modify tests for the touched surfaces.

- [ ] Write failing tests showing list/detail/summary use shared distinct tones.
- [ ] Run focused tests and confirm failure.
- [ ] Replace local status mapping with shared utility imports.
- [ ] Re-run focused tests and confirm pass.

### Task 3: Verification

- [ ] Run focused transaction tests.
- [ ] Run `npm run type-check`.
