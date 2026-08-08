export interface OpnameSummaryStatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface OpnameSummaryMostRecent {
    title: string;
    createdByName: string | null;
    createdAt: string;
}

export interface OpnameSummaryNeedsAttention {
    count: number;
    canceledCount: number;
    stuckCountingCount: number;
}

export interface OpnameSummaryResponse {
    totalCount: number;
    statusBreakdown: OpnameSummaryStatusCount[];
    varianceTaskCount: number;
    needsAttention: OpnameSummaryNeedsAttention;
    mostRecent: OpnameSummaryMostRecent | null;
}
