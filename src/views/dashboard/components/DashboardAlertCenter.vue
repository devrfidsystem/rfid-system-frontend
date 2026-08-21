<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <PanelHeader
            :title="t('dashboard.overview.alertCenter.panelTitle')"
            :description="t('dashboard.overview.alertCenter.panelDescription')"
        >
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <Badge tone="error">
                    {{
                        t("dashboard.overview.alertCenter.badges.critical", {
                            count: data.counts.critical,
                        })
                    }}
                </Badge>
                <Badge tone="warning">
                    {{
                        t("dashboard.overview.alertCenter.badges.warning", {
                            count: data.counts.warning,
                        })
                    }}
                </Badge>
                <Badge tone="info">
                    {{
                        t("dashboard.overview.alertCenter.badges.info", {
                            count: data.counts.info,
                        })
                    }}
                </Badge>
            </div>
        </PanelHeader>

        <SegmentedControl
            v-if="data && data.alerts.length > 0"
            v-model="severityFilter"
            class="mt-4"
            :options="severityFilterOptions"
            object-id-prefix="btn_DashboardAlertSeverity"
        />

        <div class="mt-6">
            <div v-if="loading" class="space-y-3">
                <SkeletonBlock
                    v-for="n in 3"
                    :key="`alert-skel-${n}`"
                    height="h-24"
                />
            </div>

            <StatusPanel
                v-else-if="error"
                :title="t('dashboard.overview.alertCenter.unavailable.title')"
                :description="error"
                :icon="AlertTriangle"
                tone="error"
            />

            <StatusPanel
                v-else-if="!data || data.alerts.length === 0"
                :title="t('dashboard.overview.alertCenter.empty.title')"
                :description="
                    t('dashboard.overview.alertCenter.empty.description')
                "
                :icon="CheckCircle2"
                tone="success"
            />

            <div
                v-else-if="filteredAlerts.length === 0"
                class="rounded-md border border-border bg-surface-secondary/50 p-8 text-center text-sm text-text-secondary"
            >
                {{
                    t("dashboard.overview.alertCenter.emptyFiltered", {
                        severity: t(
                            `dashboard.overview.alertCenter.filters.${severityFilter}`,
                        ),
                    })
                }}
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="(alert, index) in filteredAlerts"
                    :key="`${alert.title}-${index}`"
                >
                    <DashboardAlertListItem
                        :alert="alert"
                        :object-id="`btn_DashboardAlertOpen_${index}`"
                        @open="selectedAlert = $event"
                    />
                </li>
            </ul>
        </div>

        <DashboardAlertDetailDrawer
            :alert="selectedAlert"
            @close="selectedAlert = null"
        />
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import Badge from "@/components/atoms/Badge.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import DashboardAlertListItem from "./DashboardAlertListItem.vue";
import DashboardAlertDetailDrawer from "./DashboardAlertDetailDrawer.vue";
import { AlertTriangle, CheckCircle2 } from "lucide-vue-next";
import type {
    DashboardAlert,
    DashboardAlertSeverity,
    DashboardAlertsResponse,
} from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DashboardAlertsResponse | null;
    error?: string | null;
}>();

const { t } = useI18n();

const severityFilterOptions = computed<Array<{ label: string; value: string }>>(
    () => [
        {
            label: t("dashboard.overview.alertCenter.filters.all"),
            value: "all",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.critical"),
            value: "critical",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.warning"),
            value: "warning",
        },
        {
            label: t("dashboard.overview.alertCenter.filters.info"),
            value: "info",
        },
    ],
);

const severityFilter = ref<DashboardAlertSeverity | "all">("all");
const selectedAlert = ref<DashboardAlert | null>(null);

const filteredAlerts = computed(() => {
    const alerts = props.data?.alerts ?? [];
    if (severityFilter.value === "all") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter.value);
});
</script>
