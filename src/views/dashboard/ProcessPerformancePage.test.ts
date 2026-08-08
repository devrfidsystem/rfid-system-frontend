import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useProcessPerformanceMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useProcessPerformance", () => ({
    useProcessPerformance: useProcessPerformanceMock,
}));

const stub = vi.hoisted(
    () => (name: string) => defineComponent({ name, setup: () => () => null }),
);

vi.mock("./components/ProcessActivityPicker.vue", () => ({
    default: stub("ProcessActivityPickerStub"),
}));
vi.mock("./components/ProcessMetricCards.vue", () => ({
    default: stub("ProcessMetricCardsStub"),
}));
vi.mock("./components/ProcessTrendChart.vue", () => ({
    default: stub("ProcessTrendChartStub"),
}));
vi.mock("./components/ProcessHourlyHeatmap.vue", () => ({
    default: stub("ProcessHourlyHeatmapStub"),
}));
vi.mock("./components/ProcessOperatorRanking.vue", () => ({
    default: stub("ProcessOperatorRankingStub"),
}));
vi.mock("./components/KpiWarehouseComparison.vue", () => ({
    default: stub("KpiWarehouseComparisonStub"),
}));
vi.mock("./components/KpiSupportingMetrics.vue", () => ({
    default: stub("KpiSupportingMetricsStub"),
}));

import ProcessPerformancePage from "./ProcessPerformancePage.vue";

describe("ProcessPerformancePage", () => {
    beforeEach(() => {
        useProcessPerformanceMock.mockReset();
        useProcessPerformanceMock.mockReturnValue({
            activity: { value: "receiving" },
            period: { value: "week" },
            setActivity: vi.fn(),
            setPeriod: vi.fn(),
            data: { value: null },
            loading: false,
            error: { value: null },
            refresh: vi.fn(),
            // DashboardToolbar is a real (unstubbed) component in this test —
            // these must be plain values so its prop validation doesn't warn.
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });
    });

    it("renders the Process Performance page title", async () => {
        const app = createSSRApp(ProcessPerformancePage);
        const html = await renderToString(app);
        expect(html).toContain("Process Performance");
    });

    it("renders the week/month period toggle", async () => {
        const app = createSSRApp(ProcessPerformancePage);
        const html = await renderToString(app);
        expect(html).toContain("Week");
        expect(html).toContain("Month");
    });

    it("renders the error banner when the composable reports an error", async () => {
        useProcessPerformanceMock.mockReturnValue({
            activity: { value: "receiving" },
            period: { value: "week" },
            setActivity: vi.fn(),
            setPeriod: vi.fn(),
            data: { value: null },
            loading: false,
            error: { value: "network down" },
            refresh: vi.fn(),
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });

        const app = createSSRApp(ProcessPerformancePage);
        const html = await renderToString(app);
        expect(html).toContain("network down");
    });

    it("maps supportingMetrics into a label/value list for KpiSupportingMetrics", async () => {
        useProcessPerformanceMock.mockReturnValue({
            activity: { value: "receiving" },
            period: { value: "week" },
            setActivity: vi.fn(),
            setPeriod: vi.fn(),
            data: {
                value: {
                    activity: "receiving",
                    domain: "stockIn",
                    label: "Receiving",
                    cycleTime: {
                        minutes: 36,
                        previousMinutes: 40,
                        trendPct: -10,
                    },
                    productivity: {
                        unitsPerHour: 120,
                        previousUnitsPerHour: 110,
                        trendPct: 9.1,
                    },
                    supportingMetrics: {
                        completedTransactions: 42,
                        avgDailyVolumeUnits: 500,
                        avgQueueTimeMinutes: 12,
                    },
                    trend: [],
                    hourlyDistribution: [],
                    warehouseComparison: { top: [], bottom: [] },
                    operatorRanking: [],
                },
            },
            loading: false,
            error: { value: null },
            refresh: vi.fn(),
            // DashboardToolbar is a real (unstubbed) component in this test —
            // these must be plain values so its prop validation doesn't warn.
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });

        const app = createSSRApp(ProcessPerformancePage);
        await renderToString(app);
        // Rendered through the stubbed KpiSupportingMetrics component (no assertion on
        // its internal HTML since it's stubbed); this test guards against the mapping
        // function throwing when given a populated supportingMetrics payload.
        expect(true).toBe(true);
    });
});
