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

export type MasterFormFieldType =
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "date"
    | "file";

export interface MasterFormField {
    key: string;
    label: string;
    type?: MasterFormFieldType;
    optionsKey?: string;
    options?: Array<{ label: string; value: string }>;
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
    "attributes",
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

const resolveRelationLabel = (relation?: Record<string, unknown>) => {
    if (relation) {
        const name = relation["name"];
        if (typeof name === "string" && name) {
            return name;
        }
    }
    return "";
};

const getProductUomLabel = (row: MasterRecord) =>
    resolveRelationLabel(row.uom as Record<string, unknown> | undefined);

const getProductCategoryLabel = (row: MasterRecord) =>
    resolveRelationLabel(row.category as Record<string, unknown> | undefined);

const getLocationWarehouseLabel = (row: MasterRecord) =>
    resolveRelationLabel(row.warehouse as Record<string, unknown> | undefined);

const getLocationParentLabel = (row: MasterRecord) =>
    resolveRelationLabel(row.parent as Record<string, unknown> | undefined);

const getProductAttributeSummary = (row: MasterRecord) => {
    const values = row.attributeValues;
    if (!Array.isArray(values) || !values.length) return 0;
    return values
        .map((item) => item.attribute?.name ?? item.attributeId)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
};

const getProductUomBreakdown = (row: MasterRecord) => {
    const parts = [row.unitType, row.unitName]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean);
    const conversion = row.conversionFactor;
    if (typeof conversion === "number" && Number.isFinite(conversion)) {
        parts.push(`x ${conversion}`);
    }
    return (
        parts.join(" ") ||
        resolveRelationLabel(row.uom as Record<string, unknown> | undefined)
    );
};

export const attributeTypeOptions: Array<{ label: string; value: string }> = [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Date", value: "date" },
    { label: "List", value: "list" },
];

export const masterEntities: Partial<
    Record<MasterEntityConfig["entity"], MasterEntityConfig>
> = {
    attributes: {
        entity: "attributes",
        title: "Attributes",
        description: "Metadata that describes SKU characteristics.",
        columns: [
            { key: "name", label: "Name" },
            { key: "type", label: "Type" },
            {
                key: "items",
                label: "List Items",
                accessor: (row) =>
                    Array.isArray(row.items) ? row.items.length : 0,
            },
            { key: "createdAt", label: "Created At" },
        ],
        formFields: [
            { key: "name", label: "Name" },
            {
                key: "type",
                label: "Type",
                type: "select",
                options: attributeTypeOptions,
            },
            {
                key: "items",
                label: "List Items",
                type: "textarea",
                placeholder: "Enter one item per line or separate by comma",
            },
        ],
        icon: Layers,
        supported: true,
    },
    customers: {
        entity: "customers",
        title: "Customer Master",
        description: "Profiles and SLAs for customers.",
        columns: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "phone", label: "Phone" },
            { key: "description", label: "Description" },
        ],
        formFields: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "phone", label: "Phone" },
            {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Optional description",
            },
        ],
        icon: Users,
        supported: true,
    },
    suppliers: {
        entity: "suppliers",
        title: "Supplier Master",
        description: "Approved source partners.",
        columns: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "phone", label: "Phone" },
            { key: "description", label: "Description" },
        ],
        formFields: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "phone", label: "Phone" },
            {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Optional description",
            },
        ],
        icon: Truck,
        supported: true,
    },
    warehouses: {
        entity: "warehouses",
        title: "Warehouse Master",
        description: "Manage facility definitions.",
        columns: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "description", label: "Description" },
        ],
        formFields: [
            { key: "name", label: "Name" },
            { key: "address", label: "Address", type: "textarea" },
            {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Optional description",
            },
        ],
        icon: Warehouse,
        supported: true,
    },
    locations: {
        entity: "locations",
        title: "Location Master",
        description: "Map rows/columns to semantic sections.",
        columns: [
            {
                key: "warehouseId",
                label: "Warehouse",
                accessor: getLocationWarehouseLabel,
            },
            { key: "name", label: "Name" },
            {
                key: "parentId",
                label: "Parent Location",
                accessor: getLocationParentLabel,
            },
            { key: "path", label: "Path" },
        ],
        formFields: [
            {
                key: "warehouseId",
                label: "Warehouse",
                type: "select",
                optionsKey: "warehouseId",
                placeholder: "Select warehouse",
            },
            { key: "name", label: "Name" },
            {
                key: "parentId",
                label: "Parent Location",
                type: "select",
                optionsKey: "parentId",
                placeholder: "Select parent location (optional)",
            },
        ],
        icon: MapPin,
        supported: true,
    },
    uoms: {
        entity: "uoms",
        title: "Unit of Measure",
        description: "Standardize packaging units.",
        columns: [
            { key: "name", label: "Name" },
            { key: "symbol", label: "Symbol" },
        ],
        formFields: [
            { key: "name", label: "Name" },
            { key: "symbol", label: "Symbol" },
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
            { key: "code", label: "SKU / Product Code" },
            { key: "name", label: "Name" },
            { key: "uom", label: "UOM", accessor: getProductUomLabel },
            {
                key: "category",
                label: "Category",
                accessor: getProductCategoryLabel,
            },
            {
                key: "attributeValues",
                label: "Attributes",
                accessor: getProductAttributeSummary,
            },
            { key: "qtyMin", label: "Safety Stock" },
            { key: "qtyMax", label: "Maximum Stock" },
            {
                key: "uomBreakdown",
                label: "UOM",
                accessor: getProductUomBreakdown,
            },
            { key: "createdAt", label: "Created At" },
        ],
        formFields: [
            { key: "code", label: "SKU / Product Code" },
            { key: "name", label: "Name" },
            {
                key: "categoryId",
                label: "Product Category",
                type: "select",
                optionsKey: "categoryId",
                placeholder: "Select category (optional)",
            },
            {
                key: "uomId",
                label: "Unit of Measure",
                type: "select",
                optionsKey: "uomId",
                placeholder: "Select UOM",
            },
            {
                key: "unitType",
                label: "Unit Type",
                placeholder: "e.g. pack, case, carton",
            },
            {
                key: "unitName",
                label: "Unit Name",
                placeholder: "Breakdown unit name",
            },
            {
                key: "conversionFactor",
                label: "Conversion Factor",
                placeholder: "How many breakdown units per UOM",
            },
            {
                key: "imageFile",
                label: "Product Image",
                type: "file",
            },
        ],
        icon: Box,
        supported: true,
    },
};
