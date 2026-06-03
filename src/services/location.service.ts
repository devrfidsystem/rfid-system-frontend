import { apiRequest } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import type { LocationRecord } from "@/model/entities";
import type {
    LocationListParams,
    LocationListResponse,
} from "@/api/feature/dto/location.dto";

export const locationService = {
    async list(
        params: LocationListParams,
    ): Promise<ApiResponse<LocationListResponse<LocationRecord>>> {
        return apiRequest<LocationListResponse<LocationRecord>>({
            url: "/locations",
            method: "get",
            params,
        });
    },
};
