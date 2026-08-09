<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <PanelHeader
            title="Operational Exceptions"
            description="Open warehouse risks that need operator action"
        >
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <Badge tone="error">
                    Critical {{ data.counts.critical }}
                </Badge>
                <Badge tone="warning">
                    Warning {{ data.counts.warning }}
                </Badge>
                <Badge tone="info">
                    Info {{ data.counts.info }}
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
                title="Exception feed unavailable"
                :description="error"
                :icon="AlertTriangle"
                tone="error"
            />

            <StatusPanel
                v-else-if="!data || data.alerts.length === 0"
                title="No open exceptions"
                description="Selected warehouse has no active operational risk."
                :icon="CheckCircle2"
                tone="success"
            />

            <div
                v-else-if="filteredAlerts.length === 0"
                class="rounded-md border border-border bg-surface-secondary/50 p-8 text-center text-sm text-text-secondary"
            >
                No {{ severityFilter }} exceptions in the current view.
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

const severityFilterOptions: Array<{
    label: string;
    value: string;
}> = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "Warning", value: "warning" },
    { label: "Info", value: "info" },
];

const severityFilter = ref<DashboardAlertSeverity | "all">("all");
const selectedAlert = ref<DashboardAlert | null>(null);

const filteredAlerts = computed(() => {
    const alerts = props.data?.alerts ?? [];
    if (severityFilter.value === "all") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter.value);
});

</script>
