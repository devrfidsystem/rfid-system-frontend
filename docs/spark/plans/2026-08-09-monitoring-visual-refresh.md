# Monitoring Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the monitoring widgets' visual hierarchy and scanability while preserving existing data flow.

**Architecture:** Keep changes local to `MonitoringPage.vue`, `MonitoringDomainCard.vue`, `MonitoringLiveFeed.vue`, and `MonitoringExceptionFeed.vue`. Use existing Tailwind classes and SSR component tests.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Vitest SSR rendering.

## Global Constraints

- Do not change API contracts, polling cadence, or composable data flow.
- Preserve loading, empty, and error states.
- Preserve mobile stacking and desktop responsive behavior.
- Use TDD with failing SSR tests before component changes.

---

### Task 1: Monitoring Page Command Layout

**Files:**
- Modify: `src/views/dashboard/MonitoringPage.test.ts`
- Modify: `src/views/dashboard/MonitoringPage.vue`

**Interfaces:**
- Consumes: existing `useMonitoring()` return shape.
- Produces: same page API with lower widgets wrapped in `lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]`.

- [ ] Write failing SSR assertion for the lower command-layout grid.
- [ ] Run `npx vitest run src/views/dashboard/MonitoringPage.test.ts` and confirm failure.
- [ ] Add the responsive lower grid wrapper.
- [ ] Re-run the test and confirm pass.

### Task 2: Domain Card Scanability

**Files:**
- Modify: `src/views/dashboard/components/MonitoringDomainCard.test.ts`
- Modify: `src/views/dashboard/components/MonitoringDomainCard.vue`

**Interfaces:**
- Consumes: existing `DomainHealth` prop shape.
- Produces: same component API with accent border, capped queue preview, and `+N more` overflow copy.

- [ ] Write failing SSR assertions for `border-l-4`, critical exception emphasis, and `+N more in queue`.
- [ ] Run `npx vitest run src/views/dashboard/components/MonitoringDomainCard.test.ts` and confirm failure.
- [ ] Implement computed visual classes and capped queue preview.
- [ ] Re-run the test and confirm pass.

### Task 3: Live Feed Scanability

**Files:**
- Modify: `src/views/dashboard/components/MonitoringLiveFeed.test.ts`
- Modify: `src/views/dashboard/components/MonitoringLiveFeed.vue`

**Interfaces:**
- Consumes: existing `LiveTransactionRow[]` prop shape.
- Produces: same component API with status dot, exception row background, and SLA threshold colors.

- [ ] Write failing SSR assertions for the status dot, exception row background, and danger SLA color.
- [ ] Run `npx vitest run src/views/dashboard/components/MonitoringLiveFeed.test.ts` and confirm failure.
- [ ] Implement row and SLA visual helpers.
- [ ] Re-run the test and confirm pass.

### Task 4: Exception Feed Compact State

**Files:**
- Modify: `src/views/dashboard/components/MonitoringExceptionFeed.test.ts`
- Modify: `src/views/dashboard/components/MonitoringExceptionFeed.vue`

**Interfaces:**
- Consumes: existing `LiveTransactionRow[]` prop shape.
- Produces: same component API with compact empty state.

- [ ] Write failing SSR assertion for compact empty-state class.
- [ ] Run `npx vitest run src/views/dashboard/components/MonitoringExceptionFeed.test.ts` and confirm failure.
- [ ] Reduce empty-state padding/visual weight.
- [ ] Re-run the test and confirm pass.

### Task 5: Verification

- [ ] Run focused monitoring tests:
  `npx vitest run src/views/dashboard/MonitoringPage.test.ts src/views/dashboard/components/MonitoringDomainCard.test.ts src/views/dashboard/components/MonitoringLiveFeed.test.ts src/views/dashboard/components/MonitoringExceptionFeed.test.ts`
- [ ] Run `npm run type-check`.
