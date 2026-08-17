export type OpnameNodeType = "group" | "profile" | "task";

export interface OpnameTreeNode {
    id: string;
    parentId: string | null;
    companyId: string;
    warehouse_id: string;
    profile_id: string;
    title: string;
    description: string | null;
    task_group: string | null;
    task_period: string | null;
    status: string;
    nodeType: OpnameNodeType;
    createdAt?: string | null;
    updatedAt?: string | null;
    children?: OpnameTreeNode[];
}

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
