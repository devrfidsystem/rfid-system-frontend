export type TransactionStatusTone =
    "neutral" | "success" | "warning" | "error" | "info" | "teal";

const WARNING_STATUSES = new Set([
    "draft",
    "pending",
    "processing",
    "queued",
    "counting",
    "assigned",
    "in_progress",
]);

const INFO_STATUSES = new Set(["posted", "dispatched"]);

const SUCCESS_STATUSES = new Set([
    "done",
    "completed",
    "closed",
    "reconciled",
    "approved",
    "success",
]);

const ERROR_STATUSES = new Set([
    "canceled",
    "cancelled",
    "failed",
    "error",
    "rejected",
    "void",
    "voided",
]);

const normalizeStatus = (value?: string | null): string =>
    (value ?? "").trim().toLowerCase();

export const getTransactionStatusTone = (
    value?: string | null,
): TransactionStatusTone => {
    const status = normalizeStatus(value);
    if (!status) return "neutral";
    if (WARNING_STATUSES.has(status)) return "warning";
    if (INFO_STATUSES.has(status)) return "info";
    if (status === "partial") return "teal";
    if (SUCCESS_STATUSES.has(status)) return "success";
    if (ERROR_STATUSES.has(status)) return "error";
    return "neutral";
};

export const formatTransactionStatus = (value?: string | null): string => {
    const status = (value ?? "").replace(/[_-]+/g, " ").trim();
    if (!status) return "-";
    return status.replace(/\b\w/g, (char) => char.toUpperCase());
};
