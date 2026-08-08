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
    locationOptions: [],
    fromLocationOptions: [],
    toLocationOptions: [],
    showSingleWarehouse: false,
    isRelocation: false,
    showDualWarehouse: false,
    showPutawayLocations: false,
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
});
