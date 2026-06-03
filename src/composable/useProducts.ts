import { useDataTable } from "@/composable/useDataTable";
import {
    type CreateProductPayload,
    type FindProductsParams,
    type Product,
    productsService,
} from "@/services/products.service";

export function useProducts(initialWarehouseId?: string) {
    const dataTable = useDataTable<Product, FindProductsParams>({
        fetcher: (query) => productsService.findProducts(query),
        initialLimit: 20,
        defaultQuery: initialWarehouseId
            ? { warehouseId: initialWarehouseId }
            : undefined,
    });

    const createProduct = async (payload: CreateProductPayload) => {
        const product = await productsService.createProduct(payload);
        dataTable.items.value = [product, ...dataTable.items.value];
        dataTable.total.value += 1;
        const resolvedLimit = dataTable.limit.value || 1;
        dataTable.totalPages.value = Math.max(
            1,
            Math.ceil(dataTable.total.value / resolvedLimit),
        );
        return product;
    };

    return {
        ...dataTable,
        createProduct,
    };
}
