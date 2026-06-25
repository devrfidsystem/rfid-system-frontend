import type { EntityKey } from "@/model/entities";
import type { Component } from "vue";
import type { MasterRecord } from "./types";
import {
    Box,
    Layers,
    MapPin,
    Ruler,
    Truck,
    Users,
    Warehouse,
} from "lucide-vue-next";

type MasterColumnAccessor = (row: MasterRecord) => string | number | null;

export type MasterColumnDef = {
    key: string;
    label: string;
    accessor?: MasterColumnAccessor;
};

export type MasterFormFieldType = "text" | "textarea" | "select";

export interface MasterFormField {
    key: string;
    label: string;
    type?: MasterFormFieldType;
    optionsKey?: string;
    placeholder?: string;
}

export interface MasterEntityConfig {
    entity: EntityKey;
    title: string;
    description: string;
    columns: MasterColumnDef[];
    formFields: MasterFormField[];
    icon: Component;
    supported?: boolean;
    unsupportedMessage?: string;
}

export const supportedMasterEntities = new Set<EntityKey>([
    "warehouses",
    "locations",
    "products",
    "customers",
    "suppliers",
    "uoms",
    "product-categories",
]);

export const masterPathSegmentToEntity: Record<string, EntityKey> = {
    attribute: "attributes",
    attributes: "attributes",
    customer: "customers",
    customers: "customers",
    supplier: "suppliers",
    suppliers: "suppliers",
    warehouse: "warehouses",
    warehouses: "warehouses",
    location: "locations",
    locations: "locations",
    uom: "uoms",
    uoms: "uoms",
    "product-category": "product-categories",
    "product-categories": "product-categories",
    product: "products",
    products: "products",
};

export const isSupportedMasterPath = (path?: string) => {
    if (!path) return false;
    const [, , segment] = path.split("/");
    if (!segment) return false;
    const entity = masterPathSegmentToEntity[segment];
    if (!entity) return false;
    return supportedMasterEntities.has(entity);
};

const resolveRelationLabel = (
    relation?: Record<string, unknown>,
    fallback?: unknown,
) => {
    if (relation) {
        const symbol = relation["symbol"];
        if (typeof symbol === "string" && symbol) {
            return symbol;
        }
        const name = relation["name"];
        if (typeof name === "string" && name) {
            return name;
        }
    }
    if (fallback) {
        return String(fallback);
    }
    return "";
};

const getProductUomLabel = (row: MasterRecord) =>
    resolveRelationLabel(
        row.uom as Record<string, unknown> | undefined,
        row.uomId,
    );

const getProductCategoryLabel = (row: MasterRecord) =>
    resolveRelationLabel(
        row.category as Record<string, unknown> | undefined,
        row.categoryId,
    );

export const masterEntities: Partial<
    Record<MasterEntityConfig["entity"], MasterEntityConfig>
> = {
    attributes: {
        entity: "attributes",
        title: "Attributes",
        description: "Metadata that describes SKU characteristics.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "group", label: "Group" },
            { key: "createdAt", label: "Created At" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "group", label: "Group" },
            { key: "description", label: "Description", type: "textarea" },
        ],
        icon: Layers,
        supported: false,
        unsupportedMessage:
            "Attributes belum tersedia karena endpoint /attributes belum disediakan oleh backend.",
    },
    customers: {
        entity: "customers",
        title: "Customer Master",
        description: "Profiles and SLAs for customers.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "isActive", label: "Active" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address", type: "textarea" },
        ],
        icon: Users,
        supported: true,
    },
    suppliers: {
        entity: "suppliers",
        title: "Supplier Master",
        description: "Approved source partners.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "isActive", label: "Active" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address", type: "textarea" },
        ],
        icon: Truck,
        supported: true,
    },
    warehouses: {
        entity: "warehouses",
        title: "Warehouse Master",
        description: "Manage facility definitions.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "address", label: "Address", type: "textarea" },
        ],
        icon: Warehouse,
        supported: true,
    },
    locations: {
        entity: "locations",
        title: "Location Master",
        description: "Map rows/columns to semantic sections.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "path", label: "Path" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
        ],
        icon: MapPin,
        supported: true,
    },
    uoms: {
        entity: "uoms",
        title: "Unit of Measure",
        description: "Standardize packaging units.",
        columns: [
            { key: "symbol", label: "Symbol" },
            { key: "name", label: "Name" },
        ],
        formFields: [
            { key: "symbol", label: "Symbol" },
            { key: "name", label: "Name" },
        ],
        icon: Ruler,
        supported: true,
    },
    "product-categories": {
        entity: "product-categories",
        title: "Product Categories",
        description: "Organize goods into structured categories.",
        columns: [
            { key: "name", label: "Name" },
            { key: "createdAt", label: "Created At" },
        ],
        formFields: [{ key: "name", label: "Name" }],
        icon: Layers,
        supported: true,
    },
    products: {
        entity: "products",
        title: "Product Master",
        description: "Catalog of RFID-enabled products.",
        columns: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "uom", label: "UOM", accessor: getProductUomLabel },
            {
                key: "category",
                label: "Category",
                accessor: getProductCategoryLabel,
            },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created At" },
        ],
        formFields: [
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            {
                key: "uomId",
                label: "Unit of Measure",
                type: "select",
                optionsKey: "uomId",
                placeholder: "Select UOM",
            },
            {
                key: "categoryId",
                label: "Product Category",
                type: "select",
                optionsKey: "categoryId",
                placeholder: "Select category (optional)",
            },
            {
                key: "supplierId",
                label: "Supplier",
                type: "select",
                optionsKey: "supplierId",
                placeholder: "Select supplier (optional)",
            },
            {
                key: "customerId",
                label: "Customer",
                type: "select",
                optionsKey: "customerId",
                placeholder: "Select customer (optional)",
            },
            {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Enter product description (optional)",
            },
        ],
        icon: Box,
        supported: true,
    },
};
