# Dashboard Overview i18n Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Dashboard Overview sub-module (`DashboardPage.vue` and its Overview-only widgets) to `vue-i18n`, introducing the new `dashboard.json` locale namespace (`common` + `overview` sections). This is the second module migrated after Auth (fully complete) and follows the exact same pattern, TDD discipline, and file conventions established there.

**Architecture:** Same as the Auth module plan — `vue-i18n` (Composition API, global scope) via `useI18n()` / `t()`. New strings are added to `src/locales/id/dashboard.json` and `src/locales/en/dashboard.json`, and both files are wired into the existing merged messages object in `src/locales/index.ts` (already created by the foundation plan). Config/DTO layers still store i18n keys, not literal text, wherever this sub-module has any (none of the migrated files have a config/DTO indirection layer — all text is inline in templates/composables).

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), `vue-i18n` (already installed), Pinia, Vitest (node environment, no jsdom — component/text-regression checks use `?raw` source-string assertions, following the same convention as `src/views/auth/loginFormUsage.test.ts` and this module's own existing `src/views/dashboard/dashboardPageChrome.test.ts`).

## Global Constraints

- Default locale is Indonesian (`id`); no browser-locale auto-detection (per approved design spec `docs/spark/specs/2026-08-16-i18n-id-en-design.md`).
- Only frontend-owned text is translated (static UI copy, frontend-mapped labels). Backend-originated content (server error bodies, entity data values) is out of scope.
- Config/DTO objects must store i18n **keys**, never literal strings; templates/composables resolve text via `t()`.
- Every `id/<namespace>.json` file must have an exact key-parity match in the corresponding `en/<namespace>.json` file — already enforced by the existing guard test `src/config/i18nKeyParity.test.ts` (added in the foundation plan). That test is namespace-agnostic: it reads every file in `src/locales/id/`, so it will automatically start covering `dashboard.json` the moment Task 1 creates it. **No new task is added for it in this plan.**
- This plan covers **only** `DashboardPage.vue` (Overview) and its Overview-specific components/composable. `ExecutiveKpiPage.vue`, `ProcessPerformancePage.vue`, `MonitoringPage.vue`, and their components/composables (including `KpiWarehouseComparison.vue` and `KpiSupportingMetrics.vue`, which are reused by KPI/Process but are **not** part of the Overview page) are out of scope and get their own follow-up plans (KPI, Process, Monitoring), which will each **add** sections to the same two `dashboard.json` files created here.
- **Direction-of-copy note (differs from Auth):** in the Auth module, most existing hardcoded text was Indonesian, so `id/auth.json` mostly held literal copies of current text and `en/auth.json` needed newly authored English copy. In this Dashboard Overview sub-module, it is **the reverse for almost every string**: the existing hardcoded text in `DashboardAlertCenter.vue`, `DashboardWorkflowOverview.vue`, `DashboardKpiSnapshot.vue`, `StageDonutChart.vue`, `DashboardAlertListItem.vue`, `DashboardAlertDetailDrawer.vue`, and `useDashboard.ts` is already English, so `en/dashboard.json` holds those literal copies and `id/dashboard.json` needs newly authored Indonesian translations. The one exception is `DashboardToolbar.vue`'s warehouse-filter placeholder, which is currently the Indonesian literal `"Semua Gudang (Filter)"` — for that single key `id/dashboard.json` holds the literal copy and `en/dashboard.json` needs newly authored English copy (`"All Warehouses (Filter)"`). Every task below states explicitly, per string, which locale is the literal-copy side and which is the newly authored side.
- **Scope correction versus the original module inventory:** the task brief assumed a `common.*` "Dashboard" `PageHeader` tagline shared by all four dashboard pages (Overview/KPI/Process/Monitoring) that Overview also uses. Reading the actual files shows this is incorrect: `ExecutiveKpiPage.vue`, `ProcessPerformancePage.vue`, and `MonitoringPage.vue` each render `<PageHeader title="..." tagline="Dashboard" .../>`, but `DashboardPage.vue` (Overview) has **no `PageHeader` at all** — it deliberately renders only its toolbar, an `InlineAlert`, and the three widget cards. This is confirmed by the existing guard test `src/views/dashboard/dashboardPageChrome.test.ts`, which explicitly excludes `DashboardPage.vue` from the `dashboardSubPageSources` array that's asserted to contain `<PageHeader>`, and instead only asserts Overview uses `<InlineAlert>`. Therefore this plan does **not** create a `common.dashboardTagline` (or similarly named) key — there is no current Overview string to migrate for it. The KPI/Process/Monitoring follow-up sub-plans will introduce that shared tagline key themselves (into `common`) when they migrate the pages that actually render it.
- `common` in this plan therefore contains only the two cross-cutting Dashboard strings Overview actually renders today: the toolbar's warehouse-filter placeholder and its Refresh button label. Both are structured under `common` (not `overview`) per the task brief, since they live in `DashboardToolbar.vue`, a component shared by all four dashboard pages, even though only Overview's usage is migrated in this plan.
- **Pre-existing test convention correction:** unlike the Auth module (where every pre-existing test is a `?raw` source-string check), this sub-module's pre-existing component tests (`DashboardPage.test.ts`, `DashboardAlertCenter.test.ts`, `DashboardAlertListItem.test.ts`, `DashboardWorkflowOverview.test.ts`, `DashboardKpiSnapshot.test.ts`, `StageDonutChart.test.ts`) actually **render** the component through `createSSRApp(...)` + `renderToString(app)` from `vue/server-renderer` and assert on the resulting HTML string — still no `@vue/test-utils` and still compatible with the plain-`node` Vitest environment, but a real component render, not a source-text check. Once a component calls `useI18n()`, `vue-i18n`'s Composition API throws if the i18n plugin was never installed on that app instance (`app.use(i18n)`), so **every task below that touches one of these files installs the plugin on the test's `app` before calling `renderToString`, in addition to updating any literal-text assertions to the `id`-locale string** (default locale is `id`, so that's what actually renders). This is the same category of fix the Auth plan didn't need (no pre-existing SSR-render tests existed for Auth), so it's called out explicitly per task rather than left implicit.

---

### Task 1: Create the `dashboard` locale namespace (id/en) and wire it into the i18n instance

**Files:**

- Create: `src/locales/id/dashboard.json`
- Create: `src/locales/en/dashboard.json`
- Test: `src/locales/dashboard.test.ts`
- Modify: `src/locales/index.ts`

**Interfaces:**

- Produces: `dashboard.common.*` and `dashboard.overview.*` keys, consumed by Tasks 2–9.
- Modifies: the `messages` object in `src/locales/index.ts` (adds `dashboard: dashboardId` / `dashboard: dashboardEn` alongside the existing `common` and `auth` entries) so `t("dashboard.*")` resolves at runtime, not just in the standalone namespace test.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, test } from "vitest";
import dashboardId from "./id/dashboard.json";
import dashboardEn from "./en/dashboard.json";

describe("dashboard locale namespace", () => {
    test("id namespace defines toolbar and overview copy", () => {
        expect(dashboardId.common.warehouseFilterPlaceholder).toBe(
            "Semua Gudang (Filter)",
        );
        expect(dashboardId.overview.alertCenter.businessImpact).toBe(
            "Dampak Bisnis",
        );
    });

    test("en namespace defines toolbar and overview copy", () => {
        expect(dashboardEn.common.warehouseFilterPlaceholder).toBe(
            "All Warehouses (Filter)",
        );
        expect(dashboardEn.overview.alertCenter.businessImpact).toBe(
            "Business Impact",
        );
    });

    test("id and en namespaces expose the same top-level sections", () => {
        expect(Object.keys(dashboardEn).sort()).toEqual(
            Object.keys(dashboardId).sort(),
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/locales/dashboard.test.ts`
Expected: FAIL — `Cannot find module './id/dashboard.json'`

- [ ] **Step 3: Create the locale files**

`src/locales/id/dashboard.json`:

```json
{
    "common": {
        "warehouseFilterPlaceholder": "Semua Gudang (Filter)",
        "refresh": "Muat Ulang"
    },
    "overview": {
        "warehouseAlert": {
            "title": "Pemilih gudang tidak tersedia"
        },
        "alertCenter": {
            "panelTitle": "Pengecualian Operasional",
            "panelDescription": "Risiko gudang terbuka yang memerlukan tindakan operator",
            "badges": {
                "critical": "Kritis {count}",
                "warning": "Peringatan {count}",
                "info": "Info {count}"
            },
            "filters": {
                "all": "Semua",
                "critical": "Kritis",
                "warning": "Peringatan",
                "info": "Info"
            },
            "unavailable": {
                "title": "Feed pengecualian tidak tersedia"
            },
            "empty": {
                "title": "Tidak ada pengecualian terbuka",
                "description": "Gudang yang dipilih tidak memiliki risiko operasional aktif."
            },
            "emptyFiltered": "Tidak ada pengecualian {severity} pada tampilan ini.",
            "businessImpact": "Dampak Bisnis",
            "recommendedAction": "Tindakan yang Disarankan",
            "occurred": "Terjadi Pada",
            "documentReference": "Referensi Dokumen"
        },
        "workflowOverview": {
            "panelTitle": "Posisi Alur Kerja",
            "panelDescription": "Tahapan dokumen dan hambatan pada alur gudang yang aktif",
            "unavailable": {
                "title": "Data posisi alur kerja tidak tersedia"
            },
            "empty": {
                "title": "Tidak ada data posisi alur kerja",
                "description": "Tidak ada data posisi alur kerja untuk gudang yang dipilih."
            },
            "metrics": {
                "open": "Terbuka",
                "completionRate": "Tingkat Penyelesaian",
                "bottleneck": "Hambatan"
            },
            "insufficientData": "Data belum mencukupi",
            "avgWait": "Rata-rata tunggu"
        },
        "kpiSnapshot": {
            "panelTitle": "Cuplikan Kontrol KPI",
            "panelDescription": "Pergerakan skor untuk throughput, waktu siklus, dan akurasi",
            "unavailable": {
                "title": "Cuplikan KPI tidak tersedia"
            },
            "empty": "Tidak ada data kartu skor KPI untuk gudang yang dipilih.",
            "openDetail": "Buka Detail KPI"
        },
        "stageDonutChart": {
            "ariaLabelPrefix": "Distribusi tahap",
            "openLabel": "Terbuka",
            "otherLabel": "Lainnya"
        },
        "errors": {
            "loadFailed": "Gagal memuat data dashboard."
        }
    }
}
```

`src/locales/en/dashboard.json`:

```json
{
    "common": {
        "warehouseFilterPlaceholder": "All Warehouses (Filter)",
        "refresh": "Refresh"
    },
    "overview": {
        "warehouseAlert": {
            "title": "Warehouse selector unavailable"
        },
        "alertCenter": {
            "panelTitle": "Operational Exceptions",
            "panelDescription": "Open warehouse risks that need operator action",
            "badges": {
                "critical": "Critical {count}",
                "warning": "Warning {count}",
                "info": "Info {count}"
            },
            "filters": {
                "all": "All",
                "critical": "Critical",
                "warning": "Warning",
                "info": "Info"
            },
            "unavailable": {
                "title": "Exception feed unavailable"
            },
            "empty": {
                "title": "No open exceptions",
                "description": "Selected warehouse has no active operational risk."
            },
            "emptyFiltered": "No {severity} exceptions in the current view.",
            "businessImpact": "Business Impact",
            "recommendedAction": "Recommended Action",
            "occurred": "Occurred",
            "documentReference": "Document Reference"
        },
        "workflowOverview": {
            "panelTitle": "Workflow Position",
            "panelDescription": "Document stages and bottlenecks across active warehouse flows",
            "unavailable": {
                "title": "Workflow position data unavailable"
            },
            "empty": {
                "title": "No workflow position data",
                "description": "No workflow position data for the selected warehouse."
            },
            "metrics": {
                "open": "Open",
                "completionRate": "Completion Rate",
                "bottleneck": "Bottleneck"
            },
            "insufficientData": "Insufficient data yet",
            "avgWait": "Avg wait"
        },
        "kpiSnapshot": {
            "panelTitle": "KPI Control Snapshot",
            "panelDescription": "Score movement for throughput, cycle time, and accuracy",
            "unavailable": {
                "title": "KPI snapshot unavailable"
            },
            "empty": "No KPI scorecard data for the selected warehouse.",
            "openDetail": "Open KPI Detail"
        },
        "stageDonutChart": {
            "ariaLabelPrefix": "Stage distribution",
            "openLabel": "Open",
            "otherLabel": "Other"
        },
        "errors": {
            "loadFailed": "Failed to load dashboard data."
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/locales/dashboard.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the namespace into the i18n instance**

`src/locales/index.ts`:

```typescript
import { createI18n } from "vue-i18n";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";
import dashboardId from "./id/dashboard.json";
import dashboardEn from "./en/dashboard.json";

export type AppLocale = "id" | "en";

const messages = {
    id: {
        common: commonId,
        auth: authId,
        dashboard: dashboardId,
    },
    en: {
        common: commonEn,
        auth: authEn,
        dashboard: dashboardEn,
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "id" satisfies AppLocale,
    fallbackLocale: "id" satisfies AppLocale,
    messages,
});
```

- [ ] **Step 6: Run the full locale test suite and type-check**

Run: `npx vitest run src/locales`
Expected: PASS (all locale tests, including the untouched `common.test.ts`, `auth.test.ts`, `index.test.ts`, and the new `dashboard.test.ts`)

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/locales/id/dashboard.json src/locales/en/dashboard.json src/locales/dashboard.test.ts src/locales/index.ts
git commit -m "feat: add dashboard locale namespace (id/en) and wire it into i18n instance"
```

---

### Task 2: Migrate `DashboardToolbar.vue`

**Files:**

- Modify: `src/views/dashboard/components/DashboardToolbar.vue`
- Test: `src/views/dashboard/components/dashboardToolbarI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.common.warehouseFilterPlaceholder`, `dashboard.common.refresh` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import toolbarSource from "./DashboardToolbar.vue?raw";

describe("DashboardToolbar i18n usage", () => {
    it("resolves the warehouse filter placeholder and refresh label through vue-i18n", () => {
        expect(toolbarSource).toContain('import { useI18n } from "vue-i18n"');
        expect(toolbarSource).toContain(
            "dashboard.common.warehouseFilterPlaceholder",
        );
        expect(toolbarSource).toContain("dashboard.common.refresh");
        expect(toolbarSource).not.toContain("Semua Gudang (Filter)");
        expect(toolbarSource).not.toContain(">Refresh<");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/dashboardToolbarI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `DashboardToolbar.vue`**

```vue
<template>
    <Teleport v-if="isMounted" to="#page-toolbar-slot">
        <div
            class="mx-auto w-full max-w-[1400px] px-4 py-3 lg:px-6 flex flex-wrap items-center justify-between gap-4"
        >
            <!-- Warehouse scope remains the source-of-truth filter. -->
            <div class="flex items-center gap-2">
                <!-- Real Warehouse Filter -->
                <div class="w-[200px]">
                    <Select
                        v-if="warehouseOptions.length > 0"
                        :options="warehouseOptions"
                        :placeholder="
                            t('dashboard.common.warehouseFilterPlaceholder')
                        "
                        object-id="cmb_DashboardFilterWarehouse"
                        :placeholder-disabled="false"
                        :model-value="warehouseId ?? undefined"
                        @update:model-value="
                            (val) => $emit('update:warehouseId', val || null)
                        "
                    />
                </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="loading"
                    object-id="btn_DashboardRefresh"
                    @click="$emit('refresh')"
                >
                    <template #leftIcon>
                        <Icon
                            :icon="RefreshCw"
                            :size="14"
                            :class-name="
                                loading
                                    ? 'animate-spin text-text-muted'
                                    : 'text-text-secondary'
                            "
                        />
                    </template>
                    {{ t("dashboard.common.refresh") }}
                </Button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw } from "lucide-vue-next";

defineProps<{
    warehouseId: string | null | undefined;
    warehouseOptions: Array<{ label: string; value: string }>;
    loading: boolean;
}>();

defineEmits<{
    (e: "update:warehouseId", value: string | null): void;
    (e: "refresh"): void;
}>();

const { t } = useI18n();

const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/dashboardToolbarI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/components/DashboardToolbar.vue src/views/dashboard/components/dashboardToolbarI18n.test.ts
git commit -m "feat: translate DashboardToolbar via vue-i18n"
```

---

### Task 3: Migrate `DashboardPage.vue`

**Files:**

- Modify: `src/views/dashboard/DashboardPage.vue`
- Test: `src/views/dashboard/dashboardPageI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.warehouseAlert.title` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import dashboardPageSource from "./DashboardPage.vue?raw";

describe("DashboardPage i18n usage", () => {
    it("resolves the warehouse-selector alert title through vue-i18n", () => {
        expect(dashboardPageSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(dashboardPageSource).toContain(
            "dashboard.overview.warehouseAlert.title",
        );
        expect(dashboardPageSource).not.toContain(
            "Warehouse selector unavailable",
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/dashboardPageI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `DashboardPage.vue`**

```vue
<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="dashboardLoading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refreshDashboard"
        />

        <InlineAlert
            v-if="warehouseError && !warehousesLoading"
            variant="error"
            :title="t('dashboard.overview.warehouseAlert.title')"
            :description="warehouseError"
        />

        <div class="space-y-6">
            <DashboardAlertCenter
                :loading="alertsLoading"
                :data="alertsData"
                :error="alertsError"
            />

            <DashboardWorkflowOverview
                :loading="workflowLoading"
                :data="workflowData"
                :error="workflowError"
            />

            <DashboardKpiSnapshot
                :loading="kpiSnapshotLoading"
                :data="kpiSnapshotData"
                :error="kpiSnapshotError"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import DashboardToolbar from "./components/DashboardToolbar.vue";
import DashboardAlertCenter from "./components/DashboardAlertCenter.vue";
import DashboardWorkflowOverview from "./components/DashboardWorkflowOverview.vue";
import DashboardKpiSnapshot from "./components/DashboardKpiSnapshot.vue";
import { useDashboard } from "./composables/useDashboard";

const {
    warehouseOptions,
    warehousesLoading,
    warehouseError,
    dashboardLoading,
    refreshDashboard,
    selectedWarehouseId,
    setSelectedWarehouse,
    alertsData,
    alertsLoading,
    alertsError,
    workflowData,
    workflowLoading,
    workflowError,
    kpiSnapshotData,
    kpiSnapshotLoading,
    kpiSnapshotError,
} = useDashboard();

const { t } = useI18n();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/dashboardPageI18n.test.ts`
Expected: PASS (1 test)

Also re-run the pre-existing chrome guard test, since it also imports this file's raw source:

Run: `npx vitest run src/views/dashboard/dashboardPageChrome.test.ts`
Expected: PASS (unaffected — that test only checks for `<InlineAlert>` usage and the absence of `bg-danger-50 px-4 py-3`, both still true)

- [ ] **Step 5: Update the pre-existing SSR-render test to install the i18n plugin**

`DashboardPage.vue` now calls `useI18n()`, so `src/views/dashboard/DashboardPage.test.ts` (which renders it through `createSSRApp` + `renderToString`) throws at render time unless the i18n plugin is installed on the test's app instance. Update it to:

```typescript
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@/locales";

const useDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useDashboard", () => ({
    useDashboard: useDashboardMock,
}));

vi.mock("./components/DashboardToolbar.vue", () => ({
    default: defineComponent({
        name: "DashboardToolbarStub",
        setup: () => () => null,
    }),
}));

vi.mock("./components/DashboardAlertCenter.vue", () => ({
    default: defineComponent({
        name: "DashboardAlertCenterStub",
        setup: () => () => h("div", {}, "DashboardAlertCenterStub"),
    }),
}));

vi.mock("./components/DashboardWorkflowOverview.vue", () => ({
    default: defineComponent({
        name: "DashboardWorkflowOverviewStub",
        setup: () => () => h("div", {}, "DashboardWorkflowOverviewStub"),
    }),
}));

vi.mock("./components/DashboardKpiSnapshot.vue", () => ({
    default: defineComponent({
        name: "DashboardKpiSnapshotStub",
        setup: () => () => h("div", {}, "DashboardKpiSnapshotStub"),
    }),
}));

import DashboardPage from "./DashboardPage.vue";

describe("DashboardPage", () => {
    beforeEach(() => {
        useDashboardMock.mockReset();
        useDashboardMock.mockReturnValue({
            warehouseOptions: [],
            warehousesLoading: false,
            warehouseError: null,
            dashboardLoading: false,
            refreshDashboard: vi.fn(),
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
            alertsData: null,
            alertsLoading: false,
            alertsError: null,
            workflowData: null,
            workflowLoading: false,
            workflowError: null,
            kpiSnapshotData: null,
            kpiSnapshotLoading: false,
            kpiSnapshotError: null,
        });
    });

    it("renders each dashboard section component exactly once, with no duplicated heading wrapper", async () => {
        const app = createSSRApp(DashboardPage);
        app.use(i18n);
        const html = await renderToString(app);

        // Each section component (which owns its own heading) should render
        // exactly once. The page must not wrap them in an extra heading of
        // its own, since that would duplicate the heading these components
        // already render internally.
        expect(html).toContain("DashboardAlertCenterStub");
        expect(html).toContain("DashboardWorkflowOverviewStub");
        expect(html).toContain("DashboardKpiSnapshotStub");

        expect(html.match(/DashboardAlertCenterStub/g)).toHaveLength(1);
        expect(html.match(/DashboardWorkflowOverviewStub/g)).toHaveLength(1);
        expect(html.match(/DashboardKpiSnapshotStub/g)).toHaveLength(1);

        // Guard against the page reintroducing its own outer <h2> headings
        // for these sections, since each component is the single source of
        // its own heading text now.
        expect(html).not.toContain("<h2");
    });

    it("does not render a page-level error banner — each widget owns its own error state", async () => {
        useDashboardMock.mockReturnValue({
            warehouseOptions: [],
            warehousesLoading: false,
            warehouseError: null,
            dashboardLoading: false,
            refreshDashboard: vi.fn(),
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
            alertsData: null,
            alertsLoading: false,
            alertsError: "Alerts failed to load",
            workflowData: null,
            workflowLoading: false,
            workflowError: null,
            kpiSnapshotData: null,
            kpiSnapshotLoading: false,
            kpiSnapshotError: null,
        });

        const app = createSSRApp(DashboardPage);
        app.use(i18n);
        const html = await renderToString(app);

        // The stub echoes `error` as a plain HTML attribute
        // (`error="Alerts failed to load"`), which is expected — it proves
        // the prop reaches the widget. What must NOT happen is the page
        // rendering that same text as its own visible content (a page-level
        // banner), which would show up as `>Alerts failed to load<`.
        expect(html).not.toContain(">Alerts failed to load<");
    });
});
```

Run: `npx vitest run src/views/dashboard/DashboardPage.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/DashboardPage.vue src/views/dashboard/dashboardPageI18n.test.ts src/views/dashboard/DashboardPage.test.ts
git commit -m "feat: translate DashboardPage warehouse-selector alert via vue-i18n"
```

---

### Task 4: Migrate `DashboardAlertCenter.vue`

**Files:**

- Modify: `src/views/dashboard/components/DashboardAlertCenter.vue`
- Test: `src/views/dashboard/components/dashboardAlertCenterI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.alertCenter.*` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import alertCenterSource from "./DashboardAlertCenter.vue?raw";

describe("DashboardAlertCenter i18n usage", () => {
    it("resolves panel copy, badges, filters, and status-panel text through vue-i18n", () => {
        expect(alertCenterSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.panelTitle",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.badges.critical",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.filters.all",
        );
        expect(alertCenterSource).toContain(
            "dashboard.overview.alertCenter.emptyFiltered",
        );
        expect(alertCenterSource).not.toContain("Operational Exceptions");
        expect(alertCenterSource).not.toContain("No open exceptions");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/dashboardAlertCenterI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `DashboardAlertCenter.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <PanelHeader
            :title="t('dashboard.overview.alertCenter.panelTitle')"
            :description="t('dashboard.overview.alertCenter.panelDescription')"
        >
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <Badge tone="error">
                    {{
                        t("dashboard.overview.alertCenter.badges.critical", {
                            count: data.counts.critical,
                        })
                    }}
                </Badge>
                <Badge tone="warning">
                    {{
                        t("dashboard.overview.alertCenter.badges.warning", {
                            count: data.counts.warning,
                        })
                    }}
                </Badge>
                <Badge tone="info">
                    {{
                        t("dashboard.overview.alertCenter.badges.info", {
                            count: data.counts.info,
                        })
                    }}
                </Badge>
            </div>
        </PanelHeader>

        <SegmentedControl
            v-if="data && data.alerts.length > 0"
            v-model="severityFilter"
            class="mt-4"
            :options="severityFilterOptions"
            object-id-prefix="btn_DashboardAlertSeverity"
        />

        <div class="mt-6">
            <div v-if="loading" class="space-y-3">
                <SkeletonBlock
                    v-for="n in 3"
                    :key="`alert-skel-${n}`"
                    height="h-24"
                />
            </div>

            <StatusPanel
                v-else-if="error"
                :title="t('dashboard.overview.alertCenter.unavailable.title')"
                :description="error"
                :icon="AlertTriangle"
                tone="error"
            />

            <StatusPanel
                v-else-if="!data || data.alerts.length === 0"
                :title="t('dashboard.overview.alertCenter.empty.title')"
                :description="
                    t('dashboard.overview.alertCenter.empty.description')
                "
                :icon="CheckCircle2"
                tone="success"
            />

            <div
                v-else-if="filteredAlerts.length === 0"
                class="rounded-md border border-border bg-surface-secondary/50 p-8 text-center text-sm text-text-secondary"
            >
                {{
                    t("dashboard.overview.alertCenter.emptyFiltered", {
                        severity: severityFilter,
                    })
                }}
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="(alert, index) in filteredAlerts"
                    :key="`${alert.title}-${index}`"
                >
                    <DashboardAlertListItem
                        :alert="alert"
                        :object-id="`btn_DashboardAlertOpen_${index}`"
                        @open="selectedAlert = $event"
                    />
                </li>
            </ul>
        </div>

        <DashboardAlertDetailDrawer
            :alert="selectedAlert"
            @close="selectedAlert = null"
        />
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import Badge from "@/components/atoms/Badge.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import DashboardAlertListItem from "./DashboardAlertListItem.vue";
import DashboardAlertDetailDrawer from "./DashboardAlertDetailDrawer.vue";
import { AlertTriangle, CheckCircle2 } from "lucide-vue-next";
import type {
    DashboardAlert,
    DashboardAlertSeverity,
    DashboardAlertsResponse,
} from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DashboardAlertsResponse | null;
    error?: string | null;
}>();

const { t } = useI18n();

const severityFilterOptions = computed<Array<{ label: string; value: string }>>(
    () => [
        {
            label: t("dashboard.overview.alertCenter.filters.all"),
            value: "all",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.critical"),
            value: "critical",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.warning"),
            value: "warning",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.info"),
            value: "info",
        },
    ],
);

const severityFilter = ref<DashboardAlertSeverity | "all">("all");
const selectedAlert = ref<DashboardAlert | null>(null);

const filteredAlerts = computed(() => {
    const alerts = props.data?.alerts ?? [];
    if (severityFilter.value === "all") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter.value);
});
</script>
```

Note: `severityFilterOptions` changes from a plain array constant to a `computed` so its labels react to locale changes (mirrors the same array→computed conversion pattern already used for `localeOptions` in the Auth plan's Task 13 `useProfile.ts`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/dashboardAlertCenterI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Update the pre-existing SSR-render test to install the i18n plugin and expect id-locale text**

`src/views/dashboard/components/DashboardAlertCenter.test.ts` renders the component through `createSSRApp` + `renderToString` and currently asserts on the literal English strings this task just replaced (`"No open exceptions"`, `"Selected warehouse has no active operational risk"`, `"Operational Exceptions"`). Update it to install the plugin on every `app` and assert on the `id`-locale copy from Task 1 instead:

```typescript
import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { i18n } from "@/locales";
import DashboardAlertCenter from "./DashboardAlertCenter.vue";

// Drawer touches `document` directly (unguarded for SSR) and this repo's
// Vitest environment is plain Node (no jsdom) — stub it out here the same
// way page-level tests stub Drawer/Modal-based children.
vi.mock("@/components/organisms/Drawer.vue", () => ({
    default: defineComponent({
        name: "DrawerStub",
        inheritAttrs: false,
        props: {
            modelValue: Boolean,
            title: String,
            side: String,
            width: String,
            objectId: String,
        },
        setup:
            (_props, { slots }) =>
            () =>
                slots.default?.(),
    }),
}));

describe("DashboardAlertCenter", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: true,
            data: null,
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty state when there is no data", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: null,
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("Tidak ada pengecualian terbuka");
        expect(html).toContain(
            "Gudang yang dipilih tidak memiliki risiko operasional aktif",
        );
    });

    it("renders alert cards with severity, business impact, and recommended action", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: {
                counts: { critical: 1, warning: 1, info: 0 },
                alerts: [
                    {
                        severity: "critical",
                        title: "Sales Orders waiting Picking exceed threshold",
                        tag: "Jakarta Hub",
                        category: "Inventory",
                        summary:
                            "212 Sales Orders queued, 38% above normal threshold",
                        businessImpact:
                            "Potential shipment delay for 14 outbound Sales Orders",
                        recommendedAction:
                            "Reassign pickers from Zone A to Zone C-4.",
                        docRef: null,
                        occurredAt: "2026-07-18T09:12:00.000Z",
                    },
                ],
            },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("Pengecualian Operasional");
        expect(html).toContain("Sales Orders waiting Picking exceed threshold");
        expect(html).toContain(
            "Potential shipment delay for 14 outbound Sales Orders",
        );
        expect(html).toContain("Reassign pickers from Zone A to Zone C-4.");
    });

    it("renders severity filter tabs when alerts are present", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: {
                counts: { critical: 1, warning: 0, info: 0 },
                alerts: [
                    {
                        severity: "critical",
                        title: "RFID Reader Offline",
                        tag: "Jakarta Hub",
                        category: "Inventory",
                        summary: "Offline since 09:42",
                        businessImpact: "124 pallets untracked",
                        recommendedAction: "Power-cycle reader RDR-014.",
                        docRef: null,
                        occurredAt: "2026-07-18T09:42:00.000Z",
                    },
                ],
            },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("bg-danger-50");
        expect(html).toContain("bg-warning-50");
        expect(html).toContain("bg-info-50");
        expect(html).toContain("btn_DashboardAlertSeverity_all");
        expect(html).toContain("btn_DashboardAlertSeverity_critical");
        expect(html).toContain("btn_DashboardAlertSeverity_warning");
        expect(html).toContain("btn_DashboardAlertSeverity_info");
    });

    it("does not render severity filter tabs when there are no alerts", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: { counts: { critical: 0, warning: 0, info: 0 }, alerts: [] },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).not.toContain("btn_DashboardAlertSeverity_all");
    });
});
```

Run: `npx vitest run src/views/dashboard/components/DashboardAlertCenter.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/components/DashboardAlertCenter.vue src/views/dashboard/components/dashboardAlertCenterI18n.test.ts src/views/dashboard/components/DashboardAlertCenter.test.ts
git commit -m "feat: translate DashboardAlertCenter via vue-i18n"
```

---

### Task 5: Migrate `DashboardAlertListItem.vue` and `DashboardAlertDetailDrawer.vue`

**Grouping rationale:** both files are small (≤106 lines), both are rendered together as part of the same alert-detail flow (`DashboardAlertCenter.vue` opens the drawer from the list item's `@open` event), and both render the exact same two labels — `"Business Impact"` and `"Recommended Action"` — over the same alert fields (`alert.businessImpact`, `alert.recommendedAction`). Migrating them in one task keeps those two shared keys defined and consumed together instead of splitting a single conceptual change across two commits. `DashboardAlertDetailDrawer.vue` additionally renders `"Occurred"` and `"Document Reference"`, which are unique to it.

**Files:**

- Modify: `src/views/dashboard/components/DashboardAlertListItem.vue`
- Modify: `src/views/dashboard/components/DashboardAlertDetailDrawer.vue`
- Test: `src/views/dashboard/components/dashboardAlertItemAndDrawerI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.alertCenter.businessImpact`, `dashboard.overview.alertCenter.recommendedAction`, `dashboard.overview.alertCenter.occurred`, `dashboard.overview.alertCenter.documentReference` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import listItemSource from "./DashboardAlertListItem.vue?raw";
import detailDrawerSource from "./DashboardAlertDetailDrawer.vue?raw";

describe("DashboardAlertListItem and DashboardAlertDetailDrawer i18n usage", () => {
    it("resolves the shared Business Impact / Recommended Action labels through vue-i18n in the list item", () => {
        expect(listItemSource).toContain('import { useI18n } from "vue-i18n"');
        expect(listItemSource).toContain(
            "dashboard.overview.alertCenter.businessImpact",
        );
        expect(listItemSource).toContain(
            "dashboard.overview.alertCenter.recommendedAction",
        );
        expect(listItemSource).not.toContain("Business Impact");
        expect(listItemSource).not.toContain("Recommended Action");
    });

    it("resolves the shared labels plus Occurred / Document Reference through vue-i18n in the detail drawer", () => {
        expect(detailDrawerSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.businessImpact",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.recommendedAction",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.occurred",
        );
        expect(detailDrawerSource).toContain(
            "dashboard.overview.alertCenter.documentReference",
        );
        expect(detailDrawerSource).not.toContain("Business Impact");
        expect(detailDrawerSource).not.toContain("Recommended Action");
        expect(detailDrawerSource).not.toContain(">Occurred<");
        expect(detailDrawerSource).not.toContain("Document Reference");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/dashboardAlertItemAndDrawerI18n.test.ts`
Expected: FAIL — both sources still hardcoded.

- [ ] **Step 3: Migrate `DashboardAlertListItem.vue`**

```vue
<template>
    <button
        type="button"
        class="w-full rounded-md border border-border bg-surface p-4 text-left shadow-xs transition-colors hover:border-primary-200 hover:bg-primary-50/20"
        :object-id="objectId"
        @click="$emit('open', alert)"
    >
        <div class="flex items-start gap-3">
            <div :class="iconClasses">
                <Icon :icon="icon" :size="16" />
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-semibold text-text">
                        {{ alert.title }}
                    </span>
                    <Badge tone="neutral">
                        {{ alert.tag }}
                    </Badge>
                    <Badge tone="info">
                        {{ alert.category }}
                    </Badge>
                </div>
                <p class="text-xs text-text-secondary mt-1">
                    {{ alert.summary }}
                </p>
                <div
                    class="mt-3 grid gap-2 sm:grid-cols-2 bg-surface-secondary rounded-md p-3"
                >
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-secondary"
                        >
                            {{
                                t(
                                    "dashboard.overview.alertCenter.businessImpact",
                                )
                            }}
                        </p>
                        <p class="text-xs text-text mt-0.5">
                            {{ alert.businessImpact }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-secondary"
                        >
                            {{
                                t(
                                    "dashboard.overview.alertCenter.recommendedAction",
                                )
                            }}
                        </p>
                        <p class="text-xs text-text mt-0.5">
                            {{ alert.recommendedAction }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </button>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { useI18n } from "vue-i18n";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, Info } from "lucide-vue-next";
import type { DashboardAlert } from "@/model/dashboard";

const props = defineProps<{
    alert: DashboardAlert;
    objectId: string;
}>();

defineEmits<{
    (event: "open", alert: DashboardAlert): void;
}>();

const { t } = useI18n();

const icon = computed<Component>(() =>
    props.alert.severity === "info" ? Info : AlertTriangle,
);

const iconClasses = computed(() => {
    const base =
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";
    if (props.alert.severity === "critical") {
        return `${base} bg-danger-50 text-danger-600`;
    }
    if (props.alert.severity === "warning") {
        return `${base} bg-warning-50 text-warning-600`;
    }
    return `${base} bg-info-50 text-info-600`;
});
</script>
```

- [ ] **Step 4: Migrate `DashboardAlertDetailDrawer.vue`**

```vue
<template>
    <Drawer
        :model-value="Boolean(alert)"
        :title="alert?.title"
        side="right"
        width="md"
        object-id="drw_DashboardAlertDetail"
        @update:model-value="(open) => !open && emit('close')"
    >
        <div v-if="alert" class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
                <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="severityClass(alert.severity)"
                >
                    <Icon :icon="severityIcon(alert.severity)" :size="12" />
                    {{ alert.severity.toUpperCase() }}
                </span>
                <Badge tone="neutral">
                    {{ alert.tag }}
                </Badge>
                <Badge tone="info">
                    {{ alert.category }}
                </Badge>
            </div>

            <p class="text-sm text-text">
                {{ alert.summary }}
            </p>

            <div
                class="rounded-md border border-border bg-surface-secondary p-4"
            >
                <p
                    class="text-[10px] font-semibold uppercase text-text-secondary"
                >
                    {{ t("dashboard.overview.alertCenter.businessImpact") }}
                </p>
                <p class="mt-1 text-sm text-text">
                    {{ alert.businessImpact }}
                </p>
            </div>

            <div
                class="rounded-md border border-border bg-surface-secondary p-4"
            >
                <p
                    class="text-[10px] font-semibold uppercase text-text-secondary"
                >
                    {{ t("dashboard.overview.alertCenter.recommendedAction") }}
                </p>
                <p class="mt-1 text-sm text-text">
                    {{ alert.recommendedAction }}
                </p>
            </div>

            <div
                class="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs"
            >
                <div>
                    <p class="font-semibold uppercase text-text-secondary">
                        {{ t("dashboard.overview.alertCenter.occurred") }}
                    </p>
                    <p class="mt-1 text-text">
                        {{ formatDate(alert.occurredAt) }}
                    </p>
                </div>
                <div v-if="alert.docRef">
                    <p class="font-semibold uppercase text-text-secondary">
                        {{
                            t(
                                "dashboard.overview.alertCenter.documentReference",
                            )
                        }}
                    </p>
                    <p class="mt-1 text-text">
                        {{ alert.docRef }}
                    </p>
                </div>
            </div>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import { AlertTriangle, Info } from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { DashboardAlert } from "@/model/dashboard";

defineProps<{
    alert: DashboardAlert | null;
}>();

const emit = defineEmits<{
    (event: "close"): void;
}>();

const { t } = useI18n();

const severityIcon = (severity: DashboardAlert["severity"]) =>
    severity === "info" ? Info : AlertTriangle;

const severityClass = (severity: DashboardAlert["severity"]) => {
    if (severity === "critical") return "bg-danger-50 text-danger-600";
    if (severity === "warning") return "bg-warning-50 text-warning-600";
    return "bg-info-50 text-info-600";
};
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/dashboardAlertItemAndDrawerI18n.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Update the pre-existing SSR-render test to install the i18n plugin**

`src/views/dashboard/components/DashboardAlertListItem.test.ts` renders the component through `createSSRApp` + `renderToString`. It doesn't assert on the `"Business Impact"` / `"Recommended Action"` label text itself (only on the alert's own data fields, which are unchanged), but it still needs the i18n plugin installed or the render throws once the component calls `useI18n()`. Update it to:

```typescript
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { i18n } from "@/locales";
import DashboardAlertListItem from "./DashboardAlertListItem.vue";

describe("DashboardAlertListItem", () => {
    it("renders alert metadata, impact, and action with severity tone", async () => {
        const app = createSSRApp(DashboardAlertListItem, {
            objectId: "btn_TestAlert",
            alert: {
                severity: "critical",
                title: "RFID Reader Offline",
                tag: "Jakarta Hub",
                category: "Inventory",
                summary: "Offline since 09:42",
                businessImpact: "124 pallets untracked",
                recommendedAction: "Power-cycle reader RDR-014.",
                docRef: null,
                occurredAt: "2026-07-18T09:42:00.000Z",
            },
        });
        app.use(i18n);

        const html = await renderToString(app);

        expect(html).toContain('object-id="btn_TestAlert"');
        expect(html).toContain("RFID Reader Offline");
        expect(html).toContain("Jakarta Hub");
        expect(html).toContain("Inventory");
        expect(html).toContain("124 pallets untracked");
        expect(html).toContain("Power-cycle reader RDR-014.");
        expect(html).toContain("bg-danger-50 text-danger-600");
    });
});
```

Note: `DashboardAlertDetailDrawer.vue` has no pre-existing standalone test file (confirmed by searching `src/views/dashboard/components/*.test.ts` — only `DashboardAlertListItem.test.ts` exists for this pair), so there is no second pre-existing test to update for it; the drawer's own coverage is the new `dashboardAlertItemAndDrawerI18n.test.ts` from Step 1 plus its indirect coverage inside `DashboardAlertCenter.test.ts` (already updated in Task 4, where the Drawer is stubbed out).

Run: `npx vitest run src/views/dashboard/components/DashboardAlertListItem.test.ts`
Expected: PASS (1 test)

- [ ] **Step 7: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/views/dashboard/components/DashboardAlertListItem.vue src/views/dashboard/components/DashboardAlertDetailDrawer.vue src/views/dashboard/components/dashboardAlertItemAndDrawerI18n.test.ts src/views/dashboard/components/DashboardAlertListItem.test.ts
git commit -m "feat: translate DashboardAlertListItem and DashboardAlertDetailDrawer via vue-i18n"
```

---

### Task 6: Migrate `DashboardWorkflowOverview.vue`

**Files:**

- Modify: `src/views/dashboard/components/DashboardWorkflowOverview.vue`
- Test: `src/views/dashboard/components/dashboardWorkflowOverviewI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.workflowOverview.*` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import workflowOverviewSource from "./DashboardWorkflowOverview.vue?raw";

describe("DashboardWorkflowOverview i18n usage", () => {
    it("resolves panel copy, metric labels, and status text through vue-i18n", () => {
        expect(workflowOverviewSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.panelTitle",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.metrics.open",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.insufficientData",
        );
        expect(workflowOverviewSource).toContain(
            "dashboard.overview.workflowOverview.avgWait",
        );
        expect(workflowOverviewSource).not.toContain("Workflow Position");
        expect(workflowOverviewSource).not.toContain("Insufficient data yet");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/dashboardWorkflowOverviewI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `DashboardWorkflowOverview.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardWorkflowOverview">
        <PanelHeader
            :title="t('dashboard.overview.workflowOverview.panelTitle')"
            :description="
                t('dashboard.overview.workflowOverview.panelDescription')
            "
        />

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 lg:grid-cols-2">
                <SkeletonBlock
                    v-for="n in 2"
                    :key="`wf-skel-${n}`"
                    height="h-48"
                />
            </div>

            <StatusPanel
                v-else-if="error"
                :title="
                    t('dashboard.overview.workflowOverview.unavailable.title')
                "
                :description="error"
                :icon="AlertTriangle"
                tone="error"
            />

            <StatusPanel
                v-else-if="!data || data.panels.length === 0"
                :title="t('dashboard.overview.workflowOverview.empty.title')"
                :description="
                    t('dashboard.overview.workflowOverview.empty.description')
                "
                :icon="Activity"
                tone="neutral"
            />

            <div v-else class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="panel in data.panels"
                    :key="panel.key"
                    class="rounded-md border border-border p-4"
                >
                    <PanelHeader :title="panel.title" />
                    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.open',
                                )
                            "
                            :value="panel.openCount"
                            class="border-0 bg-transparent p-0"
                        />
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.completionRate',
                                )
                            "
                            :value="`${Math.round(panel.completionRate * 100)}%`"
                            class="border-0 bg-transparent p-0"
                        />
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.bottleneck',
                                )
                            "
                            :value="panel.bottleneckStage"
                            class="col-span-2 border-0 bg-transparent p-0"
                            value-class="text-warning-600"
                        />
                    </div>

                    <div
                        v-if="panel.stages.length > 0"
                        class="mt-4 rounded-md border border-border bg-surface-secondary/40 p-3"
                    >
                        <StageDonutChart
                            :stages="
                                panel.stages.map((stage) => ({
                                    name: stage.name,
                                    count: stage.count,
                                }))
                            "
                        />
                    </div>

                    <div class="mt-4 space-y-2">
                        <div
                            v-for="stage in panel.stages"
                            :key="stage.name"
                            class="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-xs"
                        >
                            <span class="font-medium text-text">{{
                                stage.name
                            }}</span>
                            <span class="text-text-secondary"
                                >{{ stage.count }} · {{ stage.pctOfOpen ?? 0 }}%
                                <template v-if="stage.avgWaitHours !== null">
                                    ·
                                    {{
                                        t(
                                            "dashboard.overview.workflowOverview.avgWait",
                                        )
                                    }}
                                    {{
                                        stage.avgWaitHours.toFixed(1)
                                    }}h</template
                                ></span
                            >
                            <span
                                v-if="stage.trendPct === null"
                                class="text-text-muted italic"
                            >
                                {{
                                    t(
                                        "dashboard.overview.workflowOverview.insufficientData",
                                    )
                                }}
                            </span>
                            <span
                                v-else
                                :class="
                                    stage.trendPct >= 0
                                        ? 'text-success-600'
                                        : 'text-danger-600'
                                "
                                class="font-semibold"
                            >
                                {{ stage.trendPct >= 0 ? "+" : ""
                                }}{{ stage.trendPct.toFixed(1) }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import MetricValueTile from "@/components/molecules/MetricValueTile.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import StageDonutChart from "./StageDonutChart.vue";
import { Activity, AlertTriangle } from "lucide-vue-next";
import type { DashboardWorkflowOverviewResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardWorkflowOverviewResponse | null;
    error?: string | null;
}>();

const { t } = useI18n();
</script>
```

Note: the `·` separator and the literal `"Avg wait"` text previously ran together as `· Avg wait {{ ... }}h` inside one `<template v-if>`; the migrated markup keeps the same rendered order (`· Avg wait 1.5h`) by placing the static `·` character before the translated `t("dashboard.overview.workflowOverview.avgWait")` call and the numeric `{{ stage.avgWaitHours.toFixed(1) }}h` after it. The `h` hour-suffix and `%`/`+`/`·` punctuation are left as literal characters (unit symbols/punctuation, not translatable words), consistent with the design spec's scope boundary (UI text, not data formatting symbols).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/dashboardWorkflowOverviewI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Update the pre-existing SSR-render test to install the i18n plugin and expect id-locale text**

`src/views/dashboard/components/DashboardWorkflowOverview.test.ts` renders the component through `createSSRApp` + `renderToString` and asserts on literal English strings (`"Workflow Position"`, `"Document stages and bottlenecks across active warehouse flows"`, `"Insufficient data yet"`, and a `not.toContain("Avg wait")` check). Update it to:

```typescript
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { i18n } from "@/locales";
import DashboardWorkflowOverview from "./DashboardWorkflowOverview.vue";

describe("DashboardWorkflowOverview", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: true,
            data: null,
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders panel titles, kpi row, and insufficient-data state for trend", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "inboundPutaway",
                        title: "Inbound & Putaway Workflow",
                        openCount: 428,
                        avgCycleTimeHours: null,
                        completionRate: 0.88,
                        bottleneckStage: "Waiting Putaway",
                        stages: [
                            {
                                name: "Waiting Putaway",
                                count: 120,
                                pctOfOpen: 28,
                                avgWaitHours: null,
                                trendPct: null,
                            },
                        ],
                    },
                ],
            },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("Posisi Alur Kerja");
        expect(html).toContain(
            "Tahapan dokumen dan hambatan pada alur gudang yang aktif",
        );
        expect(html).toContain("Inbound &amp; Putaway Workflow");
        expect(html).toContain("Waiting Putaway");
        expect(html).toContain("Data belum mencukupi");
    });

    it("renders avg wait hours when present, and omits it when null", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "inboundPutaway",
                        title: "Inbound & Putaway Workflow",
                        openCount: 428,
                        avgCycleTimeHours: null,
                        completionRate: 0.88,
                        bottleneckStage: "Waiting Putaway",
                        stages: [
                            {
                                name: "Waiting Putaway",
                                count: 120,
                                pctOfOpen: 28,
                                avgWaitHours: 2.4,
                                trendPct: null,
                            },
                            {
                                name: "QC Hold",
                                count: 40,
                                pctOfOpen: 10,
                                avgWaitHours: null,
                                trendPct: null,
                            },
                        ],
                    },
                ],
            },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("2.4h");
        expect(html).toContain("QC Hold");

        // "QC Hold" now also appears in the donut chart legend above the
        // detailed stage list, so scope to the LAST occurrence (the list row).
        const qcHoldSection = html.slice(html.lastIndexOf("QC Hold"));
        expect(qcHoldSection).not.toContain("Rata-rata tunggu");
    });

    it("renders a trend percentage when present", async () => {
        const app = createSSRApp(DashboardWorkflowOverview, {
            loading: false,
            data: {
                panels: [
                    {
                        key: "outbound",
                        title: "Outbound Workflow",
                        openCount: 50,
                        avgCycleTimeHours: null,
                        completionRate: 0.6,
                        bottleneckStage: "Open",
                        stages: [
                            {
                                name: "Posted",
                                count: 30,
                                pctOfOpen: 60,
                                avgWaitHours: null,
                                trendPct: 12.5,
                            },
                        ],
                    },
                ],
            },
        });
        app.use(i18n);
        const html = await renderToString(app);
        expect(html).toContain("text-success-600");
        expect(html).toContain("+12.5%");
    });
});
```

Run: `npx vitest run src/views/dashboard/components/DashboardWorkflowOverview.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/components/DashboardWorkflowOverview.vue src/views/dashboard/components/dashboardWorkflowOverviewI18n.test.ts src/views/dashboard/components/DashboardWorkflowOverview.test.ts
git commit -m "feat: translate DashboardWorkflowOverview via vue-i18n"
```

---

### Task 7: Migrate `DashboardKpiSnapshot.vue`

**Files:**

- Modify: `src/views/dashboard/components/DashboardKpiSnapshot.vue`
- Test: `src/views/dashboard/components/dashboardKpiSnapshotI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.kpiSnapshot.*` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import kpiSnapshotSource from "./DashboardKpiSnapshot.vue?raw";

describe("DashboardKpiSnapshot i18n usage", () => {
    it("resolves panel copy, empty-state text, and the detail link through vue-i18n", () => {
        expect(kpiSnapshotSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.panelTitle",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.unavailable.title",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.empty",
        );
        expect(kpiSnapshotSource).toContain(
            "dashboard.overview.kpiSnapshot.openDetail",
        );
        expect(kpiSnapshotSource).not.toContain("KPI Control Snapshot");
        expect(kpiSnapshotSource).not.toContain("Open KPI Detail");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/dashboardKpiSnapshotI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `DashboardKpiSnapshot.vue`**

```vue
<template>
    <Card object-id="wdg_DashboardKpiSnapshot">
        <PanelHeader
            :title="t('dashboard.overview.kpiSnapshot.panelTitle')"
            :description="t('dashboard.overview.kpiSnapshot.panelDescription')"
        />

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 sm:grid-cols-3">
                <SkeletonBlock
                    v-for="n in 3"
                    :key="`kpi-skel-${n}`"
                    height="h-40"
                />
            </div>

            <InlineAlert
                v-else-if="error"
                variant="error"
                :title="t('dashboard.overview.kpiSnapshot.unavailable.title')"
                :description="error"
            />

            <div
                v-else-if="!data || data.cards.length === 0"
                class="rounded-md border border-border bg-surface-secondary/50 p-8 text-center text-sm text-text-secondary"
            >
                {{ t("dashboard.overview.kpiSnapshot.empty") }}
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-3">
                <div
                    v-for="card in data.cards"
                    :key="card.key"
                    class="rounded-md border border-border p-4"
                >
                    <div class="flex items-center justify-between">
                        <span
                            class="text-xs font-semibold uppercase text-text-muted"
                            >{{ card.label }}</span
                        >
                        <span
                            :class="
                                card.trendVsPrevious >= 0
                                    ? 'text-success-600'
                                    : 'text-danger-600'
                            "
                            class="text-xs font-semibold"
                        >
                            {{ card.trendVsPrevious >= 0 ? "+" : ""
                            }}{{ card.trendVsPrevious }}pt
                        </span>
                    </div>
                    <p class="text-2xl font-semibold text-text mt-2">
                        {{ card.score
                        }}<span class="text-xs font-semibold text-text-muted">
                            / 100</span
                        >
                    </p>
                    <div class="mt-3 space-y-1.5">
                        <div
                            v-for="metric in card.subMetrics"
                            :key="metric.label"
                            class="flex items-center justify-between text-xs"
                        >
                            <span class="text-text-secondary">{{
                                metric.label
                            }}</span>
                            <span class="font-semibold text-success-600">{{
                                metric.value
                            }}</span>
                        </div>
                    </div>
                    <svg
                        class="mt-3 h-8 w-full"
                        viewBox="0 0 100 30"
                        preserveAspectRatio="none"
                    >
                        <polyline
                            :points="sparklinePoints(card.sparkline)"
                            fill="none"
                            class="stroke-primary-600"
                            stroke-width="2"
                        />
                    </svg>
                    <RouterLink
                        :to="{
                            path: '/dashboard/kpi',
                            query: { domain: card.key },
                        }"
                        class="mt-4 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                        {{ t("dashboard.overview.kpiSnapshot.openDetail") }}
                    </RouterLink>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import type { DashboardKpiSnapshotResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiSnapshotResponse | null;
    error?: string | null;
}>();

const { t } = useI18n();

function sparklinePoints(values: number[]): string {
    if (!values || values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? 100 / (values.length - 1) : 0;

    return values
        .map((value, index) => {
            const x = index * step;
            const y = 30 - ((value - min) / range) * 30;
            return `${x},${y}`;
        })
        .join(" ");
}
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/dashboardKpiSnapshotI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Update the pre-existing SSR-render test to install the i18n plugin and expect id-locale text**

`src/views/dashboard/components/DashboardKpiSnapshot.test.ts` renders the component through `createSSRApp` + `renderToString` (via its own `renderWithRouter` helper, since `RouterLink` needs an injected router) and asserts on literal English strings (`"KPI Control Snapshot"`, `"Open KPI Detail"`). Update it to:

```typescript
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import { i18n } from "@/locales";
import DashboardKpiSnapshot from "./DashboardKpiSnapshot.vue";

// RouterLink requires an injected router, so tests install a minimal
// memory-history router rather than mounting the component standalone.
const createTestRouter = () =>
    createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/dashboard/kpi", component: { template: "<div />" } },
        ],
    });

const renderWithRouter = async (props: Record<string, unknown>) => {
    const app = createSSRApp(DashboardKpiSnapshot, props);
    const router = createTestRouter();
    app.use(router);
    app.use(i18n);
    // Memory history never auto-navigates, so isReady() would hang forever
    // without an explicit initial push.
    await router.push("/");
    await router.isReady();
    return renderToString(app);
};

describe("DashboardKpiSnapshot", () => {
    it("renders a skeleton while loading", async () => {
        const html = await renderWithRouter({ loading: true, data: null });
        expect(html).toContain("animate-pulse");
    });

    it("renders score cards with sub-metrics and a view-performance link to the KPI page", async () => {
        const html = await renderWithRouter({
            loading: false,
            data: {
                cards: [
                    {
                        key: "stockIn",
                        label: "Stock In Performance",
                        score: 83,
                        trendVsPrevious: 0.8,
                        subMetrics: [
                            {
                                label: "Productivity Improvement",
                                value: "+1.1%",
                            },
                            { label: "Cycle Time Improvement", value: "+1.6%" },
                        ],
                        sparkline: [80, 81, 82, 81, 82, 83],
                    },
                ],
            },
        });
        expect(html).toContain("Cuplikan Kontrol KPI");
        expect(html).toContain("Stock In Performance");
        expect(html).toContain("83");
        expect(html).toContain("Productivity Improvement");
        expect(html).toContain("Buka Detail KPI");
        expect(html).toContain('href="/dashboard/kpi?domain=stockIn"');
    });
});
```

Run: `npx vitest run src/views/dashboard/components/DashboardKpiSnapshot.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/components/DashboardKpiSnapshot.vue src/views/dashboard/components/dashboardKpiSnapshotI18n.test.ts src/views/dashboard/components/DashboardKpiSnapshot.test.ts
git commit -m "feat: translate DashboardKpiSnapshot via vue-i18n"
```

---

### Task 8: Migrate `StageDonutChart.vue`

**Files:**

- Modify: `src/views/dashboard/components/StageDonutChart.vue`
- Test: `src/views/dashboard/components/stageDonutChartI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.stageDonutChart.*` (Task 1).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import stageDonutChartSource from "./StageDonutChart.vue?raw";

describe("StageDonutChart i18n usage", () => {
    it("resolves the aria-label prefix, center label, and 'Other' grouping label through vue-i18n", () => {
        expect(stageDonutChartSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.ariaLabelPrefix",
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.openLabel",
        );
        expect(stageDonutChartSource).toContain(
            "dashboard.overview.stageDonutChart.otherLabel",
        );
        expect(stageDonutChartSource).not.toContain("Stage distribution:");
        expect(stageDonutChartSource).not.toContain('name: "Other"');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/components/stageDonutChartI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `StageDonutChart.vue`**

```vue
<template>
    <div class="flex items-center gap-4">
        <svg
            :viewBox="`0 0 ${size} ${size}`"
            :width="size"
            :height="size"
            class="shrink-0"
            role="img"
            :aria-label="`${t('dashboard.overview.stageDonutChart.ariaLabelPrefix')}: ${segments.map((s) => `${s.name} ${s.pct}%`).join(', ')}`"
        >
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                class="stroke-border"
                :stroke-width="strokeWidth"
            />
            <circle
                v-for="segment in segments"
                :key="segment.name"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke="segment.color"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                :stroke-dasharray="`${segment.dash} ${circumference - segment.dash}`"
                :stroke-dashoffset="segment.offset"
                :transform="`rotate(-90 ${size / 2} ${size / 2})`"
            >
                <title>
                    {{ segment.name }}: {{ segment.count }} ({{ segment.pct }}%)
                </title>
            </circle>
            <text
                :x="size / 2"
                :y="size / 2 - 6"
                text-anchor="middle"
                class="fill-text text-[15px] font-bold"
            >
                {{ total }}
            </text>
            <text
                :x="size / 2"
                :y="size / 2 + 12"
                text-anchor="middle"
                class="fill-text-secondary text-[9px] font-semibold uppercase"
            >
                {{ t("dashboard.overview.stageDonutChart.openLabel") }}
            </text>
        </svg>

        <ul class="min-w-0 flex-1 space-y-1.5">
            <li
                v-for="segment in segments"
                :key="segment.name"
                class="flex items-center gap-2 text-xs"
            >
                <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: segment.color }"
                ></span>
                <span class="min-w-0 flex-1 truncate font-medium text-text">{{
                    segment.name
                }}</span>
                <span class="shrink-0 text-text-secondary"
                    >{{ segment.count }} · {{ segment.pct }}%</span
                >
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = withDefaults(
    defineProps<{
        stages: Array<{ name: string; count: number }>;
        size?: number;
    }>(),
    { size: 96 },
);

const { t } = useI18n();

// Fixed categorical order: a 6th stage folds into "Other" instead of cycling.
const PALETTE = [
    "rgb(var(--primary-600))",
    "rgb(var(--primary-teal))",
    "rgb(var(--action-orange))",
    "rgb(var(--insight-purple))",
    "rgb(var(--signal-red))",
];
const MAX_SEGMENTS = PALETTE.length;

const size = computed(() => props.size);
const strokeWidth = 12;
const radius = computed(() => size.value / 2 - strokeWidth / 2 - 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

const total = computed(() =>
    props.stages.reduce((sum, stage) => sum + stage.count, 0),
);

const groupedStages = computed(() => {
    const sorted = [...props.stages].sort((a, b) => b.count - a.count);
    if (sorted.length <= MAX_SEGMENTS) return sorted;
    const head = sorted.slice(0, MAX_SEGMENTS - 1);
    const restCount = sorted
        .slice(MAX_SEGMENTS - 1)
        .reduce((sum, stage) => sum + stage.count, 0);
    return [
        ...head,
        {
            name: t("dashboard.overview.stageDonutChart.otherLabel"),
            count: restCount,
        },
    ];
});

const segments = computed(() => {
    let offsetAccum = 0;
    return groupedStages.value.map((stage, index) => {
        const pct =
            total.value > 0 ? Math.round((stage.count / total.value) * 100) : 0;
        const dash =
            total.value > 0
                ? (stage.count / total.value) * circumference.value
                : 0;
        const segment = {
            name: stage.name,
            count: stage.count,
            pct,
            color: PALETTE[index % PALETTE.length],
            dash,
            offset: -offsetAccum,
        };
        offsetAccum += dash;
        return segment;
    });
});
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/components/stageDonutChartI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Update the pre-existing SSR-render test to install the i18n plugin and expect id-locale text**

`src/views/dashboard/components/StageDonutChart.test.ts` renders the component through `createSSRApp` + `renderToString` and asserts `toContain("Other")` for the grouped-stage case. Update it to:

```typescript
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { i18n } from "@/locales";
import StageDonutChart from "./StageDonutChart.vue";

describe("StageDonutChart", () => {
    it("renders the total count in the center and a legend row per stage", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [
                { name: "Waiting Putaway", count: 120 },
                { name: "QC Hold", count: 40 },
            ],
        });
        app.use(i18n);
        const html = await renderToString(app);

        expect(html).toContain("160");
        expect(html).toContain("Waiting Putaway");
        expect(html).toContain("75%");
        expect(html).toContain("QC Hold");
        expect(html).toContain("25%");
    });

    it("folds stages beyond the fixed palette size into an 'Other' segment", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [
                { name: "A", count: 50 },
                { name: "B", count: 40 },
                { name: "C", count: 30 },
                { name: "D", count: 20 },
                { name: "E", count: 10 },
                { name: "F", count: 5 },
            ],
        });
        app.use(i18n);
        const html = await renderToString(app);

        expect(html).toContain("Lainnya");
    });

    it("renders 0% and no NaN when total count is zero", async () => {
        const app = createSSRApp(StageDonutChart, {
            stages: [{ name: "Empty Stage", count: 0 }],
        });
        app.use(i18n);
        const html = await renderToString(app);

        expect(html).not.toContain("NaN");
        expect(html).toContain("0%");
    });
});
```

Run: `npx vitest run src/views/dashboard/components/StageDonutChart.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/dashboard/components/StageDonutChart.vue src/views/dashboard/components/stageDonutChartI18n.test.ts src/views/dashboard/components/StageDonutChart.test.ts
git commit -m "feat: translate StageDonutChart via vue-i18n"
```

---

### Task 9: Migrate `useDashboard.ts`

**Files:**

- Modify: `src/views/dashboard/composables/useDashboard.ts`
- Test: `src/views/dashboard/composables/useDashboardI18n.test.ts`

**Interfaces:**

- Consumes: `dashboard.overview.errors.loadFailed` (Task 1).

**Implementation note:** `useDashboard()` is called directly in `src/views/dashboard/composables/useDashboard.test.ts` without mounting a Vue component (no active component instance — the same reason this file already guards `onMounted` behind `getCurrentInstance()`). `useI18n()` from `vue-i18n`'s Composition API throws when called without an active component instance, so this composable must resolve the fallback string through the **global i18n instance directly** (`i18n.global.t`) rather than `useI18n()`, unlike every component-level migration in this plan and the Auth plan (which all call from inside `<script setup>`, always inside an active instance).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import useDashboardSource from "./useDashboard.ts?raw";

describe("useDashboard i18n usage", () => {
    it("resolves the generic load-failure fallback through the global i18n instance", () => {
        expect(useDashboardSource).toContain(
            'import { i18n } from "@/locales"',
        );
        expect(useDashboardSource).toContain(
            "dashboard.overview.errors.loadFailed",
        );
        expect(useDashboardSource).not.toContain(
            "Failed to load dashboard data.",
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/dashboard/composables/useDashboardI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `useDashboard.ts`**

Only the top of the file (imports and `normalizeErrorMessage`) changes; every other line is unchanged from the current file.

```typescript
import { ref, computed, watch, onMounted, getCurrentInstance } from "vue";
import { useRoute, useRouter } from "vue-router";
import { i18n } from "@/locales";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import { useDashboardWarehouseFilter } from "./useDashboardWarehouseFilter";
import { dashboardRequestCache } from "./dashboardRequestCache";
import type {
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardFilterState,
} from "@/model/dashboard";

const normalizeErrorMessage = (error: unknown): string =>
    error instanceof Error
        ? error.message
        : i18n.global.t("dashboard.overview.errors.loadFailed");

type RefreshDashboardOptions = {
    force?: boolean;
};

export function useDashboard() {
    const route = useRoute();
    const router = useRouter();
    const warehouseStore = useWarehouseStore();

    const {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    } = useDashboardWarehouseFilter();

    const normalizedQueryWarehouseId = computed(() => {
        const raw = route.query.warehouse_id;
        if (Array.isArray(raw)) {
            return raw.at(-1) ?? null;
        }
        if (typeof raw === "string" && raw.trim()) {
            return raw;
        }
        return null;
    });

    watch(
        normalizedQueryWarehouseId,
        (queryValue) => {
            if (queryValue === warehouseStore.selectedWarehouseId) {
                return;
            }
            warehouseStore.setWarehouse(queryValue);
        },
        { immediate: true },
    );

    watch(
        () => warehouseStore.selectedWarehouseId,
        (warehouseId) => {
            const current = normalizedQueryWarehouseId.value;
            if (warehouseId === current) {
                return;
            }
            const nextQuery = {
                ...route.query,
                warehouse_id: warehouseId ?? undefined,
            };
            void router.replace({ query: nextQuery });
        },
    );

    // Data + per-widget error state — each Overview widget gets its own error
    // ref so a failed fetch is distinguishable from a genuinely empty result
    // (a shared error ref would make e.g. a failed alerts fetch look
    // identical to "zero alerts" once a later-resolving fetch overwrites it).
    const alertsData = ref<DashboardAlertsResponse | null>(null);
    const workflowData = ref<DashboardWorkflowOverviewResponse | null>(null);
    const kpiSnapshotData = ref<DashboardKpiSnapshotResponse | null>(null);

    const alertsLoading = ref(false);
    const workflowLoading = ref(false);
    const kpiSnapshotLoading = ref(false);

    const alertsError = ref<string | null>(null);
    const workflowError = ref<string | null>(null);
    const kpiSnapshotError = ref<string | null>(null);

    const dashboardLoading = computed(
        () =>
            alertsLoading.value ||
            workflowLoading.value ||
            kpiSnapshotLoading.value,
    );

    const createFilter = (): DashboardFilterState => ({
        warehouseId: warehouseStore.selectedWarehouseId ?? null,
    });

    const createWidgetKey = (widget: string, filter: DashboardFilterState) =>
        [
            "overview",
            widget,
            filter.companyId ?? "current-company",
            filter.warehouseId ?? "all-warehouses",
        ].join(":");

    const loadWidget = async <T>(
        widget: string,
        filter: DashboardFilterState,
        fetcher: () => Promise<T>,
        setData: (data: T) => void,
        setLoading: (loading: boolean) => void,
        setError: (message: string | null) => void,
        options: RefreshDashboardOptions,
    ) => {
        const sequenceScope = `overview:${widget}`;
        const sequence = dashboardRequestCache.nextSequence(sequenceScope);
        setLoading(true);
        setError(null);
        try {
            const result = await dashboardRequestCache.load(
                createWidgetKey(widget, filter),
                fetcher,
                options,
            );
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setData(result.data);
            }
        } catch (err) {
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setError(normalizeErrorMessage(err));
            }
        } finally {
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setLoading(false);
            }
        }
    };

    const refreshDashboard = async (options: RefreshDashboardOptions = {}) => {
        const filter = createFilter();

        await Promise.allSettled([
            loadWidget(
                "alerts",
                filter,
                () => dashboardService.fetchAlerts(filter),
                (res) => (alertsData.value = res),
                (loading) => (alertsLoading.value = loading),
                (message) => (alertsError.value = message),
                options,
            ),
            loadWidget(
                "workflow",
                filter,
                () => dashboardService.fetchWorkflowOverview(filter),
                (res) => (workflowData.value = res),
                (loading) => (workflowLoading.value = loading),
                (message) => (workflowError.value = message),
                options,
            ),
            loadWidget(
                "kpi-snapshot",
                filter,
                () => dashboardService.fetchKpiSnapshot(filter),
                (res) => (kpiSnapshotData.value = res),
                (loading) => (kpiSnapshotLoading.value = loading),
                (message) => (kpiSnapshotError.value = message),
                options,
            ),
        ]);
    };

    if (getCurrentInstance()) {
        onMounted(() => {
            void refreshDashboard();
        });
    }

    useDebouncedWatch(
        () => warehouseStore.selectedWarehouseId,
        () => {
            void refreshDashboard();
        },
    );

    return {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        dashboardLoading,
        refreshDashboard,
        alertsData,
        alertsLoading,
        alertsError,
        workflowData,
        workflowLoading,
        workflowError,
        kpiSnapshotData,
        kpiSnapshotLoading,
        kpiSnapshotError,
        selectedWarehouseId,
        setSelectedWarehouse,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/dashboard/composables/useDashboardI18n.test.ts`
Expected: PASS (1 test)

Also re-run the pre-existing test file to confirm no regression (it never asserts on the fallback string's literal text, only on `error.message` values like `"Alerts down"`, so it should pass unchanged):

Run: `npx vitest run src/views/dashboard/composables/useDashboard.test.ts`
Expected: PASS (4 tests, unchanged).

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/dashboard/composables/useDashboard.ts src/views/dashboard/composables/useDashboardI18n.test.ts
git commit -m "feat: translate useDashboard load-failure fallback via vue-i18n"
```

---

### Task 10: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm run test:unit`
Expected: all tests pass, including every test added in Tasks 1–9, the pre-existing per-component test files updated along the way, and the existing `src/config/i18nKeyParity.test.ts` guard (which now also covers `dashboard.json` automatically).

- [ ] **Step 2: Type-check the whole project**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Manual smoke check — disclosed limitation**

No browser tool is available in this environment (same disclosed limitation the Auth module plan's final review found). If a browser is available at execution time, the equivalent manual check is: run `npm run dev`, open `/dashboard/overview`, confirm the toolbar placeholder/refresh button and all three widget cards (Operational Exceptions, Workflow Position, KPI Control Snapshot) render in Indonesian by default with no console errors about missing i18n keys, open an alert to see the detail drawer, then switch to English via the Profile page's language switcher (added in the Auth plan) and confirm every migrated string switches to its English copy without a reload.

- [ ] **Step 5: Commit (if anything was adjusted during verification)**

```bash
git add -A
git commit -m "chore: verify Dashboard Overview i18n migration"
```

---

## Follow-up (not in this plan)

- KPI (`ExecutiveKpiPage.vue` + components/composables, including `KpiWarehouseComparison.vue` and `KpiSupportingMetrics.vue`) — adds its own `overview`-sibling section (e.g. `kpi`) to `dashboard.json`, plus the shared `common.dashboardTagline` key this plan deliberately did not create.
- Process Performance (`ProcessPerformancePage.vue` + components/composables) — adds a `process` section to `dashboard.json` and consumes the same `common.dashboardTagline` key.
- Monitoring (`MonitoringPage.vue` + components/composables) — adds a `monitoring` section to `dashboard.json` and consumes the same `common.dashboardTagline` key.
- IAM / Users, Master Data, Transactions, Stock Opname, Stock, RFID/Log, Reports, Settings/Profile, and shared atoms/molecules/organisms remain out of scope per the foundation plan's original follow-up list.
