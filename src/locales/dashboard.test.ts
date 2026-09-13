import { describe, expect, test } from "vitest";
import dashboardId from "./id/dashboard.json";
import dashboardEn from "./en/dashboard.json";

describe("dashboard locale namespace", () => {
    test("id namespace defines toolbar and overview copy", () => {
        expect(dashboardId.common.warehouseFilterPlaceholder).toBe(
            "Semua Gudang (Filter)",
        );
        expect(dashboardId.overview.alertCenter.businessImpact).toBe(
            "Dampak Bisnis",
        );
    });

    test("en namespace defines toolbar and overview copy", () => {
        expect(dashboardEn.common.warehouseFilterPlaceholder).toBe(
            "All Warehouses (Filter)",
        );
        expect(dashboardEn.overview.alertCenter.businessImpact).toBe(
            "Business Impact",
        );
    });

    test("id and en namespaces expose the same top-level sections", () => {
        expect(Object.keys(dashboardEn).sort()).toEqual(
            Object.keys(dashboardId).sort(),
        );
    });
});
