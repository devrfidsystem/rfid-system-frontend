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
import { masterApi } from "@/api/feature/master.api";

const removableEntities: MasterEntityKey[] = [
    "attributes",
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
        const response = await masterApi.fetchList(entity, params);
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
        const response = await masterApi.fetchOptions(entity, params);
        return normalizePaginationItems(
            response as ApiResponse<{ items?: MasterRecords[K][] }>,
        );
    },

    async create<K extends MasterEntityKey>(
        entity: K,
        payload: MasterCreatePayloads[K],
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return masterApi.create(entity, payload);
    },

    async update<K extends MasterEntityKey>(
        entity: K,
        id: string,
        payload: MasterUpdatePayloads[K],
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return masterApi.update(entity, id, payload);
    },

    async remove<K extends MasterRemovableEntity>(
        entity: K,
        id: string,
    ): Promise<ApiResponse<MasterRecords[K]>> {
        return masterApi.remove(entity, id);
    },

    isRemovable(entity: MasterEntityKey): entity is MasterRemovableEntity {
        return removableEntities.includes(entity);
    },
};
