import type {
    CustomerRecord,
    LocationRecord,
    ProductRecord,
    ProductCategoryRecord,
    SupplierRecord,
    UomRecord,
    WarehouseRecord,
} from "@/model/entities";

export type MasterEntityKey =
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
}

export interface MasterListResponse<T> {
    items: T[];
}

export type CreateWarehousePayload = Pick<
    WarehouseRecord,
    "code" | "name" | "region" | "manager"
>;
export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface CreateLocationPayload {
    warehouseId: string;
    path: string;
    rowNo?: number;
    colNo?: number;
    section?: string;
}

export type UpdateLocationPayload = Partial<CreateLocationPayload>;

export interface CreateProductPayload {
    companyId: string;
    code: string;
    name: string;
    uomId: string;
    categoryId?: string;
    description?: string;
    status?: string;
}

export type UpdateProductPayload = Partial<
    Omit<CreateProductPayload, "companyId">
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
    warehouses: CreateWarehousePayload;
    locations: CreateLocationPayload;
    products: CreateProductPayload;
    customers: CreateCustomerPayload;
    suppliers: CreateSupplierPayload;
    uoms: CreateUomPayload;
    "product-categories": CreateProductCategoryPayload;
};

export type MasterUpdatePayloads = {
    warehouses: UpdateWarehousePayload;
    locations: UpdateLocationPayload;
    products: UpdateProductPayload;
    customers: UpdateCustomerPayload;
    suppliers: UpdateSupplierPayload;
    uoms: UpdateUomPayload;
    "product-categories": UpdateProductCategoryPayload;
};

export type MasterRecords = {
    warehouses: WarehouseRecord;
    locations: LocationRecord;
    products: ProductRecord;
    customers: CustomerRecord;
    suppliers: SupplierRecord;
    uoms: UomRecord;
    "product-categories": ProductCategoryRecord;
};

export type MasterRemovableEntity =
    | "warehouses"
    | "locations"
    | "products"
    | "customers"
    | "suppliers"
    | "uoms"
    | "product-categories";
