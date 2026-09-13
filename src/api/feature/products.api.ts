import { apiRequest } from "@/lib/api/client";
import type {
    Product,
    CreateProductPayload,
    FindProductsParams,
} from "@/services/products.service";

const BASE_PATH = "/products";

export const productsApi = {
    findProducts(params: FindProductsParams = {}) {
        return apiRequest<{ items?: Product[] }>({
            url: BASE_PATH,
            method: "get",
            params,
        });
    },

    getProductById(id: string) {
        return apiRequest<Product>({
            url: `${BASE_PATH}/${id}`,
            method: "get",
        });
    },

    createProduct(payload: CreateProductPayload) {
        return apiRequest<Product>({
            url: BASE_PATH,
            method: "post",
            data: payload,
        });
    },

    uploadProductImage(id: string, file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return apiRequest<Product>({
            url: `${BASE_PATH}/${id}/image`,
            method: "post",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};
