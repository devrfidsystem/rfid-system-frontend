import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionLineItems from "./TransactionLineItems.vue";

const baseProps = {
    lines: [
        {
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
        },
    ],
    productOptions: [{ label: "P1 - Widget", value: "prod-1" }],
    productUomInfo: {},
    locationOptions: [],
    fromLocationOptions: [],
    toLocationOptions: [],
    showSingleWarehouse: false,
    isRelocation: false,
    showDualWarehouse: false,
    showPutawayLocations: false,
    isRegister: false,
    submitting: false,
};

describe("TransactionLineItems", () => {
    it("renders the product attribute summary for a line's selected product", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: { "prod-1": "Color: Red, Size: XL" },
        });
        const html = await renderToString(app);
        expect(html).toContain("Color: Red, Size: XL");
    });

    it("renders nothing extra when the selected product has no attribute summary", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
        });
        const html = await renderToString(app);
        expect(html).not.toContain("txt_TransactionLineItemsAttributes_Row0");
    });

    it("still renders the plain quantity input for non-register transaction lines", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: false,
        });
        const html = await renderToString(app);
        expect(html).toContain("nmf_TransactionLineItemsQty_Row0");
        expect(html).not.toContain("chp_TransactionLineItemsBaseQty_Row0");
    });

    it("shows base and breakdown qty chips for a register line with a configured breakdown unit", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            productUomInfo: {
                "prod-1": {
                    baseUomId: "uom-pcs",
                    baseLabel: "Pcs",
                    unitName: "Box",
                    conversionFactor: 12,
                    breakdownUomId: "carton",
                },
            },
            lines: [
                {
                    productId: "prod-1",
                    qty: "24",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("24 Pcs");
        expect(html).toContain("chp_TransactionLineItemsBreakdownQty_Row0");
        expect(html).toContain("2 Box");
        expect(html).not.toContain("nmf_TransactionLineItemsQty_Row0");
    });

    it("shows only the base qty chip when the product has no breakdown unit configured", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            productUomInfo: {
                "prod-1": {
                    baseUomId: "uom-pcs",
                    baseLabel: "Pcs",
                    unitName: null,
                    conversionFactor: null,
                    breakdownUomId: null,
                },
            },
            lines: [
                {
                    productId: "prod-1",
                    qty: "5",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("5 Pcs");
        expect(html).not.toContain("chp_TransactionLineItemsBreakdownQty_Row0");
    });

    it("prompts for a product before showing any qty chip on a register line", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            lines: [
                {
                    productId: "",
                    qty: "1",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).not.toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("Select a product to set quantity.");
    });
});
