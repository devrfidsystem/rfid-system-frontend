<template>
    <div class="grid gap-4 sm:grid-cols-3" object-id="wdg_OpnameSummary">
        <template v-if="loading">
            <SkeletonBlock
                v-for="n in 5"
                :key="n"
                height="h-28"
            />
        </template>

        <Card v-else-if="error" class="sm:col-span-3">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card v-else-if="summary?.totalCount === 0" class="sm:col-span-3">
            <p class="text-sm text-text-secondary">
                No stock count tasks match this warehouse.
            </p>
        </Card>

        <template v-else-if="summary">
            <MetricSummaryCard
                label="Total Tasks"
                :value="summary.totalCount.toLocaleString()"
                :icon="FileText"
                tone="primary"
            />

            <MetricSummaryCard label="Count Status" :icon="Tags">
                <div class="flex flex-wrap gap-2">
                    <Badge
                        v-for="item in summary.statusBreakdown"
                        :key="item.status"
                        :tone="statusTone(item.status)"
                    >
                        {{ item.status }} {{ item.count.toLocaleString() }} ({{
                            item.percentage.toFixed(1)
                        }}%)
                    </Badge>
                </div>
            </MetricSummaryCard>

            <MetricSummaryCard
                label="Variance"
                :value="summary.varianceTaskCount.toLocaleString()"
                description="task(s) with a counting discrepancy"
                :icon="Scale"
                tone="info"
            />

            <MetricSummaryCard
                label="Exception Queue"
                :icon="
                    summary.needsAttention.count > 0
                        ? AlertTriangle
                        : CheckCircle2
                "
                :tone="summary.needsAttention.count > 0 ? 'danger' : 'success'"
            >
                <template v-if="summary.needsAttention.count > 0">
                    <p class="text-2xl font-semibold text-danger-600">
                        {{ summary.needsAttention.count.toLocaleString() }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.needsAttention.canceledCount }} cancelled,
                        {{ summary.needsAttention.stuckCountingCount }} counts
                        over 3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600">
                    No open count exceptions
                </p>
            </MetricSummaryCard>

            <MetricSummaryCard label="Latest Count Task" :icon="Clock" tone="info">
                <template v-if="summary.mostRecent">
                    <p class="text-sm font-medium text-text">
                        {{ summary.mostRecent.title }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary">
                    No count task has been created yet.
                </p>
            </MetricSummaryCard>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import MetricSummaryCard from "@/components/molecules/MetricSummaryCard.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import Badge from "@/components/atoms/Badge.vue";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Scale,
    Tags,
} from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { OpnameSummaryResponse } from "../opnameSummary";

defineProps<{
    loading: boolean;
    error: string | null;
    summary: OpnameSummaryResponse | null;
}>();

// Purely presentational grouping of Opname's own status vocabulary
// (draft/counting/reconciled/closed/canceled) into the Badge atom's
// existing tone set. Defined locally rather than imported from the
// sibling TransactionSummaryWidget.vue to keep this component
// self-contained — its tone sets happen to be a superset that already
// covers Opname's statuses too, but importing across unrelated view
// folders for a same-output mapping isn't worth the coupling.
const SUCCESS_STATUSES = new Set(["closed", "reconciled"]);
const WARNING_STATUSES = new Set(["counting", "draft"]);
const ERROR_STATUSES = new Set(["canceled", "cancelled"]);

const statusTone = (
    label: string,
): "success" | "warning" | "error" | "neutral" => {
    const normalized = label.toLowerCase();
    if (SUCCESS_STATUSES.has(normalized)) return "success";
    if (WARNING_STATUSES.has(normalized)) return "warning";
    if (ERROR_STATUSES.has(normalized)) return "error";
    return "neutral";
};
</script>
