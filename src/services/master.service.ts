import { apiRequest } from "@/lib/api/client";
import type { ApiResponse, ApiPaginatedResult } from "@/lib/api/response";
import type {
    MasterCreatePayloads,
    MasterEntityKey,
    MasterListParams,
    MasterRecords,
    MasterRemovableEntity,
    MasterUpdatePayloads,
} from "@/api/feature/dto/master.dto";
import { normalizePaginationItems } from "@/lib/api/normalizers";

const entityPaths: Record<MasterEntityKey, string> = {
    warehouses: "/warehouses",
    locations: "/locations",
    products: "/products",
    customers: "/customers",
    suppliers: "/suppliers",
    uoms: "/uoms",
    "product-categories": "/product-categories",
};

const removableEntities: MasterEntityKey[] = [
    "warehouses",
    "locations",
    "products",
    "customers",
    "suppliers",
    "uoms",
    "product-categories",
];

export const masterService = {
    async fetchList<K extends MasterEntityKey>(
        entity: K,
        params?: MasterListParams,
    ): Promise<ApiPaginatedResult<MasterRecords[K]>> {
        const response = await apiRequest<{ items?: MasterRecords[K][] }>({
            url: entityPaths[entity],
            method: "get",
            params,
        });
        const items = normalizePaginationItems(response);
        return {
            items,
            meta: response.meta,
        };
    },

    async fetchOptions<K extends MasterEntityKey>(
        entity: K,
        params?: Record<string, string | undefined>,
    ): Promise<MasterRecords[K][]> {
        const response = await apiRequest<{ items?: MasterRecords[K][] }>({
            url: `${entityPaths[entity]}/options`,
            method: "get",
            params,
        });
        return normalizePaginationItems(
            response as ApiResponse<{ items?: MasterRecords[K][] }>,
        );
    },

    async create<K extends MasterEntityKey>(
        entity: K,
        payload: MasterCreatePayloads[K],
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return apiRequest<MasterRecords[K]>({
            url: entityPaths[entity],
            method: "post",
            data: payload,
        });
    },

    async update<K extends MasterEntityKey>(
        entity: K,
        id: string,
        payload: MasterUpdatePayloads[K],
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return apiRequest<MasterRecords[K]>({
            url: `${entityPaths[entity]}/${id}`,
            method: "patch",
            data: payload,
        });
    },

    async remove<K extends MasterRemovableEntity>(
        entity: K,
        id: string,
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return apiRequest<MasterRecords[K]>({
            url: `${entityPaths[entity]}/${id}`,
            method: "delete",
        });
    },

    isRemovable(entity: MasterEntityKey): entity is MasterRemovableEntity {
        return removableEntities.includes(entity);
    },
};
