import { computed, reactive, ref } from "vue";
import type { ApiMeta } from "@/lib/api/response";
import { rfidService } from "@/services/rfid.service";
import type {
    EncodeEpcTagDto,
    RegisterEpcTagDto,
    RfidTag,
    RfidTagListParams,
} from "@/api/feature/dto/rfid.dto";

interface UseRfidTagsOptions {
    autoFetch?: boolean;
    initialListParams?: RfidTagListParams;
}

export function useRfidTags({
    autoFetch = true,
    initialListParams,
}: UseRfidTagsOptions = {}) {
    const filters = ref<RfidTagListParams>({});
    const pagination = reactive({
        page: initialListParams?.page ?? 1,
        limit: initialListParams?.limit ?? 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];

    const items = ref<RfidTag[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const selectedTag = ref<RfidTag | null>(null);
    const detailLoading = ref(false);
    const detailError = ref<string | null>(null);

    const registering = ref(false);
    const encoding = ref(false);
    const deleting = ref(false);
    const submittingError = ref<string | null>(null);

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

    const fetchTags = async (): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await rfidService.listTags(computedParams.value);
            items.value = response.items;
            syncMeta(response.meta);
        } catch (err) {
            error.value = normalizeError(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchTagDetail = async (id: string) => {
        detailLoading.value = true;
        detailError.value = null;
        try {
            const tag = await rfidService.getTagById(id);
            selectedTag.value = tag;
            return tag;
        } catch (err) {
            detailError.value = normalizeError(err);
            throw err;
        } finally {
            detailLoading.value = false;
        }
    };

    const registerTag = async (payload: RegisterEpcTagDto) => {
        registering.value = true;
        submittingError.value = null;
        try {
            const tag = await rfidService.registerTag(payload);
            await fetchTags();
            return tag;
        } catch (err) {
            submittingError.value = normalizeError(err);
            throw err;
        } finally {
            registering.value = false;
        }
    };

    const encodeTag = async (id: string, payload: EncodeEpcTagDto) => {
        encoding.value = true;
        submittingError.value = null;
        try {
            const tag = await rfidService.encodeTag(id, payload);
            selectedTag.value = tag;
            items.value = items.value.map((existing) =>
                existing.id === tag.id ? tag : existing,
            );
            return tag;
        } catch (err) {
            submittingError.value = normalizeError(err);
            throw err;
        } finally {
            encoding.value = false;
        }
    };

    const deleteTag = async (id: string) => {
        deleting.value = true;
        submittingError.value = null;
        try {
            await rfidService.deleteTag(id);
            items.value = items.value.filter((tag) => tag.id !== id);
        } catch (err) {
            submittingError.value = normalizeError(err);
            throw err;
        } finally {
            deleting.value = false;
        }
    };

    const refreshList = () => fetchTags();

    const setPage = (value: number) => {
        pagination.page = Math.max(1, value);
        return fetchTags();
    };

    const setLimit = (value: number) => {
        pagination.limit = value;
        pagination.page = 1;
        return fetchTags();
    };

    const setFilters = (payload: RfidTagListParams) => {
        filters.value = { ...payload };
        pagination.page = 1;
        return fetchTags();
    };

    if (autoFetch) {
        void fetchTags();
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
        selectedTag,
        fetchTagDetail,
        detailLoading,
        detailError,
        registering,
        encoding,
        deleting,
        submittingError,
        registerTag,
        encodeTag,
        deleteTag,
        fetchTags,
        refreshList,
        setPage,
        setLimit,
        setFilters,
        paginationMeta: computed(() => pagination),
    };
}
