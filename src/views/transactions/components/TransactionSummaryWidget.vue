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
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Total
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ totalCount.toLocaleString() }}
                </p>
            </Card>

            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Status Breakdown (this page)
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                    <Badge v-for="item in statusBreakdown" :key="item.label">
                        {{ item.label }} ({{ item.count }})
                    </Badge>
                </div>
            </Card>

            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Date Range (this page)
                </p>
                <p class="text-sm font-medium text-gray-900 mt-1">
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
</script>
