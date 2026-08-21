<template>
    <Card object-id="wdg_DashboardWorkflowOverview">
        <PanelHeader
            :title="t('dashboard.overview.workflowOverview.panelTitle')"
            :description="
                t('dashboard.overview.workflowOverview.panelDescription')
            "
        />

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 lg:grid-cols-2">
                <SkeletonBlock
                    v-for="n in 2"
                    :key="`wf-skel-${n}`"
                    height="h-48"
                />
            </div>

            <StatusPanel
                v-else-if="error"
                :title="
                    t('dashboard.overview.workflowOverview.unavailable.title')
                "
                :description="error"
                :icon="AlertTriangle"
                tone="error"
            />

            <StatusPanel
                v-else-if="!data || data.panels.length === 0"
                :title="t('dashboard.overview.workflowOverview.empty.title')"
                :description="
                    t('dashboard.overview.workflowOverview.empty.description')
                "
                :icon="Activity"
                tone="neutral"
            />

            <div v-else class="grid gap-4 lg:grid-cols-2">
                <div
                    v-for="panel in data.panels"
                    :key="panel.key"
                    class="rounded-md border border-border p-4"
                >
                    <PanelHeader :title="panel.title" />
                    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.open',
                                )
                            "
                            :value="panel.openCount"
                            class="border-0 bg-transparent p-0"
                        />
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.completionRate',
                                )
                            "
                            :value="`${Math.round(panel.completionRate * 100)}%`"
                            class="border-0 bg-transparent p-0"
                        />
                        <MetricValueTile
                            :label="
                                t(
                                    'dashboard.overview.workflowOverview.metrics.bottleneck',
                                )
                            "
                            :value="panel.bottleneckStage"
                            class="col-span-2 border-0 bg-transparent p-0"
                            value-class="text-warning-600"
                        />
                    </div>

                    <div
                        v-if="panel.stages.length > 0"
                        class="mt-4 rounded-md border border-border bg-surface-secondary/40 p-3"
                    >
                        <StageDonutChart
                            :stages="
                                panel.stages.map((stage) => ({
                                    name: stage.name,
                                    count: stage.count,
                                }))
                            "
                        />
                    </div>

                    <div class="mt-4 space-y-2">
                        <div
                            v-for="stage in panel.stages"
                            :key="stage.name"
                            class="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2 text-xs"
                        >
                            <span class="font-medium text-text">{{
                                stage.name
                            }}</span>
                            <span class="text-text-secondary"
                                >{{ stage.count }} · {{ stage.pctOfOpen ?? 0 }}%
                                <template v-if="stage.avgWaitHours !== null">
                                    ·
                                    {{
                                        t(
                                            "dashboard.overview.workflowOverview.avgWait",
                                        )
                                    }}
                                    {{
                                        stage.avgWaitHours.toFixed(1)
                                    }}h</template
                                ></span
                            >
                            <span
                                v-if="stage.trendPct === null"
                                class="text-text-muted italic"
                            >
                                {{
                                    t(
                                        "dashboard.overview.workflowOverview.insufficientData",
                                    )
                                }}
                            </span>
                            <span
                                v-else
                                :class="
                                    stage.trendPct >= 0
                                        ? 'text-success-600'
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
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import MetricValueTile from "@/components/molecules/MetricValueTile.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import StageDonutChart from "./StageDonutChart.vue";
import { Activity, AlertTriangle } from "lucide-vue-next";
import type { DashboardWorkflowOverviewResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardWorkflowOverviewResponse | null;
    error?: string | null;
}>();

const { t } = useI18n();
</script>
