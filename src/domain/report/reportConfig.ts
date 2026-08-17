import type { EntityKey } from "@/model/entities";
import type { ReportColumnDef, ReportKey } from "@/api/feature/dto/report.dto";
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

export type { ReportColumnDef, ReportKey } from "@/api/feature/dto/report.dto";

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
            { key: "inbound_no", label: "Doc No" },
            { key: "inbound_date", label: "Date" },
            { key: "supplier.name", label: "Supplier" },
            { key: "status", label: "Status" },
        ],
        partnerLabel: "Supplier",
        partnerDataset: "suppliers",
        partnerKey: "partnerId",
        warehouseKey: "warehouseId",
        icon: FileBarChart2,
    },
    putaway: {
        entity: "putaway",
        title: "Putaway Report",
        description: "Storage placement tasks after receiving goods.",
        columns: [
            { key: "docNumber", label: "Doc No" },
            { key: "docDate", label: "Date" },
            { key: "warehouse.name", label: "Warehouse" },
            { key: "referenceType", label: "Reference" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: ClipboardCheck,
    },
    outbound: {
        entity: "outbound",
        title: "Outbound Report",
        description: "Shipments and finished goods.",
        columns: [
            { key: "docNo", label: "ID Number" },
            { key: "type", label: "Type" },
            { key: "assignedBy.fullName", label: "Assigned User" },
            { key: "deadlineAt", label: "Deadline" },
            { key: "status", label: "Status" },
        ],
        icon: FileBarChart2,
    },
    "stock-opname": {
        entity: "opname",
        title: "Stock Opname",
        description: "Audit schedules by warehouse.",
        columns: [
            { key: "title", label: "Title" },
            { key: "createdAt", label: "Created At" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: ClipboardCheck,
    },
    register: {
        entity: "register",
        title: "Register",
        description: "Admin task documents created before goods receipt.",
        columns: [
            { key: "docNumber", label: "Doc No" },
            { key: "docDate", label: "Date Issue" },
            { key: "warehouseId", label: "Warehouse" },
            { key: "locationName", label: "Location" },
            { key: "productSummary", label: "Products" },
            { key: "registeredBy.fullName", label: "User" },
            { key: "status", label: "Status" },
        ],
        warehouseKey: "warehouseId",
        icon: FileBarChart2,
    },
    relocation: {
        entity: "relocation",
        title: "Relocation Report",
        description: "Moving inventory between locations.",
        columns: [
            { key: "relocation_no", label: "Doc No" },
            { key: "relocation_date", label: "Date" },
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
            { key: "transfer_no", label: "Doc No" },
            { key: "transfer_date", label: "Date" },
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
            { key: "return_no", label: "Doc No" },
            { key: "return_date", label: "Date" },
            { key: "customer.name", label: "Customer" },
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
            { key: "product.name", label: "Product" },
            { key: "warehouse.name", label: "Warehouse" },
            { key: "location.name", label: "Location" },
            { key: "qty", label: "Quantity" },
        ],
        warehouseKey: "warehouseId",
        icon: BarChart4,
    },
    "stock-period": {
        entity: "stock_period",
        title: "Stock Movement",
        description: "Historical stock movement snapshots.",
        columns: [
            { key: "event_time", label: "Time" },
            { key: "doc_type", label: "Document" },
            { key: "product.name", label: "Product" },
            { key: "warehouse.name", label: "Warehouse" },
            { key: "qtyBefore", label: "Before" },
            { key: "qty", label: "Movement" },
            { key: "qtyAfter", label: "After" },
        ],
        warehouseKey: "warehouseId",
        icon: Clock4,
    },
};

export const unsupportedPartnerDatasets = new Set<EntityKey>();

export const hasPartnerDatasetSupport = (dataset?: EntityKey) =>
    Boolean(dataset && !unsupportedPartnerDatasets.has(dataset));
