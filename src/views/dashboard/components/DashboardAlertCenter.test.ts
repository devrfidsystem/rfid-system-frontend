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

    // `severityFilter` is internal component state (defaults to "all") with
    // no prop to preset it, and this repo's Node-only SSR harness
    // (renderToString, no jsdom/@vue/test-utils — see ExecutiveKpiPage.test.ts)
    // renders a component in a single synchronous pass with no reactivity
    // step in between, so the SegmentedControl click that would flip
    // `severityFilter` away from "all" and reveal the `emptyFiltered` <div>
    // can't be simulated here. What IS directly verifiable, with the same
    // real (non-mocked) `i18n` instance and the same two calls the template
    // now makes, is that the interpolation resolves to the translated label
    // used on the filter tabs rather than leaking the raw internal value
    // ("critical"/"warning"/"info") into the sentence.
    it("resolves emptyFiltered's {severity} placeholder to the translated filter label, not the raw value", () => {
        const cases: Array<{
            locale: "id" | "en";
            severity: "all" | "critical" | "warning" | "info";
            expected: string;
        }> = [
            {
                locale: "id",
                severity: "critical",
                expected: "Tidak ada pengecualian Kritis pada tampilan ini.",
            },
            {
                locale: "id",
                severity: "warning",
                expected:
                    "Tidak ada pengecualian Peringatan pada tampilan ini.",
            },
            {
                locale: "id",
                severity: "info",
                expected: "Tidak ada pengecualian Info pada tampilan ini.",
            },
            {
                locale: "en",
                severity: "critical",
                expected: "No Critical exceptions in the current view.",
            },
            {
                locale: "en",
                severity: "warning",
                expected: "No Warning exceptions in the current view.",
            },
            {
                locale: "en",
                severity: "info",
                expected: "No Info exceptions in the current view.",
            },
        ];

        const originalLocale = i18n.global.locale.value;
        try {
            for (const { locale, severity, expected } of cases) {
                i18n.global.locale.value = locale;

                const message = i18n.global.t(
                    "dashboard.overview.alertCenter.emptyFiltered",
                    {
                        severity: i18n.global.t(
                            `dashboard.overview.alertCenter.filters.${severity}`,
                        ),
                    },
                );

                expect(message).toBe(expected);
                expect(message).not.toContain(severity);
            }
        } finally {
            i18n.global.locale.value = originalLocale;
        }
    });
});
