import { ref } from 'vue';
import type { Product } from '@/services/products';
import { productsService, type FindProductsParams } from '@/services/products';
import { useListQuery } from '@/composables/useListQuery';

export function useProductListQuery(initialWarehouseId?: string) {
  const query = useListQuery({
    initialPage: 1,
    initialLimit: 20,
    initialFilters: initialWarehouseId ? { warehouseId: initialWarehouseId } : {},
    initialSortBy: 'name',
    initialSortOrder: 'asc',
    keywordDebounceMs: 300
  });

  const items = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadProducts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const params: FindProductsParams = query.buildParams();
      const response = await productsService.findProducts(params);
      items.value = response.data;
      query.setTotals(response.meta?.total ?? items.value.length, response.meta?.totalPages);
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load products';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => loadProducts();

  return {
    items,
    loading,
    error,
    refresh,
    loadProducts,
    ...query
  };
}
