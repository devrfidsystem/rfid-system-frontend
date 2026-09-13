import { computed, reactive, ref } from "vue";
import type { ApiMeta } from "@/lib/api/response";
import { rfidService } from "@/services/rfid.service";
import type {
    RegistrationActivity,
    RegistrationActivityListParams,
} from "@/api/feature/dto/rfid.dto";

interface UseRfidActivitiesOptions {
    autoFetch?: boolean;
    initialListParams?: RegistrationActivityListParams;
}

export function useRfidRegistrationActivities({
    autoFetch = true,
    initialListParams,
}: UseRfidActivitiesOptions = {}) {
    const filters = ref<RegistrationActivityListParams>({});
    const pagination = reactive({
        page: initialListParams?.page ?? 1,
        limit: initialListParams?.limit ?? 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];

    const items = ref<RegistrationActivity[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const normalizeError = (response: unknown) => {
        if (response instanceof Error) return response.message;
        if (typeof response === "string") return response;
        return "Something went wrong";
    };

    const computedParams = computed(() => ({
        page: pagination.page,
        limit: pagination.limit,
        ...initialListParams,
        ...filters.value,
    }));

    const syncMeta = (meta?: ApiMeta | null) => {
        if (!meta) return;
        if (meta.page) pagination.page = meta.page;
        if (meta.limit) pagination.limit = meta.limit;
        if (typeof meta.total === "number") {
            pagination.total = meta.total;
        } else {
            pagination.total = items.value.length;
        }
    };

    const fetchActivities = async (): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await rfidService.listRegistrationActivities(
                computedParams.value,
            );
            items.value = response.items;
            syncMeta(response.meta);
        } catch (err) {
            error.value = normalizeError(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const refreshList = () => fetchActivities();

    const setPage = (value: number) => {
        pagination.page = Math.max(1, value);
        return fetchActivities();
    };

    const setLimit = (value: number) => {
        pagination.limit = value;
        pagination.page = 1;
        return fetchActivities();
    };

    const setFilters = (payload: RegistrationActivityListParams) => {
        filters.value = { ...payload };
        pagination.page = 1;
        return fetchActivities();
    };

    if (autoFetch) {
        void fetchActivities();
    }

    return {
        items,
        loading,
        error,
        pagination,
        pageSizeOptions,
        totalPages: computed(() =>
            Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit)),
        ),
        fetchActivities,
        refreshList,
        setPage,
        setLimit,
        setFilters,
        paginationMeta: computed(() => pagination),
    };
}
