import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { reportConfigs } from "@/domain/report/reportConfig";
import type { TransactionRecord } from "../types";
import { useNotifier } from "@/composable/useNotifier";
import {
    formatTransactionStatus,
    getTransactionStatusTone,
} from "../utils/transactionStatus";

type TransactionConfirmationAction = "post" | "cancel" | "complete";

type TransactionConfirmationState = {
    action: TransactionConfirmationAction;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: "primary" | "danger";
};

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
    const confirmation = ref<TransactionConfirmationState | null>(null);
    const isInbound = computed(() => transactionKey === "inbound");
    const isPutaway = computed(() => transactionKey === "putaway");
    const isRelocation = computed(() => transactionKey === "relocation");
    const isOutbound = computed(() => transactionKey === "outbound");

    const config = computed(() => {
        const keyMap: Record<string, string> = {
            register: "register",
            inbound: "inbound",
            putaway: "putaway",
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
        return String(
            record.value?.docNo ??
                record.value?.docNumber ??
                "Transaction Detail",
        );
    });

    const pageDescription = computed(() => {
        if (isOutbound.value) {
            if ((record.value?.status ?? "").toLowerCase() === "draft") {
                return "Review outbound draft details before posting.";
            }
            return "Review outbound document details and execution status.";
        }
        if (isRelocation.value) {
            return "Details for relocation transaction";
        }
        if (transactionKey === "register" || transactionKey === "putaway") {
            return `Details for ${transactionKey} task`;
        }
        if (isInbound.value) {
            return "Details for inbound document";
        }
        return `Details for ${transactionKey} transaction`;
    });

    const pageTagline = computed(() => {
        if (transactionKey === "register" || transactionKey === "putaway") {
            return "Task Detail";
        }
        if (isInbound.value) {
            return "Document Detail";
        }
        return "Transaction Detail";
    });

    const actionLabel = computed(() => {
        if (transactionKey === "register" || transactionKey === "putaway") {
            return "Task";
        }
        if (isInbound.value) {
            return "Document";
        }
        if (isOutbound.value) {
            return "Outbound document";
        }
        return "Transaction";
    });

    const status = computed(() => record.value?.status ?? "");

    // Putaway is a three-stage lifecycle (draft -> posted -> done) with its
    // own per-status action set; every other type is the standard two-stage
    // draft -> posted/canceled shape where post/cancel only apply to drafts.
    const canPost = computed(
        () => Boolean(record.value) && status.value === "draft",
    );
    const canCancel = computed(() => {
        if (!record.value) return false;
        if (isPutaway.value) {
            return status.value === "draft" || status.value === "posted";
        }
        return status.value === "draft";
    });
    const canComplete = computed(
        () => isPutaway.value && status.value === "posted",
    );

    const canShowActions = computed(
        () => canPost.value || canCancel.value || canComplete.value,
    );

    const isOutboundReadOnly = computed(
        () => isOutbound.value && (record.value?.status ?? "") !== "draft",
    );

    const statusLabel = computed(() =>
        formatTransactionStatus(record.value?.status ?? null),
    );

    const statusTone = computed(() =>
        getTransactionStatusTone(record.value?.status),
    );

    const outboundReviewNote = computed(() => {
        if (!isOutbound.value) return "";
        if ((record.value?.status ?? "") === "draft") {
            return "Draft outbound documents can still be posted or canceled from web admin.";
        }
        return `Read-only review. Outbound execution status is ${formatTransactionStatus(record.value?.status).toLowerCase()}.`;
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
            sourceLocation?: { name?: string; code?: string };
            targetLocation?: { name?: string; code?: string };
            sourceLocationId?: string;
            targetLocationId?: string;
            fromLocation?: { name?: string; code?: string };
            toLocation?: { name?: string; code?: string };
            fromLocationId?: string;
            toLocationId?: string;
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

    const clearConfirmation = () => {
        confirmation.value = null;
    };

    const openConfirmation = (action: TransactionConfirmationAction) => {
        if (isOutboundReadOnly.value) return;
        const label = actionLabel.value.toLowerCase();
        const titleByAction: Record<TransactionConfirmationAction, string> = {
            post: `Post ${actionLabel.value}`,
            cancel: `Cancel ${actionLabel.value}`,
            complete: `Complete ${actionLabel.value}`,
        };
        const descriptionByAction: Record<
            TransactionConfirmationAction,
            string
        > = {
            post: `Are you sure you want to post this ${label}?`,
            cancel: `Are you sure you want to cancel this ${label}?`,
            complete: `Are you sure you want to mark this ${label} as complete?`,
        };
        const confirmTextByAction: Record<
            TransactionConfirmationAction,
            string
        > = {
            post: "Post",
            cancel: "Cancel Task",
            complete: "Complete",
        };
        confirmation.value = {
            action,
            title: titleByAction[action],
            description: descriptionByAction[action],
            confirmText: confirmTextByAction[action],
            cancelText: "Back",
            variant: action === "cancel" ? "danger" : "primary",
        };
    };

    const executePost = async () => {
        if (isOutboundReadOnly.value) return;
        actionLoading.value = true;
        try {
            await transactionService.post(transactionKey, id);
            notifySuccess(`${actionLabel.value} posted successfully.`);
            await loadTransaction();
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : `Failed to post ${actionLabel.value.toLowerCase()}.`,
            );
        } finally {
            actionLoading.value = false;
        }
    };

    const executeCancel = async () => {
        if (isOutboundReadOnly.value) return;
        actionLoading.value = true;
        try {
            await transactionService.cancel(transactionKey, id);
            notifySuccess(`${actionLabel.value} canceled successfully.`);
            await loadTransaction();
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : `Failed to cancel ${actionLabel.value.toLowerCase()}.`,
            );
        } finally {
            actionLoading.value = false;
        }
    };

    const executeComplete = async () => {
        if (!isPutaway.value) return;
        actionLoading.value = true;
        try {
            await transactionService.complete(transactionKey, id);
            notifySuccess(`${actionLabel.value} completed successfully.`);
            await loadTransaction();
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : `Failed to complete ${actionLabel.value.toLowerCase()}.`,
            );
        } finally {
            actionLoading.value = false;
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmation.value) return;
        const action = confirmation.value.action;
        clearConfirmation();
        if (action === "post") {
            await executePost();
            return;
        }
        if (action === "complete") {
            await executeComplete();
            return;
        }
        await executeCancel();
    };

    const handlePost = () => {
        openConfirmation("post");
    };

    const handleCancel = () => {
        openConfirmation("cancel");
    };

    const handleComplete = () => {
        openConfirmation("complete");
    };

    return {
        loading,
        actionLoading,
        error,
        record,
        confirmation,
        headerColumns,
        pageTitle,
        pageDescription,
        pageTagline,
        lines,
        handleBack,
        loadTransaction,
        handlePost,
        handleCancel,
        handleComplete,
        openConfirmation,
        clearConfirmation,
        handleConfirmAction,
        actionLabel,
        canShowActions,
        canPost,
        canCancel,
        canComplete,
        isInbound,
        isPutaway,
        isRelocation,
        isOutbound,
        isOutboundReadOnly,
        statusLabel,
        statusTone,
        outboundReviewNote,
    };
}
