import type { ApiResponse } from "@/lib/api/response";

const asArray = <T>(value: T[] | undefined | null): T[] => {
    if (Array.isArray(value)) {
        return value;
    }
    return [];
};

export const normalizePaginationItems = <T>(
    response: ApiResponse<{ items?: T[] } | T[]>,
): T[] => {
    const payload = response.data;
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!payload) {
        return [];
    }
    return asArray((payload as { items?: T[] }).items);
};

export const normalizeDataObject = <T>(
    response: ApiResponse<T | { data?: T }>,
): T | null => {
    const payload = response.data;
    if (!payload) {
        return null;
    }
    if (typeof payload === "object" && "data" in payload) {
        return payload.data ?? null;
    }
    return payload as T;
};
