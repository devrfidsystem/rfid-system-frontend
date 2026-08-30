export interface LocationListParams {
    warehouseId: string;
    page?: number;
    limit?: number;
    search?: string;
    excludeTypes?: string[];
}

export interface LocationListResponse<T> {
    items: T[];
}
