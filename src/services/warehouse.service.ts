import { apiRequest } from "@/lib/api/client";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { WarehouseRecord } from "@/model/entities";
import type { WarehouseOption } from "@/model/dashboard";

const toOption = (record: WarehouseRecord): WarehouseOption => ({
    id: record.id,
    name: record.name,
    code: record.code,
});

export const warehouseService = {
    async fetchOptions(): Promise<WarehouseOption[]> {
        const response = await apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/options",
            method: "get",
        });
        const records = normalizePaginationItems(response);
        return records.map(toOption);
    },

    async fetchMyWarehouses(): Promise<WarehouseRecord[]> {
        const response = await apiRequest<{ items?: WarehouseRecord[] }>({
            url: "/warehouses/my",
            method: "get",
        });
        return normalizePaginationItems(response);
    },
};
