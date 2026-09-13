# Transaction Direct Detail Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace transaction row action popovers with direct action buttons for viewing transaction details.

**Architecture:** Keep behavior inside `src/views/transactions/components/TransactionTable.vue`. The table still emits the existing `view` event with `row.id`, but the UI no longer depends on the shared `RowActions` menu/popover component.

**Tech Stack:** Vue 3 Composition API, TypeScript, lucide-vue-next, existing atom `Button`/`Icon`, Vitest.

## Global Constraints

- Do not change transaction navigation or emitted event names.
- Do not use popover/menu/dropdown for transaction detail actions.
- Preserve existing `object-id` conventions for test automation.

---

### Task 1: Transaction Table Direct Button

**Files:**

- Modify: `src/views/transactions/components/TransactionTable.vue`
- Verify: `src/views/transactions/composables/useTransactionList.test.ts`

**Interfaces:**

- Consumes: row objects with `id`.
- Produces: direct button that emits `view` with `String(row.id)`.

- [ ] Remove the `RowActions` import and usage.
- [ ] Render a direct outline button with icon and `View Details` label in the `rowActions` slot.
- [ ] Keep the `view` event payload unchanged.
- [ ] Run transaction focused tests and type-check.
