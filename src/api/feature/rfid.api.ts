import { apiRequest } from "@/lib/api/client";
import type {
    AssignEpcTagDto,
    EncodeEpcTagDto,
    RfidEventDto,
    RfidTag,
    RfidTagListParams,
    RegisterEpcTagDto,
    TransitionEpcStatusDto,
    RegistrationActivity,
    RegistrationActivityListParams,
} from "./dto/rfid.dto";

const BASE_PATH = "/rfid";

export const rfidApi = {
    listRegistrationActivities(params: RegistrationActivityListParams = {}) {
        return apiRequest<RegistrationActivity[]>({
            url: `${BASE_PATH}/registration-activities`,
            method: "get",
            params,
        });
    },

    listTags(params: RfidTagListParams = {}) {
        return apiRequest<RfidTag[]>({
            url: `${BASE_PATH}/tags`,
            method: "get",
            params,
        });
    },

    getTagById(id: string) {
        return apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}`,
            method: "get",
        });
    },

    registerTag(payload: RegisterEpcTagDto) {
        return apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags`,
            method: "post",
            data: payload,
        });
    },

    encodeTag(id: string, payload: EncodeEpcTagDto) {
        return apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/encode`,
            method: "patch",
            data: payload,
        });
    },

    transitionStatus(id: string, payload: TransitionEpcStatusDto) {
        return apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/status`,
            method: "patch",
            data: payload,
        });
    },

    assignTag(id: string, data?: AssignEpcTagDto) {
        return apiRequest<RfidTag>({
            url: `${BASE_PATH}/tags/${id}/assign`,
            method: "post",
            data,
        });
    },

    unassignTag(assignmentId: string) {
        return apiRequest<null>({
            url: `${BASE_PATH}/assignments/${assignmentId}`,
            method: "delete",
        });
    },

    deleteTag(id: string) {
        return apiRequest<{ id: string }>({
            url: `${BASE_PATH}/tags/${id}`,
            method: "delete",
        });
    },

    logEvent(payload: RfidEventDto) {
        return apiRequest<null>({
            url: `${BASE_PATH}/events`,
            method: "post",
            data: payload,
        });
    },
};
