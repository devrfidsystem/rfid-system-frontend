import { apiRequest } from "@/lib/api/client";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import type { ApiPaginatedResult, ApiResponse } from "@/lib/api/response";

const BASE_PATH = "/users";

export const usersService = {
    async list(
        params: { page?: number; limit?: number; search?: string } = {},
    ): Promise<ApiPaginatedResult<Record<string, unknown>>> {
        const response = await apiRequest<{
            items?: Record<string, unknown>[];
        }>({
            url: BASE_PATH,
            method: "get",
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                search: params.search ?? undefined,
            },
        });
        const items = normalizePaginationItems(
            response as ApiResponse<{ items?: Record<string, unknown>[] }>,
        );
        return {
            items,
            meta: response.meta,
        };
    },
};
