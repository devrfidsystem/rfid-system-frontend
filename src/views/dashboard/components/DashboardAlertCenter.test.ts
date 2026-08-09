import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
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
        const html = await renderToString(app);
        expect(html).toContain("animate-pulse");
    });

    it("renders an empty state when there is no data", async () => {
        const app = createSSRApp(DashboardAlertCenter, {
            loading: false,
            data: null,
        });
        const html = await renderToString(app);
        expect(html).toContain("No open exceptions");
        expect(html).toContain("Selected warehouse has no active operational risk");
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
        expect(html).toContain("Operational Exceptions");
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
        const html = await renderToString(app);
        expect(html).not.toContain("btn_DashboardAlertSeverity_all");
    });
});
