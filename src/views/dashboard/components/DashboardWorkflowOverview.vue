<template>
    <Card object-id="wdg_DashboardWorkflowOverview">
        <div>
            <h2 class="text-lg font-semibold text-gray-900">
                Business Workflow Overview
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Where business objects stand right now — not warehouse activity
            </p>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="n in 2"
                    :key="`wf-skel-${n}`"
                    class="h-48 rounded-md bg-surface-secondary animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.panels.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 text-center text-sm text-gray-500"
            >
                No workflow data available.
            </div>

            <div v-else class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="panel in data.panels"
                    :key="panel.key"
                    class="rounded-md border border-border p-4"
                >
                    <h3 class="text-sm font-semibold text-gray-900">
                        {{ panel.title }}
                    </h3>
                    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase text-text-muted"
                            >
                                Open
                            </p>
                            <p class="text-sm font-bold text-gray-900">
                                {{ panel.openCount }}
                            </p>
                        </div>
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase text-text-muted"
                            >
                                Completion Rate
                            </p>
                            <p class="text-sm font-bold text-gray-900">
                                {{ Math.round(panel.completionRate * 100) }}%
                            </p>
                        </div>
                        <div class="col-span-2">
                            <p
                                class="text-[10px] font-semibold uppercase text-text-muted"
                            >
                                Bottleneck
                            </p>
                            <p class="text-sm font-bold text-warning-600">
                                {{ panel.bottleneckStage }}
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 space-y-2">
                        <div
                            v-for="stage in panel.stages"
                            :key="stage.name"
                            class="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-xs"
                        >
                            <span class="font-medium text-gray-700">{{
                                stage.name
                            }}</span>
                            <span class="text-text-secondary"
                                >{{ stage.count }} · {{ stage.pctOfOpen ?? 0 }}%
                                <template v-if="stage.avgWaitHours !== null">
                                    · Avg wait
                                    {{
                                        stage.avgWaitHours.toFixed(1)
                                    }}h</template
                                ></span
                            >
                            <span
                                v-if="stage.trendPct === null"
                                class="text-text-muted italic"
                            >
                                Insufficient data yet
                            </span>
                            <span
                                v-else
                                :class="
                                    stage.trendPct >= 0
                                        ? 'text-emerald-600'
                                        : 'text-danger-600'
                                "
                                class="font-semibold"
                            >
                                {{ stage.trendPct >= 0 ? "+" : ""
                                }}{{ stage.trendPct.toFixed(1) }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardWorkflowOverviewResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardWorkflowOverviewResponse | null;
}>();
</script>
