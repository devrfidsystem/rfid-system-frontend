import { createSSRApp, defineComponent, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useMonitoringMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useMonitoring", () => ({
    useMonitoring: useMonitoringMock,
}));

const stub = vi.hoisted(
    () => (name: string) => defineComponent({ name, setup: () => () => null }),
);

vi.mock("./components/MonitoringDomainCard.vue", () => ({
    default: stub("MonitoringDomainCardStub"),
}));
vi.mock("./components/MonitoringLiveFeed.vue", () => ({
    default: stub("MonitoringLiveFeedStub"),
}));
vi.mock("./components/MonitoringExceptionFeed.vue", () => ({
    default: stub("MonitoringExceptionFeedStub"),
}));

import MonitoringPage from "./MonitoringPage.vue";

describe("MonitoringPage", () => {
    const start = vi.fn();
    const stop = vi.fn();

    beforeEach(() => {
        useMonitoringMock.mockReset();
        start.mockReset();
        stop.mockReset();
        useMonitoringMock.mockReturnValue({
            data: ref(null),
            loading: false,
            error: ref(null),
            refresh: vi.fn(),
            start,
            stop,
            // DashboardToolbar is a real (unstubbed) component in this test —
            // unlike the other mocked fields above, these must be plain
            // values so its prop validation doesn't warn.
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });
    });

    it("renders the Monitoring page title", async () => {
        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("Monitoring");
    });

    it("renders without InlineAlert prop warnings", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        try {
            const app = createSSRApp(MonitoringPage);
            await renderToString(app);

            expect(warnSpy).not.toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("uses a command-layout grid for live transactions and exception feed", async () => {
        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);

        expect(html).toContain(
            "lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]",
        );
    });

    it("renders the error banner when the composable reports an error", async () => {
        useMonitoringMock.mockReturnValue({
            data: ref(null),
            loading: false,
            error: ref("network down"),
            refresh: vi.fn(),
            start,
            stop,
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });

        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("network down");
    });

    it("does not throw when rendering with a fully populated monitoring snapshot", async () => {
        useMonitoringMock.mockReturnValue({
            data: ref({
                domains: {
                    stockIn: {
                        label: "Stock In",
                        health: "nominal",
                        queueCount: 4,
                        completedTodayCount: 12,
                        exceptionsCount: 0,
                        queueTasks: [],
                    },
                    stockOut: {
                        label: "Stock Out",
                        health: "warning",
                        queueCount: 2,
                        completedTodayCount: 6,
                        exceptionsCount: 2,
                        queueTasks: [],
                    },
                    inventory: {
                        label: "Inventory",
                        health: "critical",
                        queueCount: 1,
                        completedTodayCount: 3,
                        exceptionsCount: 5,
                        queueTasks: [],
                    },
                },
                liveTransactions: [],
            }),
            loading: false,
            error: ref(null),
            refresh: vi.fn(),
            start,
            stop,
            warehouseOptions: [],
            selectedWarehouseId: null,
            setSelectedWarehouse: vi.fn(),
        });

        const app = createSSRApp(MonitoringPage);
        await expect(renderToString(app)).resolves.toContain("Monitoring");
    });
});
