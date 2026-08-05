<template>
    <div class="grid gap-4 sm:grid-cols-2" object-id="wdg_TransactionSummary">
        <template v-if="loading">
            <div
                v-for="n in 4"
                :key="n"
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="error" class="sm:col-span-2">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card v-else-if="summary?.totalCount === 0" class="sm:col-span-2">
            <p class="text-sm text-text-secondary">
                No transactions match the current filters.
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
                            Total
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
                        <Icon :icon="Clock" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Most Recent
                    </p>
                </div>
                <template v-if="summary.mostRecent">
                    <p class="text-sm font-medium text-gray-900 mt-3">
                        {{ summary.mostRecent.docNo }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary mt-3">
                    No transactions yet.
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
                        {{ summary.needsAttention.staleDraftCount }} pending
                        &gt;3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600 mt-3">
                    All clear
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
    Tags,
} from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { TransactionSummaryResponse } from "../types";

defineProps<{
    loading: boolean;
    error: string | null;
    summary: TransactionSummaryResponse | null;
}>();

// Purely presentational grouping of raw status values into the Badge
// atom's existing tone vocabulary — not a business-meaning mapping, since
// the backend deliberately keeps status generic/unmapped per-transactionKey.
const SUCCESS_STATUSES = new Set([
    "posted",
    "done",
    "completed",
    "closed",
    "reconciled",
    "approved",
]);
const WARNING_STATUSES = new Set([
    "draft",
    "pending",
    "counting",
    "queued",
    "assigned",
    "in_progress",
    "processing",
]);
const ERROR_STATUSES = new Set([
    "cancelled",
    "canceled",
    "rejected",
    "failed",
    "void",
    "voided",
]);

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
