import type { ApiResponse } from "@/lib/api/response";
import type { LocationRecord } from "@/model/entities";
import type {
    LocationListParams,
    LocationListResponse,
} from "@/api/feature/dto/location.dto";
import { locationApi } from "@/api/feature/location.api";

export const locationService = {
    async list(
        params: LocationListParams,
    ): Promise<ApiResponse<LocationListResponse<LocationRecord>>> {
        return locationApi.list(params);
    },

    async move(id: string, newParentId?: string | null): Promise<LocationRecord> {
        const response = await locationApi.move(id, newParentId);
        return response.data;
    },
};
