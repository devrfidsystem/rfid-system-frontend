export interface MasterRecord {
    id?: string;
    code?: string;
    name?: string;
    isActive?: boolean;
    status?: string;
    companyId?: string;
    warehouseId?: string | null;
    warehouse?: { id?: string; name?: string; code?: string };
    address?: string;
    categoryId?: string | null;
    uomId?: string | null;
    supplierId?: string | null;
    customerId?: string | null;
    parentId?: string | null;
    parent?: { id?: string; name?: string; path?: string };
    barcode?: string;
    trackingMode?: string;
    rfidRequired?: boolean;
    qtyMin?: number;
    qtyMax?: number;
    unitType?: string;
    unitName?: string;
    conversionFactor?: number;
    imageFile?: File | null;
    imageUrl?: string | null;
    description?: string | null;
    type?: string;
    items?: Array<{ id?: string; value?: string; label?: string }>;
    path?: string;
    depth?: number;
    treeDepth?: number;
    treeHasChildren?: boolean;
    treeExpanded?: boolean;
    treeLabel?: string;
    treeGuides?: boolean[];
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
    [key: string]: unknown;
}

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
}
