import { apiRequest } from "@/lib/api/client";

const BASE_PATH = "/users";

export const usersApi = {
    list(params: { page?: number; limit?: number; search?: string } = {}) {
        return apiRequest<{
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
    },
};
