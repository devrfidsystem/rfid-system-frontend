import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { reportConfigs } from "@/views/report/reportConfig";
import type { TransactionRecord } from "../types";
import { useNotifier } from "@/composable/useNotifier";

export function useTransactionDetail(
    transactionKey: TransactionKey,
    id: string,
) {
    const router = useRouter();
    const { notifyError, notifySuccess } = useNotifier();

    const loading = ref(true);
    const actionLoading = ref(false);
    const error = ref<string | null>(null);
    const record = ref<TransactionRecord | null>(null);

    const config = computed(() => {
        const keyMap: Record<string, string> = {
            register: "register",
            inbound: "inbound",
            outbound: "outbound",
            relocation: "relocation",
            transfer: "transfer",
            return: "return",
            opname: "stock-opname",
        };
        const reportKey = keyMap[transactionKey] || transactionKey;
        return reportConfigs[reportKey as keyof typeof reportConfigs];
    });

    const headerColumns = computed(() => {
        return config.value?.columns || [];
    });

    const pageTitle = computed(() => {
        return record.value?.docNo || "Transaction Detail";
    });

    const pageDescription = computed(() => {
        return `Details for ${transactionKey} transaction`;
    });

    const lines = computed(() => {
        if (!record.value) return [];
        return (record.value.lines || record.value.items || []) as {
            id?: string;
            product?: { name?: string; code?: string };
            productName?: string;
            productCode?: string;
            productId?: string;
            expectedQty?: number;
            qty?: number;
            actualQty?: number;
            uom?: { code?: string };
            uomId?: string;
        }[];
    });

    const handleBack = () => {
        router.push(`/transactions/${transactionKey}`);
    };

    const loadTransaction = async () => {
        loading.value = true;
        error.value = null;
        try {
            record.value = await transactionService.get(transactionKey, id);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load transaction details.";
            notifyError(error.value);
        } finally {
            loading.value = false;
        }
    };

    const handlePost = async () => {
        if (!confirm("Are you sure you want to post this transaction?")) return;
        actionLoading.value = true;
        try {
            await transactionService.post(transactionKey, id);
            notifySuccess("Transaction posted successfully.");
            await loadTransaction();
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to post transaction.",
            );
        } finally {
            actionLoading.value = false;
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this transaction?"))
            return;
        actionLoading.value = true;
        try {
            await transactionService.cancel(transactionKey, id);
            notifySuccess("Transaction canceled successfully.");
            await loadTransaction();
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to cancel transaction.",
            );
        } finally {
            actionLoading.value = false;
        }
    };

    return {
        loading,
        actionLoading,
        error,
        record,
        headerColumns,
        pageTitle,
        pageDescription,
        lines,
        handleBack,
        loadTransaction,
        handlePost,
        handleCancel,
    };
}
