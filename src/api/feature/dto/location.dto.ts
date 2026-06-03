export interface LocationListParams {
    warehouseId: string;
    page?: number;
    limit?: number;
    search?: string;
}

export interface LocationListResponse<T> {
    items: T[];
}
