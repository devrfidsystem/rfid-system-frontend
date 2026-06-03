export interface MasterRecord {
    id?: string;
    code?: string;
    name?: string;
    isActive?: boolean;
    status?: string;
    companyId?: string;
    warehouseId?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
}
