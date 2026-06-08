import { apiRequest } from "@/lib/api/client";
import type {
    MasterCreatePayloads,
    MasterEntityKey,
    MasterListParams,
    MasterRecords,
    MasterRemovableEntity,
    MasterUpdatePayloads,
} from "./dto/master.dto";

const entityPaths: Record<MasterEntityKey, string> = {
    warehouses: "/warehouses",
    locations: "/locations",
    products: "/products",
    customers: "/customers",
    suppliers: "/suppliers",
    uoms: "/uoms",
    "product-categories": "/product-categories",
};

export const masterApi = {
    fetchList<K extends MasterEntityKey>(entity: K, params?: MasterListParams) {
        return apiRequest<{ items?: MasterRecords[K][] }>({
            url: entityPaths[entity],
            method: "get",
            params,
        });
    },

    fetchOptions<K extends MasterEntityKey>(
        entity: K,
        params?: Record<string, string | undefined>,
    ) {
        return apiRequest<{ items?: MasterRecords[K][] }>({
            url: `${entityPaths[entity]}/options`,
            method: "get",
            params,
        });
    },

    create<K extends MasterEntityKey>(
        entity: K,
        payload: MasterCreatePayloads[K],
    ) {
        return apiRequest<MasterRecords[K]>({
            url: entityPaths[entity],
            method: "post",
            data: payload,
        });
    },

    update<K extends MasterEntityKey>(
        entity: K,
        id: string,
        payload: MasterUpdatePayloads[K],
    ) {
        return apiRequest<MasterRecords[K]>({
            url: `${entityPaths[entity]}/${id}`,
            method: "patch",
            data: payload,
        });
    },

    remove<K extends MasterRemovableEntity>(entity: K, id: string) {
        return apiRequest<MasterRecords[K]>({
            url: `${entityPaths[entity]}/${id}`,
            method: "delete",
        });
    },
};
