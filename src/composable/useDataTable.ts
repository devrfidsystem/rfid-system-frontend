import { computed, ref, type ComputedRef, type Ref, type UnwrapRef } from "vue";
import type { ApiMeta, ApiPaginatedResult } from "@/lib/api/response";

export interface DataTableState {
    page: number;
    limit: number;
    keyword: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    filters: Record<string, unknown>;
}

export interface UseDataTableOptions<T, Query> {
    fetcher: (query: Query) => Promise<ApiPaginatedResult<T>>;
    initialPage?: number;
    initialLimit?: number;
    initialKeyword?: string;
    initialSortBy?: string;
    initialSortOrder?: "asc" | "desc";
    initialFilters?: Record<string, unknown>;
    defaultQuery?: Partial<Query>;
    mapQuery?: (state: DataTableState) => Query;
    autoFetch?: boolean;
    onFetchError?: (error: unknown) => void;
}

export interface UseDataTableReturn<T> {
    items: Ref<UnwrapRef<T>[]>;
    loading: Ref<boolean>;
    error: Ref<string | null>;
    page: Ref<number>;
    limit: Ref<number>;
    total: Ref<number>;
    totalPages: Ref<number>;
    keyword: Ref<string>;
    sortBy: Ref<string>;
    sortOrder: Ref<"asc" | "desc">;
    filters: Ref<Record<string, unknown>>;
    isEmpty: ComputedRef<boolean>;
    fetchData: (
        override?: Partial<DataTableState>,
    ) => Promise<ApiPaginatedResult<T>>;
    setPage: (
        value: number,
        opts?: { runFetch?: boolean },
    ) => Promise<ApiPaginatedResult<T> | undefined>;
    setLimit: (
        value: number,
        opts?: { runFetch?: boolean },
    ) => Promise<ApiPaginatedResult<T> | undefined>;
    setKeyword: (
        value: string,
        opts?: { runFetch?: boolean },
    ) => Promise<ApiPaginatedResult<T> | undefined>;
    setSort: (
        payload: { sortBy?: string; sortOrder?: "asc" | "desc" },
        opts?: { runFetch?: boolean },
    ) => Promise<ApiPaginatedResult<T> | undefined>;
    setFilters: (
        payload: Record<string, unknown>,
        opts?: { runFetch?: boolean },
    ) => Promise<ApiPaginatedResult<T> | undefined>;
    resetFilters: (opts?: {
        runFetch?: boolean;
    }) => Promise<ApiPaginatedResult<T> | undefined>;
    refresh: () => Promise<ApiPaginatedResult<T>>;
    currentQuery: ComputedRef<DataTableState>;
}

const defaultMapQuery = <Query>(state: DataTableState): Query => {
    const queryPayload: Record<string, unknown> = {
        page: state.page,
        limit: state.limit,
        keyword: state.keyword || undefined,
        sortBy: state.sortBy || undefined,
        sortOrder: state.sortOrder || undefined,
    };
    if (Object.keys(state.filters).length > 0) {
        queryPayload.filters = state.filters;
    }
    return queryPayload as Query;
};

const normalizeError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as Record<string, unknown>).message === "string"
    ) {
        return (error as Record<string, unknown>).message as string;
    }
    return "Request failed";
};

export function useDataTable<T extends object, Query>({
    fetcher,
    initialPage = 1,
    initialLimit = 20,
    initialKeyword = "",
    initialSortBy = "",
    initialSortOrder = "asc",
    initialFilters = {},
    defaultQuery,
    mapQuery = defaultMapQuery,
    autoFetch = true,
    onFetchError,
}: UseDataTableOptions<T, Query>): UseDataTableReturn<T> {
    // use UnwrapRef to represent the runtime-unwrapped type and assert the ref to avoid
    // complex compiler mismatch between Ref<T[]> and Vue's UnwrapRefSimple.
    const items = ref([]) as Ref<UnwrapRef<T>[]>;
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(initialPage);
    const limit = ref(initialLimit);
    const total = ref(0);
    const totalPages = ref(1);
    const keyword = ref(initialKeyword);
    const sortBy = ref(initialSortBy);
    const sortOrder = ref(initialSortOrder);
    const filters = ref<Record<string, unknown>>({ ...initialFilters });
    const currentQuery = computed<DataTableState>(() => ({
        page: page.value,
        limit: limit.value,
        keyword: keyword.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        filters: filters.value,
    }));

    const computeQuery = (state: DataTableState): Query => {
        const mapped = mapQuery(state);
        return { ...(defaultQuery ?? {}), ...mapped } as Query;
    };

    const updateMeta = (meta?: ApiMeta | null) => {
        if (meta?.page) {
            page.value = meta.page;
        }
        if (meta?.limit) {
            limit.value = meta.limit;
        }
        total.value = meta?.total ?? items.value.length;
        totalPages.value =
            meta?.totalPages ??
            (limit.value > 0
                ? Math.max(1, Math.ceil(total.value / limit.value))
                : 1);
    };

    const fetchData = async (
        override?: Partial<DataTableState>,
    ): Promise<ApiPaginatedResult<T>> => {
        loading.value = true;
        error.value = null;
        const state: DataTableState = {
            page: override?.page ?? page.value,
            limit: override?.limit ?? limit.value,
            keyword: override?.keyword ?? keyword.value,
            sortBy: override?.sortBy ?? sortBy.value,
            sortOrder: override?.sortOrder ?? sortOrder.value,
            filters: override?.filters ?? filters.value,
        };
        try {
            const query = computeQuery(state);
            const response = await fetcher(query);
            items.value = (response.items ?? []) as UnwrapRef<T>[];
            updateMeta(response.meta);
            return response;
        } catch (err) {
            const message = normalizeError(err);
            error.value = message;
            onFetchError?.(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const queueFetch = async (runFetch?: boolean) => {
        if (runFetch ?? true) {
            return fetchData();
        }
        return undefined;
    };

    const setPage = (value: number, opts?: { runFetch?: boolean }) => {
        page.value = value;
        return queueFetch(opts?.runFetch);
    };

    const setLimit = (value: number, opts?: { runFetch?: boolean }) => {
        limit.value = value;
        return queueFetch(opts?.runFetch);
    };

    const setKeyword = (value: string, opts?: { runFetch?: boolean }) => {
        keyword.value = value;
        page.value = 1;
        return queueFetch(opts?.runFetch);
    };

    const setSort = (
        payload: { sortBy?: string; sortOrder?: "asc" | "desc" },
        opts?: { runFetch?: boolean },
    ) => {
        if (payload.sortBy !== undefined) sortBy.value = payload.sortBy;
        if (payload.sortOrder !== undefined)
            sortOrder.value = payload.sortOrder;
        page.value = 1;
        return queueFetch(opts?.runFetch);
    };

    const setFilters = (
        payload: Record<string, unknown>,
        opts?: { runFetch?: boolean },
    ) => {
        filters.value = { ...filters.value, ...payload };
        page.value = 1;
        return queueFetch(opts?.runFetch);
    };

    const resetFilters = (opts?: { runFetch?: boolean }) => {
        filters.value = { ...initialFilters };
        page.value = 1;
        return queueFetch(opts?.runFetch);
    };

    const refresh = () => fetchData();

    const isEmpty = computed(
        () =>
            !loading.value && items.value.length === 0 && error.value === null,
    );

    if (autoFetch) {
        void fetchData();
    }

    return {
        items,
        loading,
        error,
        page,
        limit,
        total,
        totalPages,
        keyword,
        sortBy,
        sortOrder,
        filters,
        isEmpty,
        fetchData,
        setPage,
        setLimit,
        setKeyword,
        setSort,
        setFilters,
        resetFilters,
        refresh,
        currentQuery,
    };
}
