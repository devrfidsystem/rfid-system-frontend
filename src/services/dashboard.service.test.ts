import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/router", () => ({
    default: {},
}));

const fetchAlertsMock = vi.hoisted(() => vi.fn());
const fetchWorkflowOverviewMock = vi.hoisted(() => vi.fn());
const fetchKpiSnapshotMock = vi.hoisted(() => vi.fn());
const fetchKpiDetailMock = vi.hoisted(() => vi.fn());

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
});
