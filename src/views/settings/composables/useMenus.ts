/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch } from "vue";
import { settingsService } from "@/services/settings.service";
import { useNotifier } from "@/composable/useNotifier";

export interface MenuRecord {
    id: string;
    appId: string;
    code: string;
    name: string;
    path?: string;
    icon?: string;
    sequence: number;
}

export function useMenus() {
    const { withToast, notifyError } = useNotifier();

    const apps = ref<Array<{ id: string; name: string }>>([]);
    const appOptions = ref<{ label: string; value: string }[]>([]);
    const selectedAppId = ref("");
    const loadingApps = ref(true);

    const rows = ref<MenuRecord[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isModalOpen = ref(false);
    const isEditing = ref(false);
    const submitting = ref(false);
    const currentId = ref("");

    const form = ref({
        appId: "",
        code: "",
        name: "",
        path: "",
        icon: "",
        sequence: "0",
    });

    const columns = [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "path", label: "Path" },
        { key: "sequence", label: "Sequence" },
        { key: "actions", label: "" },
    ];

    const tableRows = computed(() => {
        return rows.value
            .map((r) => ({
                id: r.id,
                code: r.code,
                name: r.name,
                path: r.path || "-",
                sequence: r.sequence || 0,
                original: r,
            }))
            .sort((a, b) => a.sequence - b.sequence) as Record<string, any>[];
    });

    const loadApps = async () => {
        loadingApps.value = true;
        try {
            const response = await settingsService.fetchList("apps");
            apps.value =
                (response.items as Array<{ id: string; name: string }>) || [];
            appOptions.value = apps.value.map((app) => ({
                label: app.name,
                value: String(app.id),
            }));
            if (appOptions.value.length > 0) {
                selectedAppId.value = appOptions.value[0].value;
            }
        } catch (err) {
            notifyError(
                err instanceof Error ? err.message : "Failed to load apps",
            );
        } finally {
            loadingApps.value = false;
        }
    };

    const loadMenus = async () => {
        if (!selectedAppId.value) return;
        loading.value = true;
        error.value = null;
        try {
            const menus = await settingsService.getAppMenus(
                selectedAppId.value,
            );
            rows.value = menus as MenuRecord[];
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : "Failed to load menus";
            rows.value = [];
        } finally {
            loading.value = false;
        }
    };

    watch(selectedAppId, () => {
        void loadMenus();
    });

    const openCreateModal = () => {
        form.value = {
            appId: selectedAppId.value,
            code: "",
            name: "",
            path: "",
            icon: "",
            sequence: "0",
        };
        isEditing.value = false;
        currentId.value = "";
        isModalOpen.value = true;
    };

    const openEditModal = (row: { original: MenuRecord }) => {
        const original = row.original;
        form.value = {
            appId: original.appId || selectedAppId.value,
            code: original.code,
            name: original.name,
            path: original.path || "",
            icon: original.icon || "",
            sequence: String(original.sequence || 0),
        };
        isEditing.value = true;
        currentId.value = original.id;
        isModalOpen.value = true;
    };

    const handleSubmit = async () => {
        submitting.value = true;
        try {
            const payload = {
                ...form.value,
                sequence: Number(form.value.sequence),
            };

            await withToast(
                async () => {
                    if (isEditing.value) {
                        await settingsService.update(
                            "menus",
                            currentId.value,
                            payload,
                        );
                    } else {
                        await settingsService.create("menus", payload);
                    }
                },
                {
                    successMessage: isEditing.value
                        ? "Menu updated successfully"
                        : "Menu created successfully",
                    errorMessage: "Failed to save menu",
                },
            );

            isModalOpen.value = false;
            await loadMenus();
        } finally {
            submitting.value = false;
        }
    };

    return {
        columns,
        apps,
        appOptions,
        selectedAppId,
        loadingApps,
        rows,
        loading,
        error,
        isModalOpen,
        isEditing,
        submitting,
        form,
        tableRows,
        loadApps,
        loadMenus,
        openCreateModal,
        openEditModal,
        handleSubmit,
    };
}
