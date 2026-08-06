<template>
    <div class="grid gap-4 sm:grid-cols-3" object-id="wdg_OpnameSummary">
        <template v-if="loading">
            <div
                v-for="n in 5"
                :key="n"
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="error" class="sm:col-span-3">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card v-else-if="summary?.totalCount === 0" class="sm:col-span-3">
            <p class="text-sm text-text-secondary">
                No opname tasks match this warehouse.
            </p>
        </Card>

        <template v-else-if="summary">
            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-200"
                    >
                        <Icon :icon="FileText" :size="18" />
                    </div>
                    <div>
                        <p
                            class="text-xs font-semibold uppercase text-text-muted"
                        >
                            Total Tasks
                        </p>
                        <p class="text-3xl font-extrabold text-gray-900">
                            {{ summary.totalCount.toLocaleString() }}
                        </p>
                    </div>
                </div>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                    >
                        <Icon :icon="Tags" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Status Breakdown
                    </p>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
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
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-50 text-info-600 ring-1 ring-info-200"
                    >
                        <Icon :icon="Scale" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Variance
                    </p>
                </div>
                <p class="text-3xl font-extrabold text-gray-900 mt-3">
                    {{ summary.varianceTaskCount.toLocaleString() }}
                </p>
                <p class="text-xs text-text-secondary mt-1">
                    task(s) with a counting discrepancy
                </p>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        :class="[
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1',
                            summary.needsAttention.count > 0
                                ? 'bg-danger-50 text-danger-600 ring-danger-200'
                                : 'bg-success-50 text-success-600 ring-success-200',
                        ]"
                    >
                        <Icon
                            :icon="
                                summary.needsAttention.count > 0
                                    ? AlertTriangle
                                    : CheckCircle2
                            "
                            :size="18"
                        />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Needs Attention
                    </p>
                </div>
                <template v-if="summary.needsAttention.count > 0">
                    <p class="text-3xl font-extrabold text-danger-600 mt-3">
                        {{ summary.needsAttention.count.toLocaleString() }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.needsAttention.canceledCount }} cancelled,
                        {{ summary.needsAttention.stuckCountingCount }} stuck
                        counting &gt;3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600 mt-3">
                    All clear
                </p>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-50 text-info-600 ring-1 ring-info-200"
                    >
                        <Icon :icon="Clock" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Most Recent
                    </p>
                </div>
                <template v-if="summary.mostRecent">
                    <p class="text-sm font-medium text-gray-900 mt-3">
                        {{ summary.mostRecent.title }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary mt-3">
                    No tasks yet.
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
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

// Purely presentational grouping of Opname's own status vocabulary into the
// Badge atom's existing tone set — draft/counting/reconciled/closed/canceled
// is a different vocabulary from the other 7 transaction modules'
// draft/posted/canceled, so this mapping is NOT shared with
// TransactionSummaryWidget.vue's statusTone().
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
