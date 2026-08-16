import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, Fragment, h } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionLineItems from "./TransactionLineItems.vue";
import transactionLineItemsSource from "./TransactionLineItems.vue?raw";

// Drawer touches `document` directly (unguarded for SSR) and this repo's
// Vitest environment is plain Node (no jsdom) — stub it out here the same
// way page-level tests stub Drawer/Modal-based children (see
// DashboardAlertCenter.test.ts).
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
            (props, { slots }) =>
            () =>
                h(Fragment, [
                    slots.default?.(),
                    // Mirror Drawer.vue's real gating: the footer (and its
                    // Submit button) only renders while the drawer is open.
                    props.modelValue ? slots.footer?.() : undefined,
                ]),
    }),
}));

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

    it("renders an Edit Qty button next to the chips for a register line with a product selected", async () => {
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
        });
        const html = await renderToString(app);
        expect(html).toContain("btn_TransactionLineItemsEditQty_Row0");
        expect(html).toContain("Edit Qty");
    });

    it("does not render the Edit Qty modal contents by default (closed state)", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
        });
        const html = await renderToString(app);
        expect(html).not.toContain("nmf_TransactionLineItemsEditQtyBase");
        expect(html).not.toContain("nmf_TransactionLineItemsEditQtyBreakdown");
        expect(html).not.toContain("btn_TransactionLineItemsEditQtySubmit");
    });

    it("keeps the original xl:w-32 qty column width for non-register lines", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: false,
        });
        const html = await renderToString(app);
        expect(html).toContain("xl:w-32");
        expect(html).not.toContain("xl:w-48");
    });

    it("widens the qty column to xl:w-48 for register lines (to fit chips + Edit Qty button)", async () => {
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
        });
        const html = await renderToString(app);
        expect(html).toContain("xl:w-48");
        expect(html).not.toContain("xl:w-32");
    });
});

describe("TransactionLineItems Edit Qty modal wiring (source)", () => {
    it("uses the Drawer molecule for the Edit Qty modal", () => {
        expect(transactionLineItemsSource).toContain(
            'import Drawer from "@/components/organisms/Drawer.vue"',
        );
        expect(transactionLineItemsSource).toContain("<Drawer");
        expect(transactionLineItemsSource).toContain(
            'object-id="drw_TransactionLineItemsEditQty"',
        );
    });

    it("opens the modal for the clicked line's index via openEditQty", () => {
        expect(transactionLineItemsSource).toContain(
            '@click="openEditQty(idx)"',
        );
        expect(transactionLineItemsSource).toContain(
            "const editQtyLineIndex = ref<number | null>(null);",
        );
    });

    it("recalculates the other tier live via convertUomQty on each input", () => {
        expect(transactionLineItemsSource).toContain("onEditBaseInput");
        expect(transactionLineItemsSource).toContain("onEditBreakdownInput");
        expect(transactionLineItemsSource).toContain(
            'convertUomQty(n, "base", factor)',
        );
        expect(transactionLineItemsSource).toContain(
            'convertUomQty(n, "breakdown", factor)',
        );
    });

    it("commits both the base qty and the entered-tier fields back to the line on submit", () => {
        expect(transactionLineItemsSource).toContain("const submitEditQty");
        expect(transactionLineItemsSource).toContain(
            "line.qty = editQtyBaseInput.value",
        );
        expect(transactionLineItemsSource).toContain("line.enteredUomId");
        expect(transactionLineItemsSource).toContain("line.enteredQty");
    });

    it("resets enteredUomId/enteredQty when the line's product selection changes", () => {
        // Product changes must clear any stale entered-tier data from a
        // previous product on the same line (e.g. a breakdown UOM that no
        // longer applies) — otherwise wrong audit-trail data ships silently.
        expect(transactionLineItemsSource).toContain("const onProductChange");
        expect(transactionLineItemsSource).toContain('line.enteredUomId = ""');
        expect(transactionLineItemsSource).toContain('line.enteredQty = ""');
        expect(transactionLineItemsSource).toContain(
            "(val) => onProductChange(line, val)",
        );
    });

    it("rounds the breakdown-to-base conversion to a whole number (base UOM is a whole-unit count)", () => {
        // Editing the breakdown tier (e.g. "0.58" Box) must not write a
        // fractional piece count like 6.96 back into the base qty field.
        expect(transactionLineItemsSource).toContain(
            'Math.round(convertUomQty(n, "breakdown", factor))',
        );
        // The base -> breakdown direction is unaffected (display-only,
        // fractional breakdown values like "1.5 Box" are expected there).
        expect(transactionLineItemsSource).toContain(
            'convertUomQty(n, "base", factor)',
        );
        expect(transactionLineItemsSource).not.toContain(
            'Math.round(convertUomQty(n, "base", factor))',
        );
    });
});
