import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult, ApiResponse } from "@/lib/api/response";
import { usersApi } from "@/api/feature/users.api";

export const usersService = {
    async list(
        params: { page?: number; limit?: number; search?: string } = {},
    ): Promise<ApiPaginatedResult<Record<string, unknown>>> {
        const response = await usersApi.list(params);
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: Record<string, unknown>[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },
};
