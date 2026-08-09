# Transaction Summary One Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make transaction summary widget cards render in one row on large screens.

**Architecture:** Keep the change local to `TransactionSummaryWidget.vue`. Use Tailwind responsive grid classes and existing SSR component tests.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Vitest SSR rendering.

## Global Constraints

- Do not change transaction data fetching or API contracts.
- Preserve mobile responsiveness.
- Preserve loading, error, empty, and populated states.
- Use TDD: test fails before component class changes.

---

### Task 1: Transaction Summary Layout

**Files:**
- Modify: `src/views/transactions/components/TransactionSummaryWidget.test.ts`
- Modify: `src/views/transactions/components/TransactionSummaryWidget.vue`

**Interfaces:**
- Consumes: existing `TransactionSummaryWidget` props `loading`, `error`, and `summary`.
- Produces: same component API with updated responsive layout classes.

- [ ] **Step 1: Write failing SSR layout test**

Add an assertion that rendered HTML contains `lg:grid-cols-4` on the widget root and `lg:col-span-4` for full-width error/empty states.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: FAIL because current widget uses `sm:grid-cols-2` only.

- [ ] **Step 3: Implement minimal layout class changes**

Change root class to `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`; change error and empty card spans to `sm:col-span-2 lg:col-span-4`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: PASS.

### Task 2: Verification

**Files:**
- No additional files.

- [ ] **Step 1: Run focused transaction widget test**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: PASS.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS or report unrelated existing failures with evidence.
