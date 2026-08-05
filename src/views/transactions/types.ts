export interface TransactionRecord {
    id?: string;
    docNo?: string;
    status?: string;
    companyId?: string;
    warehouseId?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface TransactionSummaryStatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface TransactionSummaryMostRecent {
    docNo: string;
    createdByName: string | null;
    createdAt: string;
}

export interface TransactionSummaryNeedsAttention {
    count: number;
    canceledCount: number;
    staleDraftCount: number;
}

export interface TransactionSummaryResponse {
    totalCount: number;
    statusBreakdown: TransactionSummaryStatusCount[];
    mostRecent: TransactionSummaryMostRecent | null;
    needsAttention: TransactionSummaryNeedsAttention;
}
