<template>
    <Card :class="cardClass" object-id="wdg_MonitoringDomainCard">
        <div v-if="loading" class="space-y-3">
            <div
                class="h-5 w-24 rounded bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-16 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-20 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data"
            class="text-sm text-text-secondary text-center py-6"
        >
            No domain data available.
        </div>

        <div v-else class="flex min-h-[236px] flex-col gap-4">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">
                    {{ data.label }}
                </h3>
                <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                    :class="healthChipClass"
                >
                    {{ data.health }}
                </span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
                <div class="rounded-md bg-surface-secondary py-2">
                    <p class="text-lg font-bold text-gray-900">
                        {{ data.queueCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Queue
                    </p>
                </div>
                <div class="rounded-md bg-surface-secondary py-2">
                    <p class="text-lg font-bold text-gray-900">
                        {{ data.completedTodayCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Completed Today
                    </p>
                </div>
                <div class="rounded-md bg-surface-secondary py-2">
                    <p :class="exceptionsCountClass">
                        {{ data.exceptionsCount }}
                    </p>
                    <p
                        class="text-[10px] font-semibold uppercase text-text-muted"
                    >
                        Exceptions
                    </p>
                </div>
            </div>

            <div class="mt-auto">
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Queue
                </p>
                <ul v-if="data.queueTasks.length > 0" class="space-y-1.5">
                    <li
                        v-for="task in visibleQueueTasks"
                        :key="task.docCode"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="font-medium text-gray-900">{{
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
                    +{{ hiddenQueueTaskCount }} more in queue
                </p>
                <p
                    v-if="data.queueTasks.length === 0"
                    class="text-sm text-text-secondary"
                >
                    Queue is empty.
                </p>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { DomainHealth } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DomainHealth | null;
}>();

const QUEUE_PREVIEW_LIMIT = 3;

const healthChipClass = computed(() => {
    switch (props.data?.health) {
        case "critical":
            return "bg-danger-50 text-danger-600";
        case "warning":
            return "bg-warning-50 text-warning-600";
        default:
            return "bg-success-50 text-success-600";
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

const exceptionsCountClass = computed(() =>
    props.data && props.data.exceptionsCount > 0
        ? "text-2xl font-extrabold text-danger-600"
        : "text-lg font-bold text-gray-900",
);

const visibleQueueTasks = computed(
    () => props.data?.queueTasks.slice(0, QUEUE_PREVIEW_LIMIT) ?? [],
);

const hiddenQueueTaskCount = computed(() =>
    Math.max((props.data?.queueTasks.length ?? 0) - QUEUE_PREVIEW_LIMIT, 0),
);
</script>
