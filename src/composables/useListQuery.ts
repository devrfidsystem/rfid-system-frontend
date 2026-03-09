import { computed, ref } from 'vue';

export interface ListQueryState {
  page: number;
  limit: number;
  keyword: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;
}

export interface UseListQueryOptions {
  initialPage?: number;
  initialLimit?: number;
  initialKeyword?: string;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialFilters?: Record<string, unknown>;
  keywordDebounceMs?: number;
  syncWithQuery?: boolean;
}

export interface UseListQueryReturn {
  page: typeof page;
  limit: typeof limit;
  keyword: typeof keyword;
  debouncedKeyword: typeof debouncedKeyword;
  sortBy: typeof sortBy;
  sortOrder: typeof sortOrder;
  filters: typeof filters;
  total: typeof total;
  totalPages: typeof totalPages;
  currentParams: ReturnType<typeof computed>;
  setPage: (value: number) => void;
  setLimit: (value: number) => void;
  setKeyword: (value: string, opts?: { debounceMs?: number }) => Promise<void>;
  setSort: (payload: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void;
  setFilters: (payload: Record<string, unknown>) => void;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  reset: () => void;
  buildParams: (overrides?: Partial<ListQueryState>) => ListQueryState;
  updateFromParams: (params: Partial<ListQueryState>) => void;
  setTotals: (count: number, totalPageCount?: number) => void;
}

const defaultFilters: Record<string, unknown> = {};

export function useListQuery({
  initialPage = 1,
  initialLimit = 20,
  initialKeyword = '',
  initialSortBy = '',
  initialSortOrder = 'asc',
  initialFilters = defaultFilters,
  keywordDebounceMs = 0
}: UseListQueryOptions = {}): UseListQueryReturn {
  const page = ref(initialPage);
  const limit = ref(initialLimit);
  const keyword = ref(initialKeyword);
  const debouncedKeyword = ref(initialKeyword);
  const sortBy = ref(initialSortBy);
  const sortOrder = ref(initialSortOrder);
  const filters = ref<Record<string, unknown>>({ ...initialFilters });
  const total = ref(0);
  const totalPages = ref(1);
  let keywordTimer: ReturnType<typeof setTimeout> | undefined;

  const commitKeyword = (value: string) => {
    debouncedKeyword.value = value;
  };

  const setKeyword = (value: string, opts?: { debounceMs?: number }) => {
    keyword.value = value;
    page.value = 1;
    const wait = opts?.debounceMs ?? keywordDebounceMs;
    if (wait > 0) {
      if (keywordTimer) {
        clearTimeout(keywordTimer);
      }
      return new Promise<void>((resolve) => {
        keywordTimer = setTimeout(() => {
          commitKeyword(value);
          keywordTimer = undefined;
          resolve();
        }, wait);
      });
    }
    commitKeyword(value);
    return Promise.resolve();
  };

  const setPage = (value: number) => {
    page.value = Math.max(1, value);
  };

  const setLimit = (value: number) => {
    limit.value = Math.max(1, value);
  };

  const setSort = (payload: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    if (payload.sortBy !== undefined) {
      sortBy.value = payload.sortBy;
    }
    if (payload.sortOrder !== undefined) {
      sortOrder.value = payload.sortOrder;
    }
    page.value = 1;
  };

  const setFilters = (payload: Record<string, unknown>) => {
    filters.value = { ...filters.value, ...payload };
    page.value = 1;
  };

  const setFilter = (key: string, value: unknown) => {
    filters.value = { ...filters.value, [key]: value };
    page.value = 1;
  };

  const clearFilters = () => {
    filters.value = {};
  };

  const resetFilters = () => {
    filters.value = { ...initialFilters };
    page.value = 1;
  };

  const reset = () => {
    page.value = initialPage;
    limit.value = initialLimit;
    keyword.value = initialKeyword;
    debouncedKeyword.value = initialKeyword;
    sortBy.value = initialSortBy;
    sortOrder.value = initialSortOrder;
    filters.value = { ...initialFilters };
    total.value = 0;
    totalPages.value = 1;
    if (keywordTimer) {
      clearTimeout(keywordTimer);
      keywordTimer = undefined;
    }
  };

  const buildParams = (overrides: Partial<ListQueryState> = {}): ListQueryState => {
    return {
      page: overrides.page ?? page.value,
      limit: overrides.limit ?? limit.value,
      keyword: overrides.keyword ?? debouncedKeyword.value,
      sortBy: overrides.sortBy ?? sortBy.value,
      sortOrder: overrides.sortOrder ?? sortOrder.value,
      filters: overrides.filters ?? filters.value
    };
  };

  const updateFromParams = (params: Partial<ListQueryState>) => {
    if (params.page != null) page.value = params.page;
    if (params.limit != null) limit.value = params.limit;
    if (params.keyword != null) {
      keyword.value = params.keyword;
      debouncedKeyword.value = params.keyword;
    }
    if (params.sortBy != null) sortBy.value = params.sortBy;
    if (params.sortOrder != null) sortOrder.value = params.sortOrder;
    if (params.filters != null) filters.value = { ...params.filters };
  };

  const setTotals = (count: number, totalPageCount?: number) => {
    total.value = count;
    totalPages.value = totalPageCount ?? (limit.value > 0 ? Math.max(1, Math.ceil(count / limit.value)) : 1);
  };

  const currentParams = computed(() => buildParams());

  return {
    page,
    limit,
    keyword,
    debouncedKeyword,
    sortBy,
    sortOrder,
    filters,
    total,
    totalPages,
    currentParams,
    setPage,
    setLimit,
    setKeyword,
    setSort,
    setFilters,
    setFilter,
    clearFilters,
    resetFilters,
    reset,
    buildParams,
    updateFromParams,
    setTotals
  };
}
