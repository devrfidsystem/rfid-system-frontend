# Transactions Flow Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Transactions frontend with the approved flow: Relocation replaces Transfer, and transaction actions respect CRUD permissions.

**Architecture:** Keep the existing route/service/composable layering. Remove Transfer from the supported frontend transaction contract and make list/detail action visibility derive from the existing permission store plus status rules.

**Tech Stack:** Vue 3, TypeScript, Vitest, Selenium E2E, Vite.

## Global Constraints

- Preserve existing sidebar icon and Transfer-hidden changes.
- Opname remains a dedicated flow and is not routed through generic transaction pages.
- Do not change backend APIs or database behavior.
- Existing unrelated working-tree changes must remain untouched.

### Task 1: Remove Transfer from the supported frontend transaction surface

**Files:**

- Modify: `src/api/feature/dto/transactions.dto.ts`
- Modify: `src/views/transactions/composables/useTransactionList.ts`
- Modify: `src/views/transactions/composables/useTransactionDetail.ts`
- Modify: `src/views/transactions/transactionFlow.ts`
- Modify: `src/views/transactions/utils/documentNumber.ts`
- Modify: `src/domain/report/reportConfig.ts`
- Modify: `src/views/dashboard/components/ProcessActivityPicker.vue`
- Test: `src/router/productionRoutes.test.ts`
- Test: `src/views/transactions/transactionFlow.test.ts`

- [ ] Add failing assertions that Transfer is absent from the supported transaction contract, action rules, report/activity options, and routes.
- [ ] Run the focused tests and confirm they fail for the existing Transfer references.
- [ ] Remove Transfer references while preserving Relocation and dedicated Opname behavior.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Enforce CRUD permissions on list and detail actions

**Files:**

- Modify: `src/views/transactions/composables/useTransactionList.ts`
- Modify: `src/views/transactions/composables/useTransactionDetail.ts`
- Test: `src/views/transactions/composables/useTransactionList.test.ts`
- Test: `src/views/transactions/composables/useTransactionDetail.test.ts`

- [ ] Add failing tests for a view-only permission hiding Create and action permissions hiding Edit/Post/Cancel/Complete.
- [ ] Run the focused tests and confirm the permission assertions fail.
- [ ] Resolve transaction menu permissions through `usePermission()` and combine them with existing status rules.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Tighten transaction E2E coverage

**Files:**

- Modify: `tests/e2e/transactions.e2e.js`

- [ ] Remove Transfer from the E2E transaction matrix.
- [ ] Replace broad catch-to-PASS behavior in validation/search/filter/sort/pagination checks with explicit skip only for documented environment limitations.
- [ ] Keep Admin login coverage separate from permission coverage and label permission coverage as untested.

### Task 4: Verify the complete change

- [ ] Run focused transaction tests.
- [ ] Run the complete unit test suite.
- [ ] Run type-check.
- [ ] Run production build.
- [ ] Review diff and confirm no unrelated files were changed by this task.
