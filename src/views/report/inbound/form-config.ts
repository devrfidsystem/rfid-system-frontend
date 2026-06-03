import { z } from "zod";
import type { FormFieldConfig } from "@/components/form-builder/types";
import type { WarehouseRecord } from "@/model/entities";

export const inboundSchema = z.object({
    reference: z.string().min(1, "Reference required"),
    warehouseId: z.string().min(1, "Warehouse required"),
    expectedDate: z.string().optional(),
    notes: z.string().max(300).optional(),
});

export const createInboundFields = (
    warehouses: WarehouseRecord[],
): FormFieldConfig[] => [
    {
        name: "reference",
        type: "text",
        label: "Reference",
        required: true,
        placeholder: "Incoming PO or ref",
    },
    {
        name: "warehouseId",
        type: "select",
        label: "Warehouse",
        required: true,
        options: warehouses.map((wh) => ({ label: wh.name, value: wh.id })),
        hint: "Destination facility",
    },
    {
        name: "expectedDate",
        type: "date",
        label: "Expected Arrival",
        placeholder: "YYYY-MM-DD",
    },
    {
        name: "notes",
        type: "text",
        label: "Notes",
        hint: "Optional memo for logistics",
        colSpan: 2,
    },
];

export const inboundConfig = {
    schema: inboundSchema,
    fields: (warehouses: WarehouseRecord[]) => createInboundFields(warehouses),
};
