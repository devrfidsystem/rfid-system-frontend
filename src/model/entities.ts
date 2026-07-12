export interface AttributeRecord {
    id: string;
    name: string;
    type: string;
    createdAt?: string;
    items?: Array<{
        id: string;
        value: string;
        label: string;
    }>;
}

export interface CategoryRecord {
    id: string;
    code: string;
    name: string;
    description: string;
    createdAt: string;
}

export interface CustomerRecord {
    id: string;
    companyId: string;
    code: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    description?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface SupplierRecord {
    id: string;
    companyId: string;
    code: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    description?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface WarehouseRecord {
    id: string;
    companyId: string;
    code: string;
    name: string;
    address?: string | null;
    description?: string | null;
    phone?: string | null;
    isActive?: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface LocationRecord {
    id: string;
    companyId?: string;
    warehouseId: string;
    parentId?: string | null;
    code: string;
    name: string;
    path: string;
    depth: number;
    rowNo: number;
    colNo: number;
    createdAt: string;
    updatedAt?: string;
}

export interface ProductCategoryRecord {
    id: string;
    name: string;
    companyId: string;
    description?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface UomRecord {
    id: string;
    name: string;
    symbol: string;
    description?: string | null;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ProductRecord {
    id: string;
    companyId?: string | null;
    code: string;
    sku?: string | null;
    name: string;
    status?: string;
    description?: string | null;
    imageUrl?: string | null;
    categoryId?: string | null;
    uomId?: string | null;
    supplierId?: string | null;
    customerId?: string | null;
    barcode?: string | null;
    trackingMode?: string | null;
    rfidRequired?: boolean;
    qtyMin?: number | null;
    qtyMax?: number | null;
    unitType?: string | null;
    unitName?: string | null;
    conversionFactor?: number | null;
    minimumQty?: number | null;
    createdAt: string;
    updatedAt?: string;
    uom?: {
        id: string;
        name: string;
        symbol?: string | null;
    };
    category?: {
        id: string;
        name: string;
    };
    supplier?: {
        id: string;
        name: string;
    };
    customer?: {
        id: string;
        name: string;
    };
    attributeValues?: Array<{
        attributeId: string;
        value?: string;
        valueText?: string | null;
        valueNumber?: number | null;
        valueDate?: string | null;
        attributeItemId?: string | null;
        attribute?: {
            id: string;
            name: string;
            type?: string;
        };
    }>;
}

export interface TagRegistrationRecord {
    id: string;
    epc: string;
    productId: string;
    warehouseId: string;
    locationId: string;
    status: string;
    note: string;
    createdAt: string;
}

export interface EpcEventRecord {
    id: string;
    epc: string;
    timestamp: string;
    warehouseId: string;
    locationId: string;
    activity: string;
    documentRef: string;
}

export interface TransactionItem {
    productId: string;
    quantity: number;
}

export interface TransactionRecord {
    id: string;
    docNo: string;
    date: string;
    warehouseId: string;
    partnerId: string;
    type: string;
    items: TransactionItem[];
    status: string;
}

export interface RelocationRecord {
    id: string;
    docNo: string;
    date: string;
    sourceLocationId: string;
    destinationLocationId: string;
    productId: string;
    quantity: number;
    status: string;
}

export interface TransferRecord {
    id: string;
    docNo: string;
    date: string;
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    quantity: number;
    status: string;
}

export interface ReturnRecord {
    id: string;
    docNo: string;
    date: string;
    warehouseId: string;
    customerId: string;
    productId: string;
    quantity: number;
    reason: string;
    status: string;
}

export interface OpnameRecord {
    id: string;
    docNo: string;
    warehouseId: string;
    scheduledAt: string;
    status: string;
}

export interface StockBalanceRecord {
    id: string;
    productId: string;
    warehouseId: string;
    locationId: string;
    locationPath: string;
    quantity: number;
}

export interface StockPeriodRecord {
    id: string;
    period: string;
    productId: string;
    warehouseId: string;
    quantity: number;
}

export type EntityKey =
    | "attributes"
    | "categories"
    | "customers"
    | "suppliers"
    | "warehouses"
    | "locations"
    | "uoms"
    | "products"
    | "product-categories"
    | "tag_registrations"
    | "epc_events"
    | "inbound"
    | "outbound"
    | "relocation"
    | "transfer"
    | "return"
    | "opname"
    | "register"
    | "stock_balance"
    | "stock_period";

export interface ListParams {
    page?: number;
    perPage?: number;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    filters?: Record<string, string>;
}

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    perPage: number;
    total: number;
}

export interface EntityMap {
    attributes: AttributeRecord[];
    categories: CategoryRecord[];
    customers: CustomerRecord[];
    suppliers: SupplierRecord[];
    warehouses: WarehouseRecord[];
    locations: LocationRecord[];
    uoms: UomRecord[];
    products: ProductRecord[];
    "product-categories": ProductCategoryRecord[];
    tag_registrations: TagRegistrationRecord[];
    epc_events: EpcEventRecord[];
    inbound: TransactionRecord[];
    outbound: TransactionRecord[];
    relocation: RelocationRecord[];
    transfer: TransferRecord[];
    return: ReturnRecord[];
    opname: OpnameRecord[];
    stock_balance: StockBalanceRecord[];
    stock_period: StockPeriodRecord[];
}
