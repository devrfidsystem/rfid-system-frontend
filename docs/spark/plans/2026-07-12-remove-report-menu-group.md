# Remove Report Menu Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the Report menu group (routes, rail/sidebar nav, page components) while keeping its underlying export mechanism intact for Transaction (already using it) and add it to Stock Balance / Stock Ledger.

**Architecture:** `reportConfig.ts` + `report.service.ts` + `report.api.ts` stay as the shared export mechanism. Everything UI-specific to the "Report" pages (routes, rail icon, sidebar scope, page components) is deleted. Stock Balance and Stock Ledger each gain an `exportRows` function copied from `useTransactionList.ts`'s existing pattern, calling the same `reportService.exportReport`.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Vue Router, `vue-tsc` for type-checking, `eslint --fix` for lint/format.

## Global Constraints

- Do not rename or move `src/views/report/reportConfig.ts`, `src/services/report.service.ts`, `src/api/feature/report.api.ts`, `src/api/feature/dto/report.dto.ts` — `useTransactionList.ts`, `useTransactionDetail.ts`, and `TransactionTable.vue` all import from these exact paths.
- The `opname-variance` report entity is deleted entirely — not migrated anywhere (confirmed user decision, no Transaction/Stock equivalent exists).
- `scopeRules.reports`'s `LOG` rule (in `src/components/organisms/sidebarNavigation.ts`) is NOT deleted — it must move to `scopeRules.settings`, or the Log/Tracking page (`/log/tracking`) becomes unreachable from any menu (confirmed user decision).
- This repository has no component-mounting test infrastructure. Verification for every task is `npm run type-check` + `npx eslint --fix <files>` + a manual browser check via the `run` skill — not a new unit-test framework.
- The backend-managed "Reports" menu tree entry (Settings > Menus, code `REPORT*`) is **not** touched by this plan — it must be deactivated/deleted separately via that admin UI or the backend, after this ships. Do not attempt to modify it as part of any task here.

---

### Task 1: Remove `opname-variance` from `reportConfig.ts` and `report.dto.ts`

**Files:**

- Modify: `src/views/report/reportConfig.ts`
- Modify: `src/api/feature/dto/report.dto.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `ReportKey` type narrowed to 8 values (no `"opname-variance"`); `reportConfigs` and `reportPaths` (in `report.dto.ts`) both narrowed to the same 8 keys — `reportPaths` is typed `Record<ReportKey, string>`, so it must drop its `"opname-variance"` entry in the same task or `npm run type-check` fails with an excess-property error. Task 2 relies on this narrowed `ReportKey` when deleting the routes that iterate `Object.keys(reportConfigs)`.

- [ ] **Step 1: Remove the `"opname-variance"` member from the `ReportKey` union**

In `src/views/report/reportConfig.ts`, replace:

```ts
export type ReportKey =
    | "inbound"
    | "outbound"
    | "stock-opname"
    | "relocation"
    | "transfer"
    | "return"
    | "current-stock"
    | "stock-period"
    | "opname-variance";
```

With:

```ts
export type ReportKey =
    | "inbound"
    | "outbound"
    | "stock-opname"
    | "relocation"
    | "transfer"
    | "return"
    | "current-stock"
    | "stock-period";
```

- [ ] **Step 2: Remove the `"opname-variance"` entry from `reportConfigs`**

Delete this entire block (it's the last entry before the closing `};` of `reportConfigs`):

```ts
    "opname-variance": {
        entity: "opname-variance" as EntityKey,
        title: "Opname Variance",
        description: "Stock variance discrepancies from opname execution.",
        columns: [
            { key: "title", label: "Title" },
            { key: "company.name", label: "Company" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created At" },
        ],
        warehouseKey: "warehouseId",
        icon: ClipboardCheck,
    },
```

Leave the `ClipboardCheck` import untouched — the `stock-opname` entry (earlier in the same object) still uses it.

- [ ] **Step 3: Remove the `"opname-variance"` entry from `reportPaths` in `report.dto.ts`**

In `src/api/feature/dto/report.dto.ts`, replace:

```ts
export const reportPaths: Record<ReportKey, string> = {
    inbound: "/reports/inbound",
    outbound: "/reports/outbound",
    "stock-opname": "/opname",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    "current-stock": "/reports/stock-balance",
    "stock-period": "/reports/stock-movement",
    "opname-variance": "/reports/opname-variance",
};
```

With:

```ts
export const reportPaths: Record<ReportKey, string> = {
    inbound: "/reports/inbound",
    outbound: "/reports/outbound",
    "stock-opname": "/opname",
    relocation: "/relocation",
    transfer: "/transfer",
    return: "/returns",
    "current-stock": "/reports/stock-balance",
    "stock-period": "/reports/stock-movement",
};
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npx eslint --fix src/views/report/reportConfig.ts src/api/feature/dto/report.dto.ts`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/views/report/reportConfig.ts src/api/feature/dto/report.dto.ts
git commit -m "feat(report): remove unused opname-variance report entity"
```

---

### Task 2: Remove Report routes and delete Report's page components

**Files:**

- Modify: `src/router/index.ts`
- Delete: `src/views/report/ReportEntityPage.vue`
- Delete: `src/views/report/components/ReportHeader.vue`
- Delete: `src/views/report/components/ReportTable.vue`
- Delete: `src/views/report/composables/useReportEntity.ts`
- Delete: `src/components/templates/ReportLayout.vue`
- Delete: `src/components/templates/ReportLayout.stories.ts`

**Interfaces:**

- Consumes: the narrowed `ReportKey`/`reportConfigs` from Task 1 (not directly touched here — this task removes the code that consumed them for routing).
- Produces: no more `/reports/*` routes and no more `/report` redirect. `src/views/report/` now contains only `reportConfig.ts`. Task 3 does not depend on anything new from this task (it edits different files), but must be done after this task so the Rail's "Reports" link doesn't point at a route that no longer resolves to a page (both tasks together fully remove the feature).

- [ ] **Step 1: Remove report-routing code from `src/router/index.ts`**

Replace:

```ts
import { reportConfigs, type ReportKey } from "@/views/report/reportConfig";
import type { EntityKey } from "@/model/entities";
import { reportPaths } from "@/api/feature/dto/report.dto";
import type { TransactionKey } from "@/services/transactions.service";
```

With:

```ts
import type { EntityKey } from "@/model/entities";
import type { TransactionKey } from "@/services/transactions.service";
```

Then delete this entire block:

```ts
const resolveReportSegment = (key: ReportKey) => {
    const raw = reportPaths[key] ?? key;
    const trimmed = raw.replace(/^\/+/, "");
    if (trimmed.startsWith("reports/")) {
        return trimmed.replace(/^reports\//, "");
    }
    return trimmed || key;
};

const reportChildRoutes: RouteRecordRaw[] = (
    Object.keys(reportConfigs) as ReportKey[]
).map((key) => ({
    path: resolveReportSegment(key),
    component: () => import("@/views/report/ReportEntityPage.vue"),
    meta: {
        report: key,
        tagline: "Reports",
    },
}));
```

(Leave the surrounding `authRoutes` declaration that follows untouched.)

Then delete the `/reports` parent route:

```ts
            {
                path: "reports",
                component: () =>
                    import("@/components/templates/ReportLayout.vue"),
                children: [
                    {
                        path: "",
                        redirect:
                            reportChildRoutes[0]?.path ?? "stock-movement",
                    },
                    ...reportChildRoutes,
                ],
            },
```

(This sits between the transaction-detail route and the `settings` route — leave both of those untouched.)

Then delete the legacy redirect:

```ts
            {
                path: "report",
                redirect: "/reports",
            },
```

(This sits between the `profile` route and the `log/tracking` route — leave both of those untouched.)

- [ ] **Step 2: Delete the orphaned Report page component files**

```bash
rm src/views/report/ReportEntityPage.vue
rm src/views/report/components/ReportHeader.vue
rm src/views/report/components/ReportTable.vue
rm src/views/report/composables/useReportEntity.ts
rm src/components/templates/ReportLayout.vue
rm src/components/templates/ReportLayout.stories.ts
```

- [ ] **Step 3: Confirm no dangling references remain**

Run: `grep -rn "views/report/ReportEntityPage\|components/templates/ReportLayout\|reportChildRoutes\|resolveReportSegment" src/`
Expected: no output.

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npx eslint --fix src/router/index.ts`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add -A src/router/index.ts src/views/report src/components/templates/ReportLayout.vue src/components/templates/ReportLayout.stories.ts
git commit -m "feat(report): remove /reports routes and delete Report page components"
```

---

### Task 3: Remove "Reports" from Rail and sidebar; move Log/Tracking to Settings scope

**Files:**

- Modify: `src/components/templates/AppLayout.vue`
- Modify: `src/components/organisms/sidebarNavigation.ts`

**Interfaces:**

- Consumes: nothing from Tasks 1-2 (independent files).
- Produces: no `SidebarScope` value `"reports"` remains anywhere; `scopeRules.settings` gains the `LOG` rule Task-3-onward code relies on for Log/Tracking's sidebar visibility (no later task consumes this, but it's the deliverable this task's browser check verifies).

- [ ] **Step 1: Remove the "Reports" rail item from `AppLayout.vue`**

In `src/components/templates/AppLayout.vue`, replace:

```ts
import {
    Database,
    FileText,
    LayoutDashboard,
    Radio,
    Settings2,
    Shield,
    LineChart,
    Layers,
} from "lucide-vue-next";
```

With:

```ts
import {
    Database,
    FileText,
    LayoutDashboard,
    Radio,
    Settings2,
    Shield,
    Layers,
} from "lucide-vue-next";
```

Then replace:

```ts
const railItems: RailItem[] = [
    {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "/dashboard/overview",
    },
    {
        id: "master-data",
        icon: Database,
        label: "Master Data",
        to: "/master-data/warehouses",
    },
    { id: "iam", icon: Shield, label: "IAM", to: "/iam/roles" },
    { id: "rfid", icon: Radio, label: "RFID", to: "/rfid/tags" },
    { id: "stock", icon: Layers, label: "Stock", to: "/stock/balance" },
    {
        id: "transactions",
        icon: FileText,
        label: "Transactions",
        to: "/transactions/inbound",
    },
    {
        id: "reports",
        icon: LineChart,
        label: "Reports",
        to: "/reports/stock-movement",
    },
    {
        id: "settings",
        icon: Settings2,
        label: "Settings",
        to: "/settings/companies",
    },
];
```

With:

```ts
const railItems: RailItem[] = [
    {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "/dashboard/overview",
    },
    {
        id: "master-data",
        icon: Database,
        label: "Master Data",
        to: "/master-data/warehouses",
    },
    { id: "iam", icon: Shield, label: "IAM", to: "/iam/roles" },
    { id: "rfid", icon: Radio, label: "RFID", to: "/rfid/tags" },
    { id: "stock", icon: Layers, label: "Stock", to: "/stock/balance" },
    {
        id: "transactions",
        icon: FileText,
        label: "Transactions",
        to: "/transactions/inbound",
    },
    {
        id: "settings",
        icon: Settings2,
        label: "Settings",
        to: "/settings/companies",
    },
];
```

Then replace:

```ts
const railScopeMap: Record<Exclude<SidebarScope, "all">, SidebarScope> = {
    dashboard: "dashboard",
    "master-data": "master-data",
    iam: "iam",
    rfid: "rfid",
    stock: "stock",
    transactions: "transactions",
    reports: "reports",
    settings: "settings",
};
```

With:

```ts
const railScopeMap: Record<Exclude<SidebarScope, "all">, SidebarScope> = {
    dashboard: "dashboard",
    "master-data": "master-data",
    iam: "iam",
    rfid: "rfid",
    stock: "stock",
    transactions: "transactions",
    settings: "settings",
};
```

- [ ] **Step 2: Remove `"reports"` from `SidebarScope`, delete `scopeRules.reports`, move its `LOG` rule to `scopeRules.settings`, and remove the now-unused icon-map entries in `sidebarNavigation.ts`**

Replace:

```ts
export type SidebarScope =
    | "all"
    | "dashboard"
    | "master-data"
    | "iam"
    | "rfid"
    | "stock"
    | "transactions"
    | "reports"
    | "settings";
```

With:

```ts
export type SidebarScope =
    | "all"
    | "dashboard"
    | "master-data"
    | "iam"
    | "rfid"
    | "stock"
    | "transactions"
    | "settings";
```

Replace:

```ts
    RFID: Radio,
    RFID_TAGS: Radio,
    RFID_ASSIGNMENTS: FileText,
    RFID_EVENTS: ScrollText,
    REPORT: LineChart,
    REPORTS: LineChart,
    LOG: ScrollText,
    SETTINGS: Settings2,
```

With:

```ts
    RFID: Radio,
    RFID_TAGS: Radio,
    RFID_ASSIGNMENTS: FileText,
    RFID_EVENTS: ScrollText,
    LOG: ScrollText,
    SETTINGS: Settings2,
```

(`LOG: ScrollText` stays — only the `REPORT`/`REPORTS` → `LineChart` lines are removed.)

Then remove the now-unused `LineChart` import:

```ts
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Box,
    Database,
    FileText,
    LayoutDashboard,
    Layers,
    LineChart,
    Map,
    MapPin,
    Radio,
    Ruler,
    ScrollText,
    Settings2,
    Shield,
    Store,
    Truck,
    Users,
    Warehouse,
} from "lucide-vue-next";
```

becomes:

```ts
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Box,
    Database,
    FileText,
    LayoutDashboard,
    Layers,
    Map,
    MapPin,
    Radio,
    Ruler,
    ScrollText,
    Settings2,
    Shield,
    Store,
    Truck,
    Users,
    Warehouse,
} from "lucide-vue-next";
```

Finally, replace:

```ts
    reports: [
        (node) => node.code.toUpperCase().startsWith("REPORT"),
        (node) => node.code.toUpperCase() === "LOG",
    ],
    settings: [
        (node) => node.code.toUpperCase().startsWith("SETTINGS"),
        (node) => node.code.toUpperCase().startsWith("SETTING"),
    ],
```

With:

```ts
    settings: [
        (node) => node.code.toUpperCase().startsWith("SETTINGS"),
        (node) => node.code.toUpperCase().startsWith("SETTING"),
        (node) => node.code.toUpperCase() === "LOG",
    ],
```

(The `reports` key is deleted entirely; its `LOG` rule is now the third rule under `settings`.)

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx eslint --fix src/components/templates/AppLayout.vue src/components/organisms/sidebarNavigation.ts`
Expected: no output.

- [ ] **Step 5: Manual verification with the dev server**

Use the `run` skill (or reuse an already-running dev server for this project on a known port) to log in and confirm: the Rail no longer shows a "Reports" icon between Transactions and Settings; opening the Settings sidebar (click the Settings rail icon) shows a "Log"-coded entry alongside the existing Companies/Apps/Menus entries (if the backend's menu tree currently has a `LOG` node — if the backend has no such node yet, this step only confirms no console errors, since there's nothing to render); navigating directly to `/log/tracking` still loads `TrackingPage.vue` with no errors (the route itself is untouched, only its nav visibility moved).

- [ ] **Step 6: Commit**

```bash
git add src/components/templates/AppLayout.vue src/components/organisms/sidebarNavigation.ts
git commit -m "feat(report): remove Reports rail/sidebar entry, move Log rule to Settings scope"
```

---

### Task 4: Add "Export XLS" to Stock Balance

**Files:**

- Modify: `src/views/stock/composables/useStockBalance.ts`
- Modify: `src/views/stock/StockBalancePage.vue`

**Interfaces:**

- Consumes: `reportService.exportReport(reportKey, params, columns): Promise<Blob>` from `@/services/report.service` (existing, unchanged); `reportConfigs["current-stock"]` from `@/views/report/reportConfig` (existing, unchanged — `{ title: "Stock Balance Report", columns: [{key:"product.name",label:"Product"},{key:"warehouse.name",label:"Warehouse"},{key:"location.name",label:"Location"},{key:"qty",label:"Quantity"}] }`).
- Produces: `useStockBalance()` now also returns `exportRows: () => Promise<void>`. `StockBalancePage.vue` renders a new "Export XLS" button calling it.

- [ ] **Step 1: Add `exportRows` to `useStockBalance.ts`**

In `src/views/stock/composables/useStockBalance.ts`, add these imports at the top (alongside the existing ones):

```ts
import { reportService } from "@/services/report.service";
import { reportConfigs } from "@/views/report/reportConfig";
```

Add this function after `refresh` (which currently reads `const refresh = () => { pagination.page = 1; void loadRows(); };`):

```ts
const exportRows = async () => {
    try {
        const blob = await reportService.exportReport(
            "current-stock",
            {
                page: pagination.page,
                limit: pagination.limit,
                search: keyword.value || undefined,
                warehouseId: selectedWarehouse.value || undefined,
            },
            reportConfigs["current-stock"].columns,
        );
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute(
            "download",
            `${reportConfigs["current-stock"].title}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Failed to export stock balance.";
    }
};
```

Add `exportRows` to the returned object (currently ending `pageSizeOptions, refresh, };`):

```ts
return {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    sortOrder,
    toggleSort,
    pagination,
    pageSizeOptions,
    refresh,
    exportRows,
};
```

- [ ] **Step 2: Add the Export button to `StockBalancePage.vue`**

Replace:

```html
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockBalanceRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                        </div>
```

With:

```html
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockBalanceRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                            <Button
                                variant="outline"
                                class="px-3"
                                :disabled="!displayRows.length"
                                object-id="btn_StockBalanceExport"
                                @click="exportRows"
                            >
                                <Icon :icon="Download" :size="14" />
                                Export XLS
                            </Button>
                        </div>
```

Then replace the icon import:

```ts
import { RefreshCw, Search, Filter } from "lucide-vue-next";
```

With:

```ts
import { RefreshCw, Search, Filter, Download } from "lucide-vue-next";
```

Then update the composable destructure to include `exportRows`:

```ts
const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
} = useStockBalance();
```

becomes:

```ts
const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
    exportRows,
} = useStockBalance();
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx eslint --fix src/views/stock/composables/useStockBalance.ts src/views/stock/StockBalancePage.vue`
Expected: no output.

- [ ] **Step 5: Manual verification with the dev server**

Navigate to `/stock/balance`. Confirm an "Export XLS" button appears next to Refresh, is disabled when the table is empty, and — with rows loaded — clicking it triggers an `.xlsx` file download named `Stock Balance Report.xlsx` with no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/stock/composables/useStockBalance.ts src/views/stock/StockBalancePage.vue
git commit -m "feat(stock): add Export XLS button to Stock Balance"
```

---

### Task 5: Add "Export XLS" to Stock Ledger

**Files:**

- Modify: `src/views/stock/composables/useStockLedger.ts`
- Modify: `src/views/stock/StockLedgerPage.vue`

**Interfaces:**

- Consumes: same `reportService.exportReport` and `reportConfigs["stock-period"]` (`{ title: "Stock Movement", columns: [{key:"event_time",label:"Time"},{key:"doc_type",label:"Document"},{key:"product.name",label:"Product"},{key:"warehouse.name",label:"Warehouse"},{key:"qtyBefore",label:"Before"},{key:"qty",label:"Movement"},{key:"qtyAfter",label:"After"}] }`).
- Produces: `useStockLedger()` now also returns `exportRows: () => Promise<void>`. `StockLedgerPage.vue` renders a new "Export XLS" button calling it. Mirrors Task 4 exactly, with `"stock-period"` in place of `"current-stock"`.

- [ ] **Step 1: Add `exportRows` to `useStockLedger.ts`**

In `src/views/stock/composables/useStockLedger.ts`, add these imports at the top (alongside the existing ones):

```ts
import { reportService } from "@/services/report.service";
import { reportConfigs } from "@/views/report/reportConfig";
```

Add this function after `refresh` (which currently reads `const refresh = () => { pagination.page = 1; void loadRows(); };`):

```ts
const exportRows = async () => {
    try {
        const blob = await reportService.exportReport(
            "stock-period",
            {
                page: pagination.page,
                limit: pagination.limit,
                search: keyword.value || undefined,
                warehouseId: selectedWarehouse.value || undefined,
            },
            reportConfigs["stock-period"].columns,
        );
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute(
            "download",
            `${reportConfigs["stock-period"].title}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Failed to export stock ledger.";
    }
};
```

Add `exportRows` to the returned object:

```ts
return {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
    exportRows,
};
```

- [ ] **Step 2: Add the Export button to `StockLedgerPage.vue`**

Replace:

```html
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockLedgerRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                        </div>
```

With:

```html
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockLedgerRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                            <Button
                                variant="outline"
                                class="px-3"
                                :disabled="!displayRows.length"
                                object-id="btn_StockLedgerExport"
                                @click="exportRows"
                            >
                                <Icon :icon="Download" :size="14" />
                                Export XLS
                            </Button>
                        </div>
```

Then replace the icon import:

```ts
import { RefreshCw, Search, Filter } from "lucide-vue-next";
```

With:

```ts
import { RefreshCw, Search, Filter, Download } from "lucide-vue-next";
```

Then update the composable destructure to include `exportRows`:

```ts
const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
} = useStockLedger();
```

becomes:

```ts
const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
    exportRows,
} = useStockLedger();
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx eslint --fix src/views/stock/composables/useStockLedger.ts src/views/stock/StockLedgerPage.vue`
Expected: no output.

- [ ] **Step 5: Manual verification with the dev server**

Navigate to `/stock/ledger`. Confirm an "Export XLS" button appears next to Refresh, is disabled when the table is empty, and — with rows loaded — clicking it triggers an `.xlsx` file download named `Stock Movement.xlsx` with no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/stock/composables/useStockLedger.ts src/views/stock/StockLedgerPage.vue
git commit -m "feat(stock): add Export XLS button to Stock Ledger"
```

---

### Task 6: Final cross-cutting verification

**Files:** none (verification-only task, no commit expected unless a fix is needed).

- [ ] **Step 1: Full type-check and lint pass**

Run:

```bash
npm run type-check
npx eslint --fix src/router/index.ts src/views/report/reportConfig.ts src/components/templates/AppLayout.vue src/components/organisms/sidebarNavigation.ts src/views/stock/composables/useStockBalance.ts src/views/stock/StockBalancePage.vue src/views/stock/composables/useStockLedger.ts src/views/stock/StockLedgerPage.vue
```

Expected: `type-check` prints only the `vue-tsc --noEmit` banner (no errors); `eslint --fix` prints nothing.

- [ ] **Step 2: Confirm no remaining references to deleted Report UI**

Run: `grep -rn "views/report/ReportEntityPage\|components/templates/ReportLayout\|reportChildRoutes\|resolveReportSegment\|opname-variance" src/`
Expected: no output.

- [ ] **Step 3: Manual end-to-end browser check**

Using the `run` skill: confirm the Rail has no "Reports" icon; confirm `/transactions/inbound`'s existing "Export XLS" button still downloads correctly (regression check — Transaction depends on the same `reportConfig.ts`/`reportService.ts` this plan left untouched); confirm `/stock/balance` and `/stock/ledger` each have a working "Export XLS" button; confirm navigating directly to any old `/reports/*` URL (e.g. `/reports/stock-movement`) no longer resolves to a Report page (this is the intended outcome, not a regression to fix).
