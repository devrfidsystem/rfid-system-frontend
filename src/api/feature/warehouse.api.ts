import { apiRequest } from "@/lib/api/client";
import type { WarehouseRecord } from "@/model/entities";

export const warehouseApi = {
    fetchOptions() {
        return apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/options",
            method: "get",
        });
    },

    fetchMyWarehouses() {
        return apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/my",
            method: "get",
        });
    },
};
