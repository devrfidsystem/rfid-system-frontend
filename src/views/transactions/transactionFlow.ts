import type { TransactionKey } from "@/services/transactions.service";

export type TransactionDetailAction = "post" | "cancel" | "complete" | "edit";

const normalizeStatus = (status?: string | null) =>
    (status ?? "").trim().toLowerCase();

const actionRules: Partial<
    Record<TransactionKey, Partial<Record<TransactionDetailAction, string[]>>>
> = {
    register: {
        post: ["draft"],
        cancel: ["draft"],
        edit: ["draft"],
    },
    inbound: {
        post: ["draft"],
        cancel: ["draft"],
    },
    putaway: {
        post: ["draft"],
        cancel: ["draft", "posted"],
        complete: ["posted"],
    },
    outbound: {
        post: ["draft"],
        cancel: ["draft"],
    },
    relocation: {
        post: ["draft"],
        cancel: ["draft"],
    },
    transfer: {
        post: ["draft"],
        cancel: ["draft"],
    },
    return: {
        post: ["draft"],
        cancel: ["draft"],
    },
    returns: {
        post: ["draft"],
        cancel: ["draft"],
    },
};

export const canRunTransactionAction = (
    transactionKey: TransactionKey,
    status: string | null | undefined,
    action: TransactionDetailAction,
) => {
    const allowedStatuses = actionRules[transactionKey]?.[action] ?? [];
    return allowedStatuses.includes(normalizeStatus(status));
};

export const isTerminalTransactionStatus = (status?: string | null) => {
    const normalized = normalizeStatus(status);
    return ["posted", "done", "canceled", "cancelled", "closed"].includes(
        normalized,
    );
};
