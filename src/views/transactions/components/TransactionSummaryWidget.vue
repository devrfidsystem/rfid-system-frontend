<template>
    <div
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        object-id="wdg_TransactionSummary"
    >
        <template v-if="loading">
            <SkeletonBlock v-for="n in 4" :key="n" height="h-28" />
        </template>

        <Card v-else-if="error" class="sm:col-span-2 lg:col-span-4">
            <p class="text-sm text-danger-600">{{ error }}</p>
        </Card>

        <Card
            v-else-if="summary?.totalCount === 0"
            class="sm:col-span-2 lg:col-span-4"
        >
            <p class="text-sm text-text-secondary">
                No documents match the selected transaction filters.
            </p>
        </Card>

        <template v-else-if="summary">
            <MetricSummaryCard
                label="Total"
                :value="summary.totalCount.toLocaleString()"
                :icon="FileText"
                tone="primary"
            />

            <MetricSummaryCard label="Workflow Status" :icon="Tags">
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
                label="Latest Document"
                :icon="Clock"
                tone="info"
            >
                <template v-if="summary.mostRecent">
                    <p class="text-sm font-medium text-text">
                        {{ summary.mostRecent.docNo }}
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ summary.mostRecent.createdByName ?? "Unknown" }} ·
                        {{ formatDate(summary.mostRecent.createdAt) }}
                    </p>
                </template>
                <p v-else class="text-sm text-text-secondary">
                    No document has been created yet.
                </p>
            </MetricSummaryCard>

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
                        {{ summary.needsAttention.staleDraftCount }} drafts over
                        3 days
                    </p>
                </template>
                <p v-else class="text-sm font-medium text-success-600">
                    No open exceptions
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
    Tags,
} from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { TransactionSummaryResponse } from "../types";
import { getTransactionStatusTone } from "../utils/transactionStatus";

defineProps<{
    loading: boolean;
    error: string | null;
    summary: TransactionSummaryResponse | null;
}>();

const statusTone = getTransactionStatusTone;
</script>
