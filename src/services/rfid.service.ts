import { apiRequest } from "@/lib/api/client";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiResponse, ApiPaginatedResult } from "@/lib/api/response";
import type {
    AssignEpcTagDto,
    EncodeEpcTagDto,
    RfidEventDto,
    RfidTag,
    RfidTagListParams,
    RegisterEpcTagDto,
    TransitionEpcStatusDto,
} from "@/api/feature/dto/rfid.dto";

const BASE_PATH = "/rfid";

export interface AssignEpcPayload {
    id: string;
    payload: AssignEpcTagDto;
}

export const rfidService = {
    async listTags(
        params: RfidTagListParams = {},
    ): Promise<ApiPaginatedResult<RfidTag>> {
        const response = await apiRequest<RfidTag[]>({
            url: `${BASE_PATH}/tags`,
            method: "get",
            params,
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: RfidTag[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },

    async getTagById(id: string): Promise<RfidTag> {
        const response = await apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}`,
            method: "get",
        });
        return response.data;
    },

    async registerTag(payload: RegisterEpcTagDto): Promise<RfidTag> {
        const response = await apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags`,
            method: "post",
            data: payload,
        });
        return response.data;
    },

    async encodeTag(id: string, payload: EncodeEpcTagDto): Promise<RfidTag> {
        const response = await apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/encode`,
            method: "patch",
            data: payload,
        });
        return response.data;
    },

    async transitionStatus(
        id: string,
        payload: TransitionEpcStatusDto,
    ): Promise<RfidTag> {
        const response = await apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/status`,
            method: "patch",
            data: payload,
        });
        return response.data;
    },

    async assignTag(
        idOrPayload: string | AssignEpcPayload,
        payload?: AssignEpcTagDto,
    ): Promise<RfidTag> {
        // support both assignTag(id, payload) and assignTag({ id, payload }) for callers
        let id: string;
        let data: AssignEpcTagDto | undefined;
        if (typeof idOrPayload === "string") {
            id = idOrPayload;
            data = payload;
        } else {
            id = idOrPayload.id;
            data = idOrPayload.payload;
        }
        const response = await apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/assign`,
            method: "post",
            data,
        });
        return response.data;
    },

    async unassignTag(assignmentId: string): Promise<null> {
        const response = await apiRequest<null>({
            url: `${BASE_PATH}/assignments/${assignmentId}`,
            method: "delete",
        });
        return response.data;
    },

    async logEvent(payload: RfidEventDto): Promise<null> {
        const response = await apiRequest<null>({
            url: `${BASE_PATH}/events`,
            method: "post",
            data: payload,
        });
        return response.data;
    },
};
