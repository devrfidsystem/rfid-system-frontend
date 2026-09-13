import { computed, reactive, ref, watch } from "vue";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { usersService } from "@/services/users.service";
import { formatDate } from "@/utils/date";

const columns = [
    { key: "email", label: "Email" },
    { key: "fullName", label: "Name" },
    { key: "roles", label: "Roles" },
    { key: "companyId", label: "Company" },
    { key: "isActive", label: "Active" },
    { key: "createdAt", label: "Created At" },
];

export function useUsers() {
    const keyword = ref("");
    const users = ref<Record<string, unknown>[]>([]);
    const sortOrder = ref<"desc" | "asc">("desc");
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pagination = reactive({
        page: 1,
        limit: 20,
        total: 0,
    });
    const pageSizeOptions = [10, 20, 50];

    const formatValue = (value: unknown) => {
        if (value === undefined || value === null) {
            return "-";
        }
        if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
            return formatDate(value);
        }
        return String(value);
    };

    const toggleSort = () => {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    };

    const displayRows = computed(() => {
        const sorted = [...users.value].sort((a, b) => {
            const dateA = new Date(
                (a.createdAt ?? 0) as string | number,
            ).getTime();
            const dateB = new Date(
                (b.createdAt ?? 0) as string | number,
            ).getTime();
            return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
        });

        return sorted.map((user) => ({
            id: String(user.id),
            email: formatValue(user.email),
            fullName: formatValue(user.fullName),
            roles: Array.isArray(user.roles)
                ? user.roles.join(", ")
                : formatValue(user.roles),
            companyId: formatValue(user.companyId),
            isActive: formatValue(user.isActive),
            createdAt: formatValue(user.createdAt),
        }));
    });

    const loadUsers = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await usersService.list({
                page: pagination.page,
                limit: pagination.limit,
                search: keyword.value || undefined,
            });
            users.value = response.items;
            pagination.total = response.meta?.total ?? users.value.length;
        } catch (err) {
            users.value = [];
            pagination.total = 0;
            error.value =
                err instanceof Error ? err.message : "Unable to load users.";
        } finally {
            loading.value = false;
        }
    };

    const refresh = () => {
        pagination.page = 1;
        void loadUsers();
    };

    useDebouncedWatch(keyword, () => {
        pagination.page = 1;
        void loadUsers();
    });

    watch(
        () => [pagination.page, pagination.limit],
        ([page, limit], [oldPage, oldLimit]) => {
            if (limit !== oldLimit && page !== 1) {
                pagination.page = 1;
                return;
            }
            if (page !== oldPage || limit !== oldLimit) {
                void loadUsers();
            }
        },
    );

    void loadUsers();

    return {
        columns,
        keyword,
        loading,
        error,
        pagination,
        pageSizeOptions,
        sortOrder,
        toggleSort,
        displayRows,
        refresh,
    };
}
