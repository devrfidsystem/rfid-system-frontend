# Putaway Location First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Putaway create flow starts from a source location, then lists only products that have stock in that location and shows available quantity in the product label.

**Architecture:** Reuse existing stock balance API from the transaction create composable. Putaway line UI renders source location before product/target fields, while payload keeps the backend's existing `sourceLocationId` and `targetLocationId` shape.

**Tech Stack:** Vue 3, TypeScript, Vitest.

## Global Constraints

- Do not add a new backend endpoint unless existing stock balance API cannot support the flow.
- Product filtering is scoped by selected warehouse and source location.
- Location lists continue excluding `locationType=product`.

---

### Task 1: Putaway Source-Location Product Filtering

**Files:**

- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `src/views/transactions/composables/useTransactionCreate.test.ts`
- Modify: `src/views/transactions/components/TransactionLineItems.vue`
- Modify: `src/views/transactions/components/TransactionLineItems.test.ts`

**Interfaces:**

- Consumes: `stockService.fetchBalance({ warehouseId, locationId, limit })`
- Produces: putaway product options labeled with available quantity, e.g. `SKU-1 - Widget (Qty 12)`.

- [x] **Step 1: Write failing tests**

Run:

- `npm run test:unit -- src/views/transactions/composables/useTransactionCreate.test.ts src/views/transactions/components/TransactionLineItems.test.ts`

- [x] **Step 2: Implement minimal code**

Import `stockService`, watch putaway source locations, load stock balance records, and render putaway source location select.

- [x] **Step 3: Verify**

Run:

- `npm run test:unit -- src/views/transactions/composables/useTransactionCreate.test.ts src/views/transactions/components/TransactionLineItems.test.ts`
- `npm run type-check`
