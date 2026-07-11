import { apiRequest } from "@/lib/api/client";
import type { LocationRecord } from "@/model/entities";
import type {
    LocationListParams,
    LocationListResponse,
} from "./dto/location.dto";

export const locationApi = {
    list(params: LocationListParams) {
        return apiRequest<LocationListResponse<LocationRecord>>({
            url: "/locations",
            method: "get",
            params,
        });
    },

    move(id: string, newParentId?: string | null) {
        return apiRequest<LocationRecord>({
            url: `/locations/${id}/move`,
            method: "patch",
            data: {
                newParentId: newParentId ?? null,
            },
        });
    },
};
