import {
    opnameApi,
    type OpnameNodePayload,
    type OpnameLineDetail,
    type UpdateOpnameLineCountPayload,
    type OpnameTreeFilterParams,
} from "@/api/feature/opname.api";
import type { OpnameTreeNode } from "@/views/opname/opnameTree";
import type { OpnameSummaryResponse } from "@/views/opname/opnameSummary";

export const opnameService = {
    async getTree(
        params: OpnameTreeFilterParams = {},
    ): Promise<OpnameTreeNode[]> {
        const response = await opnameApi.getTree(params);
        return (response.data ?? []) as OpnameTreeNode[];
    },

    async summary(
        params: OpnameTreeFilterParams = {},
    ): Promise<OpnameSummaryResponse> {
        const response = await opnameApi.summary(params);
        return response.data as OpnameSummaryResponse;
    },

    async create(payload: OpnameNodePayload): Promise<OpnameTreeNode> {
        const response = await opnameApi.create(payload);
        return response.data as OpnameTreeNode;
    },

    async createChild(
        parentId: string,
        payload: OpnameNodePayload,
    ): Promise<OpnameTreeNode> {
        const response = await opnameApi.createChild(parentId, payload);
        return response.data as OpnameTreeNode;
    },

    async getDetail(id: string) {
        const response = await opnameApi.getDetail(id);
        return response.data as {
            id: string;
            nodeType?: string;
            lines?: OpnameLineDetail[];
            [key: string]: unknown;
        };
    },

    async updateLineCount(
        docId: string,
        lineId: string,
        payload: UpdateOpnameLineCountPayload,
    ): Promise<OpnameLineDetail> {
        const response = await opnameApi.updateLineCount(
            docId,
            lineId,
            payload,
        );
        return response.data as OpnameLineDetail;
    },

    async startCounting(id: string, warehouseId: string): Promise<void> {
        await opnameApi.startCounting(id, warehouseId);
    },

    async reconcile(id: string): Promise<void> {
        await opnameApi.reconcile(id);
    },

    async close(id: string): Promise<void> {
        await opnameApi.close(id);
    },

    async cancel(id: string): Promise<void> {
        await opnameApi.cancel(id);
    },
};

export type { OpnameTreeNode } from "@/views/opname/opnameTree";
export type {
    OpnameNodePayload,
    OpnameTreeFilterParams,
} from "@/api/feature/opname.api";
export type { OpnameSummaryResponse } from "@/views/opname/opnameSummary";
