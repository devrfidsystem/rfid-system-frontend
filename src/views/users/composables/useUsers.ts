import { computed, reactive, ref, watch } from "vue";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { usersService } from "@/services/users.service";

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
        return String(value);
    };

    const displayRows = computed(() =>
        users.value.map((user, index) => ({
            id: String(user.id ?? `user-${index}`),
            email: formatValue(user.email),
            fullName: formatValue(user.fullName),
            roles: formatValue(
                Array.isArray(user.roles) ? user.roles.join(", ") : user.roles,
            ),
            companyId: formatValue(user.companyId ?? user.currentCompanyId),
            isActive: formatValue(user.isActive),
            createdAt: formatValue(user.createdAt),
        })),
    );

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
        displayRows,
        refresh,
    };
}
