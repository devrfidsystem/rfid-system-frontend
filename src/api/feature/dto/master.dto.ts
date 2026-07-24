import type {
    AttributeRecord,
    CustomerRecord,
    LocationRecord,
    ProductRecord,
    ProductCategoryRecord,
    SupplierRecord,
    UomRecord,
    WarehouseRecord,
} from "@/model/entities";

export type MasterEntityKey =
    | "attributes"
    | "warehouses"
    | "locations"
    | "products"
    | "customers"
    | "suppliers"
    | "uoms"
    | "product-categories";

export interface MasterListParams {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    companyId?: string;
    categoryId?: string;
    uomId?: string;
    type?: string;
}

export interface MasterListResponse<T> {
    items: T[];
}

export type CreateWarehousePayload = {
    companyId: string;
    code: string;
    name: string;
    address?: string;
    description?: string;
};

export type UpdateWarehousePayload = {
    name?: string;
    address?: string;
    description?: string;
    isActive?: boolean;
};

export interface CreateLocationPayload {
    companyId: string;
    warehouseId: string;
    parentId?: string;
    code: string;
    name: string;
}

export type UpdateLocationPayload = {
    name?: string;
};

export interface ProductAttributeValuePayload {
    attributeId: string;
    attributeItemId?: string;
    valueText?: string;
    valueNumber?: number;
    valueDate?: string;
}

export const ATTRIBUTE_TYPES = ["text", "number", "date", "list"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export interface AttributeItemPayload {
    value: string;
    label: string;
}

export interface CreateAttributePayload {
    companyId: string;
    name: string;
    type: AttributeType;
    items?: AttributeItemPayload[];
}

export type UpdateAttributePayload = Partial<
    Omit<CreateAttributePayload, "companyId">
>;

export type ProductTrackingMode = "bulk" | "serial";

export interface CreateProductPayload {
    companyId: string;
    categoryId?: string;
    uomId: string;
    code: string;
    name: string;
    description?: string;
    barcode?: string;
    supplierId?: string;
    customerId?: string;
    trackingMode?: ProductTrackingMode;
    rfidRequired?: boolean;
    qtyMin?: number;
    qtyMax?: number;
    unitType?: string;
    unitName?: string;
    conversionFactor?: number;
    imageUrl?: string;
    attributeValues?: ProductAttributeValuePayload[];
}

export type UpdateProductPayload = Partial<
    Omit<CreateProductPayload, "companyId" | "code">
>;

export interface CreateCustomerPayload {
    companyId: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}

export type UpdateCustomerPayload = Partial<
    Omit<CreateCustomerPayload, "companyId">
>;

export interface CreateSupplierPayload {
    companyId: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}

export type UpdateSupplierPayload = Partial<
    Omit<CreateSupplierPayload, "companyId">
>;

export interface CreateUomPayload {
    companyId: string;
    name: string;
    symbol: string;
    description?: string;
}

export type UpdateUomPayload = Partial<Omit<CreateUomPayload, "companyId">>;

export interface CreateProductCategoryPayload {
    companyId: string;
    name: string;
    description?: string;
}

export type UpdateProductCategoryPayload = Partial<
    Omit<CreateProductCategoryPayload, "companyId">
>;

export type MasterCreatePayloads = {
    attributes: CreateAttributePayload;
    warehouses: CreateWarehousePayload;
    locations: CreateLocationPayload;
    products: CreateProductPayload;
    customers: CreateCustomerPayload;
    suppliers: CreateSupplierPayload;
    uoms: CreateUomPayload;
    "product-categories": CreateProductCategoryPayload;
};

export type MasterUpdatePayloads = {
    attributes: UpdateAttributePayload;
    warehouses: UpdateWarehousePayload;
    locations: UpdateLocationPayload;
    products: UpdateProductPayload;
    customers: UpdateCustomerPayload;
    suppliers: UpdateSupplierPayload;
    uoms: UpdateUomPayload;
    "product-categories": UpdateProductCategoryPayload;
};

export type MasterRecords = {
    attributes: AttributeRecord;
    warehouses: WarehouseRecord;
    locations: LocationRecord;
    products: ProductRecord;
    customers: CustomerRecord;
    suppliers: SupplierRecord;
    uoms: UomRecord;
    "product-categories": ProductCategoryRecord;
};

export type MasterRemovableEntity =
    | "attributes"
    | "warehouses"
    | "locations"
    | "products"
    | "customers"
    | "suppliers"
    | "uoms"
    | "product-categories";
