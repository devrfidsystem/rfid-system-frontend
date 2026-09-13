import type { TransactionKey } from "@/services/transactions.service";
import { usePermission } from "@/composable/usePermission";

const transactionPermissionCodes: Record<TransactionKey, string> = {
    register: "TRANSACTION_REGISTER",
    inbound: "TRANSACTION_INBOUND",
    putaway: "TRANSACTION_PUTAWAY",
    outbound: "TRANSACTION_OUTBOUND",
    relocation: "TRANSACTION_RELOCATION",
    return: "TRANSACTION_RETURN",
    returns: "TRANSACTION_RETURNS",
    opname: "TRANSACTION_OPNAME",
};

export const useTransactionPermission = (transactionKey: TransactionKey) =>
    usePermission(transactionPermissionCodes[transactionKey]);
