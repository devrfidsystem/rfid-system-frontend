import { computed, onMounted, ref, watch } from "vue";
import { z } from "zod";
import { parseApiError } from "@/lib/api/parseApiError";
import { useZodForm } from "@/composable/useZodForm";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";
import { masterService } from "@/services/master.service";
import { useRfidTags } from "@/composable/useRfidTags";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import type { RegisterEpcTagDto, RfidTag } from "@/api/feature/dto/rfid.dto";
import { formatDate } from "@/utils/date";

const tagTypes = ["Asset", "Pallet", "Unit"];
const tagTypeOptions = tagTypes.map((type) => ({ label: type, value: type }));

const schema = z.object({
    epc: z.string().nonempty("EPC diperlukan"),
    tagType: z.string().nonempty("Pilih tipe tag"),
    companyId: z.string().nonempty("Pilih perusahaan"),
    productId: z.string().nonempty("Pilih produk"),
    location: z.string().optional(),
    notes: z.string().optional(),
});

export function useTagRegistration() {
    const authStore = useAuthStore();
    const { withToast } = useNotifier();

    const initialValues: z.infer<typeof schema> = {
        epc: "",
        tagType: "",
        companyId: authStore.currentCompanyId ?? "",
        productId: "",
        location: "",
        notes: "",
    };

    const { handleSubmit, meta, resetForm, isSubmitting, setFieldValue } =
        useZodForm(schema, initialValues);

    const fieldErrors = ref<Record<string, string>>({});
    const submitError = ref("");

    const companies = computed(() => authStore.profile?.companies ?? []);
    const companyOptions = computed(() =>
        companies.value.map((company) => ({
            label: `${company.companyName} (${company.companyId})`,
            value: company.companyId,
        })),
    );

    const productOptions = ref<Array<{ label: string; value: string }>>([]);
    const productLoading = ref(false);
    const productError = ref<string | null>(null);

    const ensureProductOptions = async () => {
        productLoading.value = true;
        productError.value = null;
        try {
            const opts = await masterService.fetchOptions("products");
            productOptions.value = opts.map((p) => {
                const item = p as { id: string | number; name?: string };
                return {
                    value: String(item.id),
                    label: String(item.name ?? item.id),
                };
            });
        } catch (error) {
            productError.value =
                error instanceof Error
                    ? error.message
                    : "Tidak dapat memuat produk.";
        } finally {
            productLoading.value = false;
        }
    };

    watch(
        () => authStore.profile?.companies,
        () => {
            if (!meta.value?.valid && companyOptions.value.length) {
                setFieldValue("companyId", companyOptions.value[0].value);
            }
        },
    );

    const {
        items: tags,
        loading: tagsLoading,
        error: tagsError,
        pagination,
        pageSizeOptions,
        setPage,
        setLimit,
        setFilters,
        registerTag: registerTagWithRefresh,
    } = useRfidTags({ autoFetch: true, initialListParams: { limit: 10 } });

    const tagSearch = ref("");
    const tagEmptyStateVariant = computed<"default" | "search" | "filter">(
        () => (tagSearch.value.trim().length ? "search" : "default"),
    );

    const tagColumns = [
        { key: "epcCode", label: "EPC" },
        { key: "status", label: "Status" },
        { key: "productId", label: "Product" },
        { key: "warehouseId", label: "Warehouse" },
        { key: "createdAt", label: "Created" },
    ];

    const displayTags = computed<Record<string, string | number>[]>(() =>
        tags.value.map((tag: RfidTag) => ({
            id: tag.id,
            epcCode: tag.epcCode,
            status: tag.status,
            productId: tag.productId ?? "-",
            warehouseId: tag.warehouseId ?? "-",
            createdAt: formatDate(tag.createdAt),
        })),
    );

    const handleTagSearch = () => {
        void setFilters({ search: tagSearch.value || undefined });
    };

    useDebouncedWatch(tagSearch, handleTagSearch);

    watch(
        () => authStore.currentCompanyId,
        (id) => {
            if (id) {
                setFieldValue("companyId", id);
            }
        },
        { immediate: true },
    );

    const onSubmit = handleSubmit(async (rawValues) => {
        const values = rawValues as z.infer<typeof schema>;
        fieldErrors.value = {};
        submitError.value = "";
        const payload: RegisterEpcTagDto = {
            companyId: values.companyId,
            productId: values.productId,
            epcCode: values.epc,
        };
        try {
            await withToast(
                async () => {
                    await registerTagWithRefresh(payload);
                },
                {
                    successMessage: "Tag berhasil didaftarkan",
                    errorMessage: "Gagal mendaftarkan tag",
                },
            );
            resetForm();
        } catch (err) {
            try {
                const parsed = parseApiError(err as unknown);
                fieldErrors.value = parsed.fieldErrors ?? {};
                submitError.value = parsed.message ?? "Gagal mendaftarkan tag";
            } catch {
                submitError.value =
                    err instanceof Error ? err.message : String(err);
            }
            throw err;
        }
    });

    onMounted(() => {
        void ensureProductOptions();
    });

    return {
        tagTypeOptions,
        companyOptions,
        productOptions,
        productLoading,
        productError,
        isSubmitting,
        meta,
        fieldErrors,
        submitError,
        onSubmit,
        resetForm,
        tagsLoading,
        tagsError,
        tagSearch,
        tagEmptyStateVariant,
        tagColumns,
        displayTags,
        pagination,
        pageSizeOptions,
        setPage,
        setLimit,
        handleTagSearch,
    };
}
