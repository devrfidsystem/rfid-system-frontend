# Transaction Summary Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side-derived summary widget (Total count, Status Breakdown, Date Range of currently-loaded rows) to the 7 generic Transaction list pages, backed entirely by data `useTransactionList` already loads — no new backend call.

**Architecture:** A new pure-derivation composable (`useTransactionSummary.ts`) takes the raw `rows` ref and `pagination` object already owned by `useTransactionList.ts` and computes `totalCount`/`statusBreakdown`/`dateRange`. A new presentational component (`TransactionSummaryWidget.vue`) renders those three values as a `Card` grid, following the existing `ProcessMetricCards.vue` stat-card convention (loading skeleton, empty state). `TransactionListPage.vue` wires the two together, gated on `!error`.

**Tech Stack:** Vue 3 (`<script setup>`, Composition API), TypeScript, Vitest (SSR render tests via `vue/server-renderer`), Tailwind CSS design tokens already in use in this codebase.

## Global Constraints

- No new backend endpoint or API call — every value is derived from `rows`/`pagination` that `useTransactionList.ts` already fetches.
- Status is grouped generically by its raw value — no per-`transactionKey` status label mapping.
- Rows missing a `status` are excluded from `statusBreakdown`, not bucketed as "unknown".
- `dateRange` reflects only the currently-loaded page of rows, not the full filtered result set — this must be visible in the widget's label so it isn't mistaken for a global range.
- Widget renders `object-id="wdg_TransactionSummary"` on its root element, per this codebase's existing `object-id` convention.
- Widget is not rendered when `useTransactionList`'s `error` is set.
- Out of scope: `TransactionDetailPage.vue`, all Opname pages — untouched by this plan.
- All new/modified test files run via `npx vitest run <path>`; there is no `npm test` script in this repo.

---

### Task 1: Expose raw `rows` from `useTransactionList`

**Files:**

- Modify: `src/views/transactions/composables/useTransactionList.ts:424-454` (the `return` statement)
- Test: `src/views/transactions/composables/useTransactionList.test.ts` (append to existing `describe("useTransactionList", ...)` block)

**Interfaces:**

- Produces: `useTransactionList(...)` return object gains `rows: Ref<TransactionRecord[]>` (the composable's existing internal `rows` ref, declared at line 100 — `const rows = ref<TransactionRecord[]>([]);` — is not currently returned).

- [ ] **Step 1: Write the failing test**

Add this test at the end of the `describe("useTransactionList", ...)` block in `src/views/transactions/composables/useTransactionList.test.ts`, just before its closing `});`:

```ts
    it("exposes the raw loaded rows for downstream summary derivation", async () => {
        vi.resetModules();
        vi.unmock("@/views/report/reportConfig");

        const { transactionService } = await import(
            "@/services/transactions.service"
        );
        vi.mocked(transactionService.list).mockResolvedValueOnce({
            items: [
                { id: "1", status: "posted" },
                { id: "2", status: "draft" },
            ],
            meta: { page: 1, limit: 20, total: 2 },
        });

        const { useTransactionList } = await import("./useTransactionList");
        const list = useTransactionList({ transactionKey: "relocation" });

        const flushPromises = () =>
            new Promise((resolve) => setTimeout(resolve, 0));
        await flushPromises();

        expect(list.rows.value.map((row) => row.status)).toEqual([
            "posted",
            "draft",
        ]);
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: FAIL — `list.rows` is `undefined`, so `.value` throws a `TypeError`.

- [ ] **Step 3: Write minimal implementation**

In `src/views/transactions/composables/useTransactionList.ts`, find the `return` statement (currently starting `return { pageTitle, pageTagline, ...`). Add `rows,` immediately before `displayRows,`:

```ts
    return {
        pageTitle,
        pageTagline,
        sectionHeading,
        canCreate,
        canExport,
        pageDescription,
        keyword,
        startDate,
        endDate,
        selectedWarehouse,
        selectedPartner,
        showWarehouseFilter,
        partnerFilterSupported,
        warehouseSelectOptions,
        partnerSelectOptions,
        partnerLabel,
        partnerError,
        error,
        loading,
        pagination,
        pageSizeOptions,
        rows,
        displayRows,
        columns,
        emptyStateVariant,
        sortOrder,
        toggleSort,
        exportRows,
        refresh,
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: PASS (8 tests total — 7 pre-existing + 1 new).

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionList.ts src/views/transactions/composables/useTransactionList.test.ts
git commit -m "feat: expose raw rows from useTransactionList for summary derivation"
```

---

### Task 2: Create `useTransactionSummary` composable

**Files:**

- Create: `src/views/transactions/composables/useTransactionSummary.ts`
- Test: `src/views/transactions/composables/useTransactionSummary.test.ts`

**Interfaces:**

- Consumes: `TransactionRecord` from `src/views/transactions/types.ts` (`{ id?, docNo?, status?, companyId?, warehouseId?, [key: string]: string|number|boolean|null|undefined }`).
- Produces: `useTransactionSummary(rows: Ref<TransactionRecord[]>, pagination: { total: number })` returning `{ totalCount: ComputedRef<number>; statusBreakdown: ComputedRef<StatusCount[]>; dateRange: ComputedRef<DateRangeSummary> }`, plus the exported types `StatusCount = { label: string; count: number }` and `DateRangeSummary = { earliest: string | null; latest: string | null }`. Task 3 imports `StatusCount`/`DateRangeSummary` from this file.

- [ ] **Step 1: Write the failing test**

Create `src/views/transactions/composables/useTransactionSummary.test.ts`:

```ts
import { reactive, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useTransactionSummary } from "./useTransactionSummary";
import type { TransactionRecord } from "../types";

describe("useTransactionSummary", () => {
    it("passes through the paginated total as totalCount", () => {
        const rows = ref<TransactionRecord[]>([]);
        const pagination = reactive({ total: 42 });

        const { totalCount } = useTransactionSummary(rows, pagination);

        expect(totalCount.value).toBe(42);
    });

    it("groups currently-loaded rows by status, excluding rows without a status", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", status: "posted" },
            { id: "2", status: "posted" },
            { id: "3", status: "draft" },
            { id: "4" },
        ]);
        const pagination = reactive({ total: 4 });

        const { statusBreakdown } = useTransactionSummary(rows, pagination);

        expect(statusBreakdown.value).toEqual([
            { label: "posted", count: 2 },
            { label: "draft", count: 1 },
        ]);
    });

    it("derives the earliest and latest date among currently-loaded rows", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", date: "2026-07-10T00:00:00.000Z" },
            { id: "2", date: "2026-07-20T00:00:00.000Z" },
            { id: "3", date: "2026-07-05T00:00:00.000Z" },
        ]);
        const pagination = reactive({ total: 3 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value.earliest).toBe("2026-07-05T00:00:00.000Z");
        expect(dateRange.value.latest).toBe("2026-07-20T00:00:00.000Z");
    });

    it("falls back to createdAt when date is missing, and ignores unparseable values", () => {
        const rows = ref<TransactionRecord[]>([
            { id: "1", createdAt: "2026-07-15T00:00:00.000Z" },
            { id: "2", date: "not-a-date" },
        ]);
        const pagination = reactive({ total: 2 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value.earliest).toBe("2026-07-15T00:00:00.000Z");
        expect(dateRange.value.latest).toBe("2026-07-15T00:00:00.000Z");
    });

    it("returns a null date range when no row has a parseable date", () => {
        const rows = ref<TransactionRecord[]>([{ id: "1" }]);
        const pagination = reactive({ total: 1 });

        const { dateRange } = useTransactionSummary(rows, pagination);

        expect(dateRange.value).toEqual({ earliest: null, latest: null });
    });

    it("recomputes when rows change", () => {
        const rows = ref<TransactionRecord[]>([{ id: "1", status: "draft" }]);
        const pagination = reactive({ total: 1 });

        const { statusBreakdown } = useTransactionSummary(rows, pagination);
        expect(statusBreakdown.value).toEqual([{ label: "draft", count: 1 }]);

        rows.value = [
            { id: "1", status: "draft" },
            { id: "2", status: "posted" },
        ];

        expect(statusBreakdown.value).toEqual([
            { label: "draft", count: 1 },
            { label: "posted", count: 1 },
        ]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/composables/useTransactionSummary.test.ts`
Expected: FAIL — cannot find module `./useTransactionSummary`.

- [ ] **Step 3: Write minimal implementation**

Create `src/views/transactions/composables/useTransactionSummary.ts`:

```ts
import { computed, type Ref } from "vue";
import type { TransactionRecord } from "../types";

export interface StatusCount {
    label: string;
    count: number;
}

export interface DateRangeSummary {
    earliest: string | null;
    latest: string | null;
}

export function useTransactionSummary(
    rows: Ref<TransactionRecord[]>,
    pagination: { total: number },
) {
    const totalCount = computed(() => pagination.total);

    const statusBreakdown = computed<StatusCount[]>(() => {
        const counts = new Map<string, number>();
        for (const row of rows.value) {
            if (row.status === undefined || row.status === null) continue;
            const label = String(row.status);
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
            label,
            count,
        }));
    });

    const dateRange = computed<DateRangeSummary>(() => {
        let earliestTime: number | null = null;
        let latestTime: number | null = null;
        let earliestValue: string | null = null;
        let latestValue: string | null = null;

        for (const row of rows.value) {
            const raw = row.date ?? row.createdAt;
            if (raw === undefined || raw === null) continue;
            const time = new Date(raw as string | number).getTime();
            if (isNaN(time)) continue;

            if (earliestTime === null || time < earliestTime) {
                earliestTime = time;
                earliestValue = String(raw);
            }
            if (latestTime === null || time > latestTime) {
                latestTime = time;
                latestValue = String(raw);
            }
        }

        return { earliest: earliestValue, latest: latestValue };
    });

    return { totalCount, statusBreakdown, dateRange };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/composables/useTransactionSummary.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionSummary.ts src/views/transactions/composables/useTransactionSummary.test.ts
git commit -m "feat: add useTransactionSummary composable"
```

---

### Task 3: Create `TransactionSummaryWidget` component

**Files:**

- Create: `src/views/transactions/components/TransactionSummaryWidget.vue`
- Test: `src/views/transactions/components/TransactionSummaryWidget.test.ts`

**Interfaces:**

- Consumes: `StatusCount`/`DateRangeSummary` types from `../composables/useTransactionSummary` (Task 2); `Card` from `@/components/molecules/Card.vue`; `Badge` from `@/components/atoms/Badge.vue`; `formatDate` from `@/utils/date.ts` (signature: `(value: string | Date | null | undefined) => string`, returns `"-"` for null/invalid).
- Produces: `TransactionSummaryWidget` component with props `{ loading: boolean; totalCount: number; statusBreakdown: StatusCount[]; dateRange: DateRangeSummary }`. Task 4 renders this component.

- [ ] **Step 1: Write the failing test**

Create `src/views/transactions/components/TransactionSummaryWidget.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionSummaryWidget from "./TransactionSummaryWidget.vue";
import { formatDate } from "@/utils/date";

describe("TransactionSummaryWidget", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: true,
            totalCount: 0,
            statusBreakdown: [],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty-state message when there are no matching transactions", async () => {
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 0,
            statusBreakdown: [],
            dateRange: { earliest: null, latest: null },
        });
        const html = await renderToString(app);
        expect(html).toContain("No transactions match the current filters.");
    });

    it("renders total, status breakdown, and date range when populated", async () => {
        const earliest = "2026-07-05T12:00:00.000Z";
        const latest = "2026-07-20T12:00:00.000Z";
        const app = createSSRApp(TransactionSummaryWidget, {
            loading: false,
            totalCount: 57,
            statusBreakdown: [
                { label: "posted", count: 40 },
                { label: "draft", count: 17 },
            ],
            dateRange: { earliest, latest },
        });
        const html = await renderToString(app);

        expect(html).toContain("57");
        expect(html).toContain("posted (40)");
        expect(html).toContain("draft (17)");
        expect(html).toContain(formatDate(earliest));
        expect(html).toContain(formatDate(latest));
        expect(html).toContain("wdg_TransactionSummary");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: FAIL — cannot find module `./TransactionSummaryWidget.vue`.

- [ ] **Step 3: Write minimal implementation**

Create `src/views/transactions/components/TransactionSummaryWidget.vue`:

```vue
<template>
    <div class="grid gap-4 sm:grid-cols-3" object-id="wdg_TransactionSummary">
        <template v-if="loading">
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="totalCount === 0" class="sm:col-span-3">
            <p class="text-sm text-text-secondary">
                No transactions match the current filters.
            </p>
        </Card>

        <template v-else>
            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Total
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ totalCount.toLocaleString() }}
                </p>
            </Card>

            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Status Breakdown
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                    <Badge v-for="item in statusBreakdown" :key="item.label">
                        {{ item.label }} ({{ item.count }})
                    </Badge>
                </div>
            </Card>

            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Date Range (this page)
                </p>
                <p class="text-sm font-medium text-gray-900 mt-1">
                    {{ formatDate(dateRange.earliest) }} –
                    {{ formatDate(dateRange.latest) }}
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import { formatDate } from "@/utils/date";
import type {
    StatusCount,
    DateRangeSummary,
} from "../composables/useTransactionSummary";

defineProps<{
    loading: boolean;
    totalCount: number;
    statusBreakdown: StatusCount[];
    dateRange: DateRangeSummary;
}>();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/components/TransactionSummaryWidget.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/components/TransactionSummaryWidget.vue src/views/transactions/components/TransactionSummaryWidget.test.ts
git commit -m "feat: add TransactionSummaryWidget component"
```

---

### Task 4: Wire the widget into `TransactionListPage.vue`

**Files:**

- Modify: `src/views/transactions/TransactionListPage.vue`

**Interfaces:**

- Consumes: `rows` and `pagination` from `useTransactionList` (Task 1); `useTransactionSummary(rows, pagination)` (Task 2); `TransactionSummaryWidget` (Task 3).
- Produces: no new exports — this is the final integration point.

There is no existing colocated test for `TransactionListPage.vue` (only its composables and sub-components are tested — confirmed by `find src/views/transactions -name "*.test.ts"` returning no `TransactionListPage.test.ts`), so this task is verified by the manual smoke check in Step 3 rather than an automated render test, consistent with the current test coverage for this file.

- [ ] **Step 1: Confirm current behavior before changing**

Run: `npx vitest run src/views/transactions`
Expected: PASS — all existing transaction-view tests (composables + components from Tasks 1-3) pass before this integration change.

- [ ] **Step 2: Wire the composable and component into the page**

Replace the full contents of `src/views/transactions/TransactionListPage.vue` with:

```vue
<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            :tagline="pageTagline"
        />

        <TransactionSummaryWidget
            v-if="!error"
            :loading="loading"
            :total-count="totalCount"
            :status-breakdown="statusBreakdown"
            :date-range="dateRange"
        />

        <Card no-padding object-id="wdg_TransactionList">
            <TransactionHeader
                :heading="sectionHeading"
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:selected-warehouse="selectedWarehouse"
                v-model:selected-partner="selectedPartner"
                :show-warehouse-filter="showWarehouseFilter"
                :partner-filter-supported="partnerFilterSupported"
                :warehouse-select-options="warehouseSelectOptions"
                :partner-select-options="partnerSelectOptions"
                :partner-label="partnerLabel"
                :has-rows="displayRows.length > 0"
                :can-export="canExport"
                :can-create="canCreate"
                @refresh="refresh"
                @export="exportRows"
                @new="handleNew"
            />

            <div class="px-6">
                <p v-if="partnerError" class="text-xs text-rose-600 mb-4">
                    {{ partnerError }}
                </p>
                <p
                    v-if="error && !loading"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ error }}
                </p>
            </div>

            <TransactionTable
                v-model:page="pagination.page"
                v-model:limit="pagination.limit"
                :loading="loading"
                :rows="displayRows"
                :columns="columns"
                :empty-state-variant="emptyStateVariant"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @view="handleView"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import TransactionHeader from "./components/TransactionHeader.vue";
import TransactionTable from "./components/TransactionTable.vue";
import TransactionSummaryWidget from "./components/TransactionSummaryWidget.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionList } from "./composables/useTransactionList";
import { useTransactionSummary } from "./composables/useTransactionSummary";
import { useRouter } from "vue-router";

const props = defineProps<{ transactionKey: TransactionKey }>();
const router = useRouter();

const handleNew = () => {
    router.push(`/transactions/${props.transactionKey}/new`);
};

const handleView = (id: string) => {
    router.push(`/transactions/${props.transactionKey}/${id}`);
};

const {
    pageTitle,
    pageTagline,
    sectionHeading,
    canCreate,
    canExport,
    pageDescription,
    keyword,
    startDate,
    endDate,
    selectedWarehouse,
    selectedPartner,
    showWarehouseFilter,
    partnerFilterSupported,
    warehouseSelectOptions,
    partnerSelectOptions,
    partnerLabel,
    partnerError,
    error,
    loading,
    pagination,
    pageSizeOptions,
    rows,
    displayRows,
    columns,
    emptyStateVariant,
    exportRows,
    refresh,
} = useTransactionList(props);

const { totalCount, statusBreakdown, dateRange } = useTransactionSummary(
    rows,
    pagination,
);
</script>
```

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, then in a browser visit `/transactions/inbound` (or any of `putaway`/`outbound`/`relocation`/`transfer`/`returns`/`register`).
Expected: the three-card summary widget renders above the existing filter/table card, showing a loading skeleton briefly, then Total/Status Breakdown/Date Range once data loads. Confirm the widget disappears (only the existing red error banner shows) if you simulate an error (e.g. temporarily stop the backend).

- [ ] **Step 4: Run the full transaction-view test suite**

Run: `npx vitest run src/views/transactions`
Expected: PASS — all tests across Tasks 1-3 plus pre-existing tests continue to pass (no test file exists for `TransactionListPage.vue` itself, per the note above).

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc --noEmit`
Expected: no new type errors introduced by this change.

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/TransactionListPage.vue
git commit -m "feat: render TransactionSummaryWidget on transaction list pages"
```
