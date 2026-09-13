import type { ApiResponse, ApiPaginatedResult } from "@/lib/api/response";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ProductRecord } from "@/model/entities";
import type { CreateProductPayload } from "@/api/feature/dto/master.dto";
import { productsApi } from "@/api/feature/products.api";

export type Product = ProductRecord;
export type { CreateProductPayload };

export interface FindProductsParams {
    page?: number;
    limit?: number;
    keyword?: string;
    warehouseId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, unknown>;
}

export const productsService = {
    async findProducts(
        params: FindProductsParams = {},
    ): Promise<ApiPaginatedResult<Product>> {
        const response = await productsApi.findProducts(params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: Product[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },

    async getProductById(id: string): Promise<Product> {
        const response = await productsApi.getProductById(id);
        return response.data;
    },

    async createProduct(payload: CreateProductPayload): Promise<Product> {
        const response = await productsApi.createProduct(payload);
        return response.data;
    },

    async uploadProductImage(id: string, file: File): Promise<Product> {
        const response = await productsApi.uploadProductImage(id, file);
        return response.data;
    },
};
