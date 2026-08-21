import { apiRequest } from "@/lib/api/client";
import type { WarehouseRecord } from "@/model/entities";

export const warehouseApi = {
    fetchOptions(params: { companyId?: string } = {}) {
        return apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/options",
            method: "get",
            params,
        });
    },

    fetchMyWarehouses() {
        return apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/my",
            method: "get",
        });
    },
};
