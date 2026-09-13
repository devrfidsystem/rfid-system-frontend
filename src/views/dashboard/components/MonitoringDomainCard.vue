<template>
    <Card :class="cardClass" object-id="wdg_MonitoringDomainCard">
        <div v-if="loading" class="space-y-3">
            <SkeletonBlock height="h-5" width="w-24" />
            <SkeletonBlock height="h-16" />
            <SkeletonBlock height="h-20" />
        </div>

        <StatusPanel
            v-else-if="!data"
            title="No activity recorded"
            description="No activity recorded for this operation lane."
            :icon="Activity"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />

        <div v-else class="flex min-h-[236px] flex-col gap-4">
            <div class="flex items-center justify-between">
                <PanelHeader :title="data.label" />
                <Badge :tone="healthTone">
                    {{ data.health }}
                </Badge>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
                <MetricValueTile
                    label="Open"
                    :value="data.queueCount"
                    class="border-0 bg-surface-secondary py-2 text-center"
                />
                <MetricValueTile
                    label="Closed Today"
                    :value="data.completedTodayCount"
                    class="border-0 bg-surface-secondary py-2 text-center"
                />
                <MetricValueTile
                    label="Exceptions"
                    :value="data.exceptionsCount"
                    class="border-0 bg-surface-secondary py-2 text-center"
                    :value-class="
                        data.exceptionsCount > 0 ? 'text-danger-600' : ''
                    "
                />
            </div>

            <div class="mt-auto">
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Queue Preview
                </p>
                <ul v-if="data.queueTasks.length > 0" class="space-y-1.5">
                    <li
                        v-for="task in visibleQueueTasks"
                        :key="task.docCode"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="font-medium text-text">{{
                            task.docCode
                        }}</span>
                        <span class="text-text-muted">{{
                            task.locationLabel ?? "—"
                        }}</span>
                    </li>
                </ul>
                <p
                    v-if="hiddenQueueTaskCount > 0"
                    class="mt-2 text-xs font-medium text-text-muted"
                >
                    +{{ hiddenQueueTaskCount }} more waiting
                </p>
                <p
                    v-if="data.queueTasks.length === 0"
                    class="text-sm text-text-secondary"
                >
                    No open documents in this lane.
                </p>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import MetricValueTile from "@/components/molecules/MetricValueTile.vue";
import Badge from "@/components/atoms/Badge.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { Activity } from "lucide-vue-next";
import type { DomainHealth } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DomainHealth | null;
}>();

const QUEUE_PREVIEW_LIMIT = 3;

type HealthTone = "success" | "warning" | "error";

const healthTone = computed<HealthTone>(() => {
    switch (props.data?.health) {
        case "critical":
            return "error";
        case "warning":
            return "warning";
        default:
            return "success";
    }
});

const cardClass = computed(() => {
    switch (props.data?.health) {
        case "critical":
            return "border-l-4 border-danger-500";
        case "warning":
            return "border-l-4 border-warning-500";
        case "nominal":
            return "border-l-4 border-success-500";
        default:
            return "";
    }
});

const visibleQueueTasks = computed(
    () => props.data?.queueTasks.slice(0, QUEUE_PREVIEW_LIMIT) ?? [],
);

const hiddenQueueTaskCount = computed(() =>
    Math.max((props.data?.queueTasks.length ?? 0) - QUEUE_PREVIEW_LIMIT, 0),
);
</script>
