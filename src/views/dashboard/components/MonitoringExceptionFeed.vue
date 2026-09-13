<template>
    <Card object-id="wdg_MonitoringExceptionFeed">
        <PanelHeader
            title="Exception Feed"
            description="Operation rows requiring manual intervention"
            class="mb-4"
        />

        <div v-if="loading" class="space-y-2">
            <SkeletonBlock v-for="n in 3" :key="n" height="h-16" />
        </div>

        <StatusPanel
            v-else-if="exceptions.length === 0"
            title="No exceptions currently open"
            :icon="CheckCircle2"
            tone="success"
            class="px-4 py-5"
        />

        <ul v-else class="space-y-3">
            <li
                v-for="(row, index) in exceptions"
                :key="index"
                class="flex gap-3 rounded-md border border-border bg-surface p-4 shadow-xs"
            >
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-600"
                >
                    <Icon :icon="AlertTriangle" :size="16" />
                </div>
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-semibold text-text">
                            {{ row.eventLabel }} exception
                        </span>
                        <Badge tone="neutral">
                            {{ row.warehouseName }}
                        </Badge>
                    </div>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ row.zoneLabel ?? "—" }} · Operator
                        {{ row.operatorName }} · Duration
                        {{ row.durationMinutes }} min
                    </p>
                </div>
                <div class="shrink-0 text-xs text-text-muted font-mono">
                    {{ formatTimestamp(row.timestamp) }}
                </div>
            </li>
        </ul>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { AlertTriangle, CheckCircle2 } from "lucide-vue-next";
import type { LiveTransactionRow } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const exceptions = computed(() =>
    (props.data ?? []).filter((row) => row.status === "exception"),
);

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
};
</script>
