import { apiRequest } from "@/lib/api/client";
import type { ApiResponse, ApiPaginatedResult } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";

export interface Product {
    id: string;
    code: string;
    sku?: string | null;
    name: string;
    status?: string;
    description?: string;
    barcode?: string;
    price?: number;
    quantity?: number;
    warehouseId?: string;
    companyId?: string;
    uomId?: string;
    categoryId?: string;
    uom?: { id: string; name: string; symbol?: string | null };
    category?: { id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateProductPayload {
    companyId: string;
    code: string;
    name: string;
    uomId: string;
    categoryId?: string;
    description?: string;
    status?: string;
    barcode?: string;
    price?: number;
}

export interface FindProductsParams {
    page?: number;
    limit?: number;
    keyword?: string;
    warehouseId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, unknown>;
}

const BASE_PATH = "/products";

export const productsService = {
    async findProducts(
        params: FindProductsParams = {},
    ): Promise<ApiPaginatedResult<Product>> {
        const response = await apiRequest<{ items?: Product[] }>({
            url: BASE_PATH,
            method: "get",
            params,
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: Product[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },

    async getProductById(id: string): Promise<Product> {
        const response = await apiRequest<Product>({
            url: `${BASE_PATH}/${id}`,
            method: "get",
        });
        return response.data;
    },

    async createProduct(payload: CreateProductPayload): Promise<Product> {
        const response = await apiRequest<Product>({
            url: BASE_PATH,
            method: "post",
            data: payload,
        });
        return response.data;
    },
};
