# Dashboard Operational Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dashboard content with the operational intelligence layout from the provided reference, while reusing the existing warehouse-scoped data sources and navigation model.

**Architecture:** Keep the dashboard as a single route with section-based composition, but replace the current section set with the reference-driven command-center sections. Reuse the existing warehouse store, dashboard service, and report sources, then reshape the UI into alert, workflow, KPI, performance, monitoring, live feed, and exception feed panels.

**Tech Stack:** Vue 3, TypeScript, Pinia, existing dashboard composables/services, existing shared UI components, existing charting stack where already present.

## Global Constraints

- Preserve the existing Vue 3 + Vite SPA architecture.
- Reuse the existing warehouse selector store as the source of truth for dashboard scoping.
- Keep the dashboard in the existing route family under `/dashboard/*`.
- Follow the repository's existing component and composable patterns; do not introduce a new state library.
- Use existing design tokens and shared UI primitives; do not introduce a new visual system.

---

### Task 1: Redesign the dashboard shell and section routing

**Files:**

- Modify: `src/views/dashboard/DashboardPage.vue`
- Modify: `src/views/dashboard/composables/useDashboard.ts`
- Modify: `src/views/dashboard/components/DashboardToolbar.vue`

**Interfaces:**

- Consumes: `selectedWarehouseId`, `setSelectedWarehouse`, `refreshDashboard`
- Produces: a dashboard page that renders the new reference sections in a stable order

- [ ] **Step 1: Write the failing test**

Create a Vitest component test for the dashboard page that asserts the new section headings are rendered:

```ts
import { render, screen } from "@testing-library/vue";
import DashboardPage from "./DashboardPage.vue";

it("renders the operational intelligence section headings", async () => {
    render(DashboardPage);

    expect(await screen.findByText("Operations Alert Center")).toBeTruthy();
    expect(screen.getByText("Business Workflow Overview")).toBeTruthy();
    expect(screen.getByText("Executive KPI Snapshot")).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run src/views/dashboard/DashboardPage.test.ts -v`

Expected: fail because the current dashboard does not render these headings.

- [ ] **Step 3: Write minimal implementation**

Update `useDashboard.ts` to expose the data slices needed by the new sections, then replace the `v-if` section tree in `DashboardPage.vue` with the new reference-driven layout. Keep `DashboardToolbar.vue` as the filter/control strip, but simplify it so the warehouse scope and refresh actions stay visible while the page content changes.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm exec vitest run src/views/dashboard/DashboardPage.test.ts -v`

Expected: pass and show the three section headings.

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/DashboardPage.vue src/views/dashboard/composables/useDashboard.ts src/views/dashboard/components/DashboardToolbar.vue src/views/dashboard/DashboardPage.test.ts
git commit -m "feat: redesign dashboard as operational intelligence"
```

### Task 2: Build the alert center and workflow overview panels

**Files:**

- Create: `src/views/dashboard/components/OperationsAlertCenter.vue`
- Create: `src/views/dashboard/components/BusinessWorkflowOverview.vue`
- Modify: `src/views/dashboard/DashboardPage.vue`
- Modify: `src/views/dashboard/composables/useDashboard.ts`

**Interfaces:**

- Consumes: `dashboardError`, `lowStockItems`, `recentActivity`, `summaryCards`, `selectedWarehouse`
- Produces: alert feed, workflow stage cards, and bottleneck indicators derived from existing dashboard data

- [ ] **Step 1: Write the failing test**

Create tests that assert the new panels render a high-priority alert item, a workflow stage chip, and a bottleneck note from mocked dashboard data.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run src/views/dashboard/components/OperationsAlertCenter.test.ts src/views/dashboard/components/BusinessWorkflowOverview.test.ts -v`

Expected: fail because the components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement the two new components using the existing `lowStockItems`, `recentActivity`, and summary data sources. Map:

```ts
Operations Alert Center -> low-stock alerts + recent activity exceptions
Business Workflow Overview -> summary cards + status workflow stages derived from existing counts
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm exec vitest run src/views/dashboard/components/OperationsAlertCenter.test.ts src/views/dashboard/components/BusinessWorkflowOverview.test.ts -v`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/OperationsAlertCenter.vue src/views/dashboard/components/BusinessWorkflowOverview.vue src/views/dashboard/DashboardPage.vue src/views/dashboard/composables/useDashboard.ts
git commit -m "feat: add dashboard alert and workflow panels"
```

### Task 3: Rebuild KPI snapshot and process performance sections

**Files:**

- Create: `src/views/dashboard/components/ExecutiveKpiSnapshot.vue`
- Create: `src/views/dashboard/components/ProcessPerformance.vue`
- Modify: `src/views/dashboard/composables/useDashboard.ts`

**Interfaces:**

- Consumes: `summaryCards`, `chartBars`, `heatmapRows`, `warehouseOptions`, `epcStatusBreakdown`
- Produces: KPI tiles, domain tabs, activity picker, and supporting metrics panels

- [ ] **Step 1: Write the failing test**

Add a component test that confirms:

```ts
expect(screen.getByText("Executive KPI Snapshot")).toBeTruthy();
expect(screen.getByText("Stock In")).toBeTruthy();
expect(screen.getByText("Inventory")).toBeTruthy();
expect(screen.getByText("Stock Out")).toBeTruthy();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run src/views/dashboard/components/ExecutiveKpiSnapshot.test.ts src/views/dashboard/components/ProcessPerformance.test.ts -v`

Expected: fail before the components are implemented.

- [ ] **Step 3: Write minimal implementation**

Derive the three KPI domain cards from the current summary and activity data:

- `Stock In` from inbound counts and receiving/putaway metrics
- `Inventory` from stock balance, opname, relocation, and transfer data
- `Stock Out` from outbound and shipping-related metrics

Render the process performance section with the activity picker and supporting charts using the existing charting approach already used in the dashboard.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm exec vitest run src/views/dashboard/components/ExecutiveKpiSnapshot.test.ts src/views/dashboard/components/ProcessPerformance.test.ts -v`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/ExecutiveKpiSnapshot.vue src/views/dashboard/components/ProcessPerformance.vue src/views/dashboard/composables/useDashboard.ts
git commit -m "feat: add dashboard kpi and performance sections"
```

### Task 4: Add monitoring, live feed, and exception feed panels

**Files:**

- Create: `src/views/dashboard/components/MonitoringPanel.vue`
- Create: `src/views/dashboard/components/RealTimeEventFeed.vue`
- Create: `src/views/dashboard/components/ExceptionFeed.vue`
- Modify: `src/views/dashboard/composables/useDashboard.ts`

**Interfaces:**

- Consumes: `recentActivity`, `warehouseOptions`, `dashboardError`, `selectedWarehouse`
- Produces: monitoring status cards, transaction feed table, and exception cards

- [ ] **Step 1: Write the failing test**

Create tests asserting the monitoring heading, live transaction feed table header, and exception feed card are rendered from mocked data.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run src/views/dashboard/components/MonitoringPanel.test.ts src/views/dashboard/components/RealTimeEventFeed.test.ts src/views/dashboard/components/ExceptionFeed.test.ts -v`

Expected: fail because the components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Use the existing dashboard data sources to render:

- Monitoring as warehouse status cards and command-center summary
- Real-time feed as a table using current recent activity data
- Exception feed as a compact list of unresolved or warning items

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm exec vitest run src/views/dashboard/components/MonitoringPanel.test.ts src/views/dashboard/components/RealTimeEventFeed.test.ts src/views/dashboard/components/ExceptionFeed.test.ts -v`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/dashboard/components/MonitoringPanel.vue src/views/dashboard/components/RealTimeEventFeed.vue src/views/dashboard/components/ExceptionFeed.vue src/views/dashboard/composables/useDashboard.ts
git commit -m "feat: add dashboard monitoring and feed panels"
```

### Task 5: Polish data mapping, loading states, and verification

**Files:**

- Modify: `src/views/dashboard/composables/useDashboard.ts`
- Modify: `src/views/dashboard/DashboardPage.vue`
- Modify: `src/views/dashboard/components/DashboardToolbar.vue`
- Modify: any dashboard tests added above

**Interfaces:**

- Consumes: all dashboard data slices and section components
- Produces: final dashboard layout with consistent loading, empty, and error states

- [ ] **Step 1: Write the failing test**

Add an end-to-end focused dashboard render test that verifies:

- the page still respects the selected warehouse
- loading states render a skeleton or placeholder
- error states show the error message block

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec vitest run src/views/dashboard/**/*.test.ts -v`

Expected: fail on the current incomplete integration.

- [ ] **Step 3: Write minimal implementation**

Normalize data contracts in `useDashboard.ts`, keep the warehouse selection source of truth in the global store, and ensure all new panels render cleanly with the existing design tokens.

- [ ] **Step 4: Run the full targeted dashboard test set**

Run: `npm exec vitest run src/views/dashboard/**/*.test.ts -v`

Expected: pass.

- [ ] **Step 5: Verify TypeScript**

Run: `./node_modules/.bin/tsc -p tsconfig.json --noEmit`

Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard
git commit -m "feat: complete dashboard operational intelligence redesign"
```
