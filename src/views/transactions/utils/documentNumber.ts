import type { TransactionKey } from "@/api/feature/dto/transactions.dto";

const DOCUMENT_PREFIX_BY_TRANSACTION: Record<TransactionKey, string> = {
    register: "REG",
    inbound: "INB",
    putaway: "PUT",
    outbound: "OUT",
    relocation: "REL",
    transfer: "TRF",
    return: "RET",
    returns: "RET",
    opname: "OPN",
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const buildDefaultDocumentNumber = (
    transactionKey: TransactionKey,
    date = new Date(),
): string => {
    const prefix = DOCUMENT_PREFIX_BY_TRANSACTION[transactionKey];
    const year = pad2(date.getFullYear() % 100);
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());

    return `${prefix}-${year}${month}${day}-001`;
};
