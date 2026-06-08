/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from "vue";
import { settingsService } from "@/services/settings.service";
import { useNotifier } from "@/composable/useNotifier";

export interface CompanyRecord {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export function useCompanies() {
    const { withToast } = useNotifier();

    const rows = ref<CompanyRecord[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const isModalOpen = ref(false);
    const isEditing = ref(false);
    const submitting = ref(false);
    const currentId = ref("");

    const form = ref({
        code: "",
        name: "",
        description: "",
        isActive: true,
    });

    const columns = [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "status", label: "Status" },
        { key: "actions", label: "" },
    ];

    const tableRows = computed(() => {
        return rows.value.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            status: r.isActive ? "Active" : "Inactive",
            original: r,
        })) as Record<string, any>[];
    });

    const loadData = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await settingsService.fetchList("companies");
            rows.value = (response.items as CompanyRecord[]) || [];
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : "Failed to load companies";
        } finally {
            loading.value = false;
        }
    };

    const openCreateModal = () => {
        form.value = { code: "", name: "", description: "", isActive: true };
        isEditing.value = false;
        currentId.value = "";
        isModalOpen.value = true;
    };

    const openEditModal = (row: { original: CompanyRecord }) => {
        const original = row.original;
        form.value = {
            code: original.code,
            name: original.name,
            description: original.description || "",
            isActive: original.isActive ?? true,
        };
        isEditing.value = true;
        currentId.value = original.id;
        isModalOpen.value = true;
    };

    const handleSubmit = async () => {
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    if (isEditing.value) {
                        await settingsService.update(
                            "companies",
                            currentId.value,
                            form.value,
                        );
                    } else {
                        await settingsService.create("companies", form.value);
                    }
                },
                {
                    successMessage: isEditing.value
                        ? "Company updated successfully"
                        : "Company created successfully",
                    errorMessage: "Failed to save company",
                },
            );
            isModalOpen.value = false;
            await loadData();
        } finally {
            submitting.value = false;
        }
    };

    return {
        columns,
        rows,
        loading,
        error,
        isModalOpen,
        isEditing,
        submitting,
        form,
        tableRows,
        loadData,
        openCreateModal,
        openEditModal,
        handleSubmit,
    };
}
