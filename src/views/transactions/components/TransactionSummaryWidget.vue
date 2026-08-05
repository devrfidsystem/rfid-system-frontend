<template>
    <div class="grid gap-4 sm:grid-cols-3" object-id="wdg_TransactionSummary">
        <template v-if="loading">
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </template>

        <Card v-else-if="totalCount === 0" class="sm:col-span-3">
            <p class="text-sm text-text-secondary">
                No transactions match the current filters.
            </p>
        </Card>

        <template v-else>
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
                            {{ totalCount.toLocaleString() }}
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
                        Status Breakdown (this page)
                    </p>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                    <Badge
                        v-for="item in statusBreakdown"
                        :key="item.label"
                        :tone="statusTone(item.label)"
                    >
                        {{ item.label }} ({{ item.count.toLocaleString() }})
                    </Badge>
                </div>
            </Card>

            <Card>
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-50 text-info-600 ring-1 ring-info-200"
                    >
                        <Icon :icon="Calendar" :size="18" />
                    </div>
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        Date Range (this page)
                    </p>
                </div>
                <p class="text-sm font-medium text-gray-900 mt-3">
                    {{ formatDate(dateRange.earliest) }} –
                    {{ formatDate(dateRange.latest) }}
                </p>
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Calendar, FileText, Tags } from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type {
    StatusCount,
    DateRangeSummary,
} from "../composables/useTransactionSummary";

defineProps<{
    loading: boolean;
    totalCount: number;
    statusBreakdown: StatusCount[];
    dateRange: DateRangeSummary;
}>();

// Purely presentational grouping of raw status values into the Badge
// atom's existing tone vocabulary — not a business-meaning mapping, since
// the composable deliberately keeps status generic/unmapped per-transactionKey.
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
