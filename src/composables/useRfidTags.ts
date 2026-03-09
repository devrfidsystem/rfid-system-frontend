import { ref } from 'vue';
import type { ApiResponse } from '@/lib/api/response';
import { rfidService, type EpcEvent, type EpcTag, type EpcTagListParams, type EncodeEpcPayload, type RegisterEpcPayload } from '@/services/rfid';

interface UseRfidTagsOptions {
  autoFetch?: boolean;
  initialListParams?: EpcTagListParams;
}

export function useRfidTags({ autoFetch = true, initialListParams }: UseRfidTagsOptions = {}) {
  const items = ref<EpcTag[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const page = ref(initialListParams?.page ?? 1);
  const limit = ref(initialListParams?.limit ?? 20);
  const total = ref(0);
  const totalPages = ref(1);

  const selectedTag = ref<EpcTag | null>(null);
  const detailLoading = ref(false);
  const detailError = ref<string | null>(null);

  const registering = ref(false);
  const encoding = ref(false);
  const submittingError = ref<string | null>(null);

  const events = ref<EpcEvent[]>([]);
  const eventsLoading = ref(false);
  const eventsError = ref<string | null>(null);

  const normalizeError = (response: unknown) => {
    if (response instanceof Error) return response.message;
    if (typeof response === 'string') return response;
    return 'Something went wrong';
  };

  const syncMeta = (meta?: ApiResponse<EpcTag[]>['meta']) => {
    if (!meta) return;
    if (meta.page) page.value = meta.page;
    if (meta.limit) limit.value = meta.limit;
    total.value = meta.total ?? items.value.length;
    totalPages.value = meta.totalPages ?? Math.max(1, Math.ceil(total.value / (limit.value || 1)));
  };

  const fetchTags = async (params: EpcTagListParams = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const payload = { page: page.value, limit: limit.value, ...initialListParams, ...params };
      const response = await rfidService.listTags(payload);
      items.value = response.data;
      syncMeta(response.meta);
      return response;
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
      const response = await rfidService.getTagById(id);
      selectedTag.value = response.data;
      return response;
    } catch (err) {
      detailError.value = normalizeError(err);
      throw err;
    } finally {
      detailLoading.value = false;
    }
  };

  const registerTag = async (payload: RegisterEpcPayload) => {
    registering.value = true;
    submittingError.value = null;
    try {
      const response = await rfidService.registerTag(payload);
      items.value = [response.data, ...items.value];
      total.value += 1;
      return response;
    } catch (err) {
      submittingError.value = normalizeError(err);
      throw err;
    } finally {
      registering.value = false;
    }
  };

  const encodeTag = async (payload: EncodeEpcPayload) => {
    encoding.value = true;
    submittingError.value = null;
    try {
      const response = await rfidService.encodeTag(payload);
      selectedTag.value = response.data;
      items.value = items.value.map((tag) => (tag.id === response.data.id ? response.data : tag));
      return response;
    } catch (err) {
      submittingError.value = normalizeError(err);
      throw err;
    } finally {
      encoding.value = false;
    }
  };

  const fetchEvents = async (params: Parameters<typeof rfidService.listEvents>[0] = {}) => {
    eventsLoading.value = true;
    eventsError.value = null;
    try {
      const response = await rfidService.listEvents(params);
      events.value = response.data;
      return response;
    } catch (err) {
      eventsError.value = normalizeError(err);
      throw err;
    } finally {
      eventsLoading.value = false;
    }
  };

  const refreshList = () => fetchTags(initialListParams ?? {});

  if (autoFetch) {
    void fetchTags(initialListParams ?? {});
  }

  return {
    items,
    loading,
    error,
    total,
    totalPages,
    page,
    limit,
    fetchTags,
    refreshList,
    selectedTag,
    fetchTagDetail,
    detailLoading,
    detailError,
    registering,
    encoding,
    submittingError,
    registerTag,
    encodeTag,
    events,
    eventsLoading,
    eventsError,
    fetchEvents
  };
}
