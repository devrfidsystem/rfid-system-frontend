export interface TransactionRecord {
    id?: string;
    docNo?: string;
    status?: string;
    companyId?: string;
    warehouseId?: string;
    [key: string]: string | number | boolean | null | undefined;
}
