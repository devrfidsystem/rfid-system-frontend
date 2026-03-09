import { apiRequest } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/response';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price?: number;
  quantity?: number;
  warehouseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  warehouseId: string;
  description?: string;
  barcode?: string;
  price?: number;
  attributes?: Record<string, string>;
}

export interface FindProductsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  warehouseId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

const BASE_PATH = '/api/v1/products';

export const productsService = {
  findProducts(params: FindProductsParams = {}): Promise<ApiResponse<Product[]>> {
    return apiRequest<Product[]>({ url: BASE_PATH, method: 'get', params });
  },

  getProductById(id: string): Promise<ApiResponse<Product>> {
    return apiRequest<Product>({ url: `${BASE_PATH}/${id}`, method: 'get' });
  },

  createProduct(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
    return apiRequest<Product>({ url: BASE_PATH, method: 'post', data: payload });
  }
};
