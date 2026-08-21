import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { WarehouseRecord } from "@/model/entities";
import type { WarehouseOption } from "@/model/dashboard";
import { warehouseApi } from "@/api/feature/warehouse.api";

const toOption = (record: WarehouseRecord): WarehouseOption => ({
    id: record.id,
    name: record.name,
    code: record.code,
});

export const warehouseService = {
    async fetchOptions(companyId?: string): Promise<WarehouseOption[]> {
        const response = await warehouseApi.fetchOptions(
            companyId ? { companyId } : {},
        );
        const records = normalizePaginationItems(response);
        return records.map(toOption);
    },

    async fetchMyWarehouses(): Promise<WarehouseRecord[]> {
        const response = await warehouseApi.fetchMyWarehouses();
        return normalizePaginationItems(response);
    },
};
