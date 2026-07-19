import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import DashboardAlertCenter from "./DashboardAlertCenter.vue";

describe("DashboardAlertCenter", () => {
    it("renders a skeleton while loading", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: true,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty state when there is no data", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("No alerts");
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
        const html = await renderToString(app);
        expect(html).toContain("Sales Orders waiting Picking exceed threshold");
        expect(html).toContain(
            "Potential shipment delay for 14 outbound Sales Orders",
        );
        expect(html).toContain("Reassign pickers from Zone A to Zone C-4.");
    });
});
