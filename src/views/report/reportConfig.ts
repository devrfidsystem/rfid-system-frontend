import type { EntityKey } from "@/model/entities";
import type { Component } from "vue";
import {
    FileBarChart2,
    ClipboardCheck,
    ArrowUpRight,
    Repeat,
    Activity,
    Clock4,
    BarChart4,
} from "lucide-vue-next";

export type ReportKey =
    | "inbound"
    | "outbound"
    | "stock-opname"
    | "relocation"
    | "transfer"
    | "return"
    | "current-stock"
    | "stock-period"
    | "opname-variance";

export interface ReportColumnDef {
    key: string;
    label: string;
}

export interface ReportConfig {
    entity: EntityKey;
    title: string;
    description: string;
    columns: ReportColumnDef[];
    partnerLabel?: string;
    partnerDataset?: EntityKey;
    partnerKey?: string;
    warehouseKey?: string;
    icon?: Component;
}

export const reportConfigs: Record<ReportKey, ReportConfig> = {
    inbound: {
        entity: "inbound",
        title: "Inbound Report",
        description: "Recent receipts coming into each hub.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "date", label: "Date" },
            { key: "partnerId", label: "Supplier" },
            { key: "status", label: "Status" },
        ],
        partnerLabel: "Supplier",
        partnerDataset: "suppliers",
        partnerKey: "partnerId",
        warehouseKey: "warehouseId",
        icon: FileBarChart2,
    },
    outbound: {
        entity: "outbound",
        title: "Outbound Report",
        description: "Shipments and finished goods.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "date", label: "Date" },
            { key: "partnerId", label: "Customer" },
            { key: "status", label: "Status" },
        ],
        partnerLabel: "Customer",
        partnerDataset: "customers",
        partnerKey: "partnerId",
        warehouseKey: "warehouseId",
        icon: FileBarChart2,
    },
    "stock-opname": {
        entity: "opname",
        title: "Stock Opname",
        description: "Audit schedules by warehouse.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "scheduledAt", label: "Scheduled" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: ClipboardCheck,
    },
    relocation: {
        entity: "relocation",
        title: "Relocation Report",
        description: "Moving inventory between locations.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "date", label: "Date" },
            { key: "sourceLocationId", label: "Source" },
            { key: "destinationLocationId", label: "Destination" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: ArrowUpRight,
    },
    transfer: {
        entity: "transfer",
        title: "Transfer Report",
        description: "Inter-warehouse movements.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "date", label: "Date" },
            { key: "sourceWarehouseId", label: "From" },
            { key: "destinationWarehouseId", label: "To" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: Repeat,
    },
    return: {
        entity: "return",
        title: "Return Report",
        description: "Reverse logistics movements.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "date", label: "Date" },
            { key: "customerId", label: "Customer" },
            { key: "productId", label: "Product" },
            { key: "status", label: "Status" },
        ],
        partnerLabel: "Customer",
        partnerDataset: "customers",
        partnerKey: "customerId",
        warehouseKey: "warehouseId",
        icon: Activity,
    },
    "current-stock": {
        entity: "stock_balance",
        title: "Stock Balance Report",
        description: "Live location balances from /reports/stock-balance.",
        columns: [
            { key: "productId", label: "Product" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "locationPath", label: "Location" },
            { key: "quantity", label: "Quantity" },
        ],
        warehouseKey: "warehouseId",
        icon: BarChart4,
    },
    "stock-period": {
        entity: "stock_period",
        title: "Stock Movement",
        description: "Historical stock movement snapshots.",
        columns: [
            { key: "period", label: "Period" },
            { key: "productId", label: "Product" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "quantity", label: "Quantity" },
        ],
        warehouseKey: "warehouseId",
        icon: Clock4,
    },
    "opname-variance": {
        entity: "opname-variance" as EntityKey,
        title: "Opname Variance",
        description: "Stock variance discrepancies from opname execution.",
        columns: [
            { key: "docNo", label: "Doc No" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "productId", label: "Product" },
            { key: "expectedQty", label: "Expected" },
            { key: "actualQty", label: "Actual" },
            { key: "variance", label: "Variance" },
        ],
        warehouseKey: "warehouseId",
        icon: ClipboardCheck,
    },
};

export const unsupportedPartnerDatasets = new Set<EntityKey>();

export const hasPartnerDatasetSupport = (dataset?: EntityKey) =>
    Boolean(dataset && !unsupportedPartnerDatasets.has(dataset));
