import { computed, type Ref } from "vue";
import type { TransactionRecord } from "../types";

export interface StatusCount {
    label: string;
    count: number;
}

export interface DateRangeSummary {
    earliest: string | null;
    latest: string | null;
}

export function useTransactionSummary(
    rows: Ref<TransactionRecord[]>,
    pagination: { total: number },
) {
    const totalCount = computed(() => pagination.total);

    const statusBreakdown = computed<StatusCount[]>(() => {
        const counts = new Map<string, number>();
        for (const row of rows.value) {
            if (row.status === undefined || row.status === null) continue;
            const label = String(row.status);
            counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        return Array.from(counts.entries()).map(([label, count]) => ({
            label,
            count,
        }));
    });

    const dateRange = computed<DateRangeSummary>(() => {
        let earliestTime: number | null = null;
        let latestTime: number | null = null;
        let earliestValue: string | null = null;
        let latestValue: string | null = null;

        for (const row of rows.value) {
            const raw = row.date ?? row.createdAt;
            if (raw === undefined || raw === null) continue;
            const time = new Date(raw as string | number).getTime();
            if (isNaN(time)) continue;

            if (earliestTime === null || time < earliestTime) {
                earliestTime = time;
                earliestValue = String(raw);
            }
            if (latestTime === null || time > latestTime) {
                latestTime = time;
                latestValue = String(raw);
            }
        }

        return { earliest: earliestValue, latest: latestValue };
    });

    return { totalCount, statusBreakdown, dateRange };
}
