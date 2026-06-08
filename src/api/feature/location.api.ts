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
};
