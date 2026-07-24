import { createSSRApp, defineComponent } from "vue";
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

import MonitoringPage from "./MonitoringPage.vue";

describe("MonitoringPage", () => {
    const start = vi.fn();
    const stop = vi.fn();

    beforeEach(() => {
        useMonitoringMock.mockReset();
        start.mockReset();
        stop.mockReset();
        useMonitoringMock.mockReturnValue({
            data: { value: null },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
            start,
            stop,
        });
    });

    it("renders the Monitoring page title", async () => {
        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("Monitoring");
    });

    it("renders the error banner when the composable reports an error", async () => {
        useMonitoringMock.mockReturnValue({
            data: { value: null },
            loading: { value: false },
            error: { value: "network down" },
            refresh: vi.fn(),
            start,
            stop,
        });

        const app = createSSRApp(MonitoringPage);
        const html = await renderToString(app);
        expect(html).toContain("network down");
    });

    it("does not throw when rendering with a fully populated monitoring snapshot", async () => {
        useMonitoringMock.mockReturnValue({
            data: {
                value: {
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
                },
            },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
            start,
            stop,
        });

        const app = createSSRApp(MonitoringPage);
        await expect(renderToString(app)).resolves.toContain("Monitoring");
    });
});
