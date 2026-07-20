import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/router", () => ({
    default: {},
}));

const fetchAlertsMock = vi.hoisted(() => vi.fn());
const fetchWorkflowOverviewMock = vi.hoisted(() => vi.fn());
const fetchKpiSnapshotMock = vi.hoisted(() => vi.fn());
const fetchKpiDetailMock = vi.hoisted(() => vi.fn());
const fetchProcessDetailMock = vi.hoisted(() => vi.fn());
const fetchMonitoringMock = vi.hoisted(() => vi.fn());

vi.mock("@/api/feature/dashboard.api", () => ({
    dashboardApi: {
        fetchStockSummary: vi.fn(),
        fetchDocCounts: vi.fn(),
        fetchLowStock: vi.fn(),
        fetchEpcStatus: vi.fn(),
        fetchRecentActivity: vi.fn(),
        fetchAlerts: fetchAlertsMock,
        fetchWorkflowOverview: fetchWorkflowOverviewMock,
        fetchKpiSnapshot: fetchKpiSnapshotMock,
        fetchKpiDetail: fetchKpiDetailMock,
        fetchProcessDetail: fetchProcessDetailMock,
        fetchMonitoring: fetchMonitoringMock,
    },
}));

vi.mock("@/store/auth.store", () => ({
    useAuthStore: () => ({ currentCompanyId: "company-1" }),
}));

import { dashboardService } from "./dashboard.service";

describe("dashboardService", () => {
    beforeEach(() => {
        fetchAlertsMock.mockReset();
        fetchWorkflowOverviewMock.mockReset();
        fetchKpiSnapshotMock.mockReset();
        fetchKpiDetailMock.mockReset();
        fetchProcessDetailMock.mockReset();
        fetchMonitoringMock.mockReset();
    });

    it("fetchAlerts returns the alerts payload", async () => {
        fetchAlertsMock.mockResolvedValue({
            data: { counts: { critical: 1, warning: 0, info: 0 }, alerts: [] },
        });

        const result = await dashboardService.fetchAlerts({
            warehouseId: "wh-1",
        });

        expect(fetchAlertsMock).toHaveBeenCalledWith({
            companyId: "company-1",
            warehouseId: "wh-1",
        });
        expect(result.counts.critical).toBe(1);
    });

    it("fetchWorkflowOverview returns the panels payload", async () => {
        fetchWorkflowOverviewMock.mockResolvedValue({ data: { panels: [] } });

        const result = await dashboardService.fetchWorkflowOverview({
            warehouseId: null,
        });

        expect(result.panels).toEqual([]);
    });

    it("fetchKpiSnapshot returns the cards payload", async () => {
        fetchKpiSnapshotMock.mockResolvedValue({ data: { cards: [] } });

        const result = await dashboardService.fetchKpiSnapshot({
            warehouseId: null,
        });

        expect(result.cards).toEqual([]);
    });

    it("fetchKpiDetail returns the domain detail payload with domain passed through params", async () => {
        fetchKpiDetailMock.mockResolvedValue({
            data: {
                domain: "stockIn",
                label: "Stock In Performance",
                derivedFrom: "Receiving and Putaway",
                score: 83,
                previousScore: 82,
                trendVsPrevious: 1,
                timeline: [],
                warehouseComparison: { top: [], bottom: [] },
                contributors: [],
                supportingMetrics: [],
            },
        });

        const result = await dashboardService.fetchKpiDetail("stockIn", {
            warehouseId: "wh-1",
        });

        expect(fetchKpiDetailMock).toHaveBeenCalledWith("stockIn", {
            companyId: "company-1",
            warehouseId: "wh-1",
        });
        expect(result.label).toBe("Stock In Performance");
    });

    it("fetchProcessDetail returns the activity detail payload with activity and period passed through params", async () => {
        fetchProcessDetailMock.mockResolvedValue({
            data: {
                activity: "receiving",
                domain: "stockIn",
                label: "Receiving",
                cycleTime: { minutes: 36, previousMinutes: 40, trendPct: -10 },
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
        });

        const result = await dashboardService.fetchProcessDetail(
            "receiving",
            "week",
            { warehouseId: "wh-1" },
        );

        expect(fetchProcessDetailMock).toHaveBeenCalledWith(
            "receiving",
            "week",
            { companyId: "company-1", warehouseId: "wh-1" },
        );
        expect(result.label).toBe("Receiving");
    });

    it("fetchMonitoring returns the monitoring snapshot payload", async () => {
        fetchMonitoringMock.mockResolvedValue({
            data: {
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
        });

        const result = await dashboardService.fetchMonitoring({
            warehouseId: "wh-1",
        });

        expect(fetchMonitoringMock).toHaveBeenCalledWith({
            companyId: "company-1",
            warehouseId: "wh-1",
        });
        expect(result.domains.stockIn.health).toBe("nominal");
        expect(result.domains.inventory.health).toBe("critical");
    });
});
