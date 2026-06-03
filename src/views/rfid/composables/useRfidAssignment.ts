import { computed, ref, watch } from "vue";
import { useNotifier } from "@/composable/useNotifier";
import { useRfidTags } from "@/composable/useRfidTags";
import { rfidService } from "@/services/rfid.service";
import { parseApiError } from "@/lib/api/parseApiError";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";

export function useRfidAssignment() {
    const { withToast } = useNotifier();
    const {
        items: tags,
        loading: tagsLoading,
        error: tagsError,
        pagination,
        pageSizeOptions,
        setPage,
        setLimit,
        setFilters,
        fetchTags,
    } = useRfidTags({ autoFetch: true, initialListParams: { limit: 10 } });

    const tagSearch = ref("");
    const selectedTagId = ref("");
    const locationId = ref("");
    const documentRef = ref("");
    const assignError = ref<string | null>(null);
    const fieldErrors = ref<Record<string, string>>({});
    const isAssigning = ref(false);

    const tagOptions = computed(() =>
        tags.value.map((tag) => ({
            label: `${tag.epcCode} · ${tag.status}`,
            value: tag.id,
        })),
    );

    const tableColumns = [
        { key: "epcCode", label: "EPC" },
        { key: "status", label: "Status" },
        { key: "productId", label: "Product" },
        { key: "warehouseId", label: "Warehouse" },
        { key: "locationId", label: "Location" },
        { key: "createdAt", label: "Created" },
    ];

    const displayTags = computed(() =>
        tags.value.map((tag) => ({
            id: tag.id,
            epcCode: tag.epcCode,
            status: tag.status,
            productId: tag.productId ?? "-",
            warehouseId: tag.warehouseId ?? "-",
            locationId: tag.locationId ?? "-",
            createdAt: tag.createdAt
                ? new Date(tag.createdAt).toLocaleString()
                : "-",
        })),
    );

    const refreshTags = () => {
        void fetchTags();
    };

    watch(tags, (items) => {
        if (!selectedTagId.value && items.length) {
            selectedTagId.value = items[0].id;
        }
    });

    useDebouncedWatch(
        () => tagSearch.value,
        () => {
            setFilters({ search: tagSearch.value || undefined });
        },
    );

    const assignTag = async () => {
        if (!selectedTagId.value || !locationId.value) {
            assignError.value = "Tag and location are required.";
            return;
        }
        assignError.value = null;
        fieldErrors.value = {};
        isAssigning.value = true;

        try {
            await withToast(
                async () => {
                    await rfidService.assignTag(selectedTagId.value, {
                        locationId: locationId.value,
                        docReference: documentRef.value || undefined,
                    });
                    await fetchTags();
                },
                {
                    successMessage: "Tag assigned",
                    errorMessage: "Failed to assign tag",
                },
            );
            locationId.value = "";
            documentRef.value = "";
        } catch (err) {
            try {
                const parsed = parseApiError(err);
                fieldErrors.value = parsed.fieldErrors ?? {};
                assignError.value =
                    parsed.message ??
                    (err instanceof Error
                        ? err.message
                        : "Unable to assign tag.");
            } catch {
                assignError.value =
                    err instanceof Error
                        ? err.message
                        : "Unable to assign tag.";
            }
        } finally {
            isAssigning.value = false;
        }
    };

    return {
        tagsLoading,
        tagsError,
        pagination,
        pageSizeOptions,
        setPage,
        setLimit,
        tagSearch,
        selectedTagId,
        locationId,
        documentRef,
        assignError,
        fieldErrors,
        isAssigning,
        tagOptions,
        tableColumns,
        displayTags,
        refreshTags,
        assignTag,
    };
}
