import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useExecutiveKpiMock = vi.hoisted(() => vi.fn());

vi.mock("./composables/useExecutiveKpi", () => ({
    useExecutiveKpi: useExecutiveKpiMock,
}));

const stub = vi.hoisted(
    () => (name: string) => defineComponent({ name, setup: () => () => null }),
);

vi.mock("./components/KpiDomainTabs.vue", () => ({
    default: stub("KpiDomainTabsStub"),
}));
vi.mock("./components/KpiDomainHero.vue", () => ({
    default: stub("KpiDomainHeroStub"),
}));
vi.mock("./components/KpiWarehouseComparison.vue", () => ({
    default: stub("KpiWarehouseComparisonStub"),
}));
vi.mock("./components/KpiContributors.vue", () => ({
    default: stub("KpiContributorsStub"),
}));
vi.mock("./components/KpiSupportingMetrics.vue", () => ({
    default: stub("KpiSupportingMetricsStub"),
}));

import ExecutiveKpiPage from "./ExecutiveKpiPage.vue";

describe("ExecutiveKpiPage", () => {
    beforeEach(() => {
        useExecutiveKpiMock.mockReset();
        useExecutiveKpiMock.mockReturnValue({
            domain: { value: "stockIn" },
            setDomain: vi.fn(),
            data: { value: null },
            loading: { value: false },
            error: { value: null },
            refresh: vi.fn(),
        });
    });

    it("renders the Executive KPI page title", async () => {
        const app = createSSRApp(ExecutiveKpiPage);
        const html = await renderToString(app);
        expect(html).toContain("Executive KPI");
    });
});
