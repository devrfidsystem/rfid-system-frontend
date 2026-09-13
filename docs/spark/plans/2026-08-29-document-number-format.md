# Document Number Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New transaction forms default document numbers to the `PREFIX-YYMMDD-001` format, including outbound as `OUT-250826-001`.

**Architecture:** Keep document-number formatting in a small transaction utility, then consume it from `useTransactionCreate`. Existing edit mode continues to load and preserve the backend record's document number.

**Tech Stack:** Vue 3, TypeScript, Vitest.

## Global Constraints

- Follow the existing frontend flow: `view -> composable -> service -> api -> dto`.
- Use TDD: write failing Vitest tests before production code.
- Keep uniqueness outside this batch; backend validation remains responsible for rejecting duplicate document numbers.

---

### Task 1: Transaction Document Number Helper

**Files:**

- Create: `src/views/transactions/utils/documentNumber.ts`
- Create: `src/views/transactions/utils/documentNumber.test.ts`
- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Test: `src/views/transactions/composables/useTransactionCreate.test.ts`

**Interfaces:**

- Produces: `buildDefaultDocumentNumber(transactionKey: TransactionKey, date?: Date): string`
- Consumes: `TransactionKey` from `src/api/feature/dto/transactions.dto.ts`

- [x] **Step 1: Write the failing tests**

```ts
expect(
    buildDefaultDocumentNumber(
        "outbound",
        new Date("2025-08-26T00:00:00.000Z"),
    ),
).toBe("OUT-250826-001");
```

- [x] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- src/views/transactions/utils/documentNumber.test.ts src/views/transactions/composables/useTransactionCreate.test.ts`

- [x] **Step 3: Write minimal implementation**

Implement prefix/date formatting in `documentNumber.ts` and replace `TRX-${Date.now()}` in `useTransactionCreate.ts`.

- [x] **Step 4: Run focused tests and type-check**

Run:

- `npm run test:unit -- src/views/transactions/utils/documentNumber.test.ts src/views/transactions/composables/useTransactionCreate.test.ts`
- `npm run type-check`
