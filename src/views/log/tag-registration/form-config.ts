import { z } from "zod";
import type { FormFieldConfig } from "@/components/form-builder/types";
import type {
    ProductRecord,
    LocationRecord,
    WarehouseRecord,
} from "@/model/entities";

export const tagRegistrationSchema = z.object({
    epc: z.string().min(1, "EPC is required"),
    productId: z.string().min(1, "Product is required"),
    note: z.string().max(250).optional(),
});

export const createTagRegistrationFields = (options: {
    products: ProductRecord[];
    warehouses: WarehouseRecord[];
    locations: LocationRecord[];
}): FormFieldConfig[] => [
    {
        name: "epc",
        type: "text",
        label: "EPC",
        placeholder: "Scan or enter EPC",
        required: true,
    },
    {
        name: "productId",
        type: "select",
        label: "Product",
        required: true,
        options: options.products.map((product) => ({
            label: product.name,
            value: product.id,
        })),
        hint: "Select the product tied to this EPC",
    },
    {
        name: "note",
        type: "text",
        label: "Note",
        placeholder: "Short memo (optional)",
        colSpan: 2,
        visibleIf: (values) => Boolean(values.productId),
    },
];
