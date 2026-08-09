import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
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
