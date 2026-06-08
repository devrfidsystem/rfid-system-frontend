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
import { rfidApi } from "@/api/feature/rfid.api";

export interface AssignEpcPayload {
    id: string;
    payload: AssignEpcTagDto;
}

export const normalizeRfidTag = (
    row: Record<string, unknown> | RfidTag | null | undefined,
): RfidTag => {
    if (!row) return row as unknown as RfidTag;

    // Safely cast to Record to access dynamic backend properties
    const r = row as unknown as Record<string, unknown>;
    const mapped: Record<string, unknown> = { ...r };

    mapped.epcCode = r.epc ?? r.epcCode;

    const active = r.activeAssignment as Record<string, unknown> | undefined;
    if (active) {
        mapped.productId =
            (active.products as Record<string, unknown>)?.name ??
            active.product_id ??
            mapped.productId;
        mapped.warehouseId =
            (active.warehouse as Record<string, unknown>)?.name ??
            active.warehouse_id ??
            mapped.warehouseId;
        mapped.locationId =
            (active.location as Record<string, unknown>)?.name ??
            active.location_id ??
            mapped.locationId;
    }

    return mapped as unknown as RfidTag;
};

export const rfidService = {
    async listTags(
        params: RfidTagListParams = {},
    ): Promise<ApiPaginatedResult<RfidTag>> {
        const response = await rfidApi.listTags(params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: RfidTag[] }>,
        );
        return {
            items: (items as unknown as Record<string, unknown>[]).map(
                normalizeRfidTag,
            ),
            meta: response.meta,
        };
    },

    async getTagById(id: string): Promise<RfidTag> {
        const response = await rfidApi.getTagById(id);
        return normalizeRfidTag(response.data);
    },

    async registerTag(payload: RegisterEpcTagDto): Promise<RfidTag> {
        const response = await rfidApi.registerTag(payload);
        return normalizeRfidTag(response.data);
    },

    async encodeTag(id: string, payload: EncodeEpcTagDto): Promise<RfidTag> {
        const response = await rfidApi.encodeTag(id, payload);
        return normalizeRfidTag(response.data);
    },

    async transitionStatus(
        id: string,
        payload: TransitionEpcStatusDto,
    ): Promise<RfidTag> {
        const response = await rfidApi.transitionStatus(id, payload);
        return normalizeRfidTag(response.data);
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
        const response = await rfidApi.assignTag(id, data);
        return normalizeRfidTag(response.data);
    },

    async unassignTag(assignmentId: string): Promise<null> {
        const response = await rfidApi.unassignTag(assignmentId);
        return response.data;
    },

    async logEvent(payload: RfidEventDto): Promise<null> {
        const response = await rfidApi.logEvent(payload);
        return response.data;
    },
};
