import { apiRequest } from "@/lib/api/client";
import type {
    OpnameSummaryResponse,
    OpnameTreeNode,
} from "@/api/feature/dto/opname.dto";

export interface OpnameLineDetail {
    id: string;
    docId: string;
    productId: string;
    locationId: string;
    lineNo?: number;
    system_qty?: number;
    counted_qty?: number;
    variance_qty?: number;
    qtySystem?: number;
    qtyCounted?: number;
    qtyDiff?: number;
    note?: string | null;
    product?: {
        id: string;
        code: string;
        name: string;
    } | null;
    location?: {
        id: string;
        code: string;
        name: string;
    } | null;
}

export interface OpnameTreeFilterParams {
    companyId?: string;
    warehouseId?: string;
}

export interface OpnameNodePayload {
    companyId?: string;
    warehouseId?: string;
    docNumber: string;
    title?: string;
    notes?: string;
    parentId?: string | null;
    nodeType?: "group" | "profile" | "task";
    taskGroup?: string;
    taskPeriod?: string;
}

export interface UpdateOpnameLineCountPayload {
    qtyCounted: number;
    notes?: string;
}

export const opnameApi = {
    getTree(params: OpnameTreeFilterParams = {}) {
        return apiRequest<OpnameTreeNode[]>({
            url: "/opname/tree",
            method: "get",
            params,
        });
    },

    summary(params: OpnameTreeFilterParams = {}) {
        return apiRequest<OpnameSummaryResponse>({
            url: "/opname/summary",
            method: "get",
            params,
        });
    },

    create(payload: OpnameNodePayload) {
        return apiRequest<OpnameTreeNode>({
            url: "/opname",
            method: "post",
            data: payload,
        });
    },

    createChild(parentId: string, payload: OpnameNodePayload) {
        return apiRequest<OpnameTreeNode>({
            url: `/opname/${parentId}/children`,
            method: "post",
            data: payload,
        });
    },

    getDetail(id: string) {
        return apiRequest<{
            id: string;
            nodeType?: string;
            lines?: OpnameLineDetail[];
            [key: string]: unknown;
        }>({
            url: `/opname/${id}`,
            method: "get",
        });
    },

    updateLineCount(
        docId: string,
        lineId: string,
        payload: UpdateOpnameLineCountPayload,
    ) {
        return apiRequest<OpnameLineDetail>({
            url: `/opname/${docId}/lines/${lineId}`,
            method: "patch",
            data: payload,
        });
    },

    startCounting(id: string, warehouseId: string) {
        return apiRequest({
            url: `/opname/${id}/start-counting`,
            method: "post",
            data: { warehouseId },
        });
    },

    reconcile(id: string) {
        return apiRequest({
            url: `/opname/${id}/reconcile`,
            method: "post",
        });
    },

    close(id: string) {
        return apiRequest({
            url: `/opname/${id}/close`,
            method: "post",
        });
    },

    cancel(id: string) {
        return apiRequest({
            url: `/opname/${id}/cancel`,
            method: "post",
        });
    },
};
