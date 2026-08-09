<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h2 class="text-lg font-semibold text-text">
                    Operational Exceptions
                </h2>
                <p class="text-sm text-text-secondary mt-0.5">
                    Open warehouse risks that need operator action
                </p>
            </div>
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <span
                    class="rounded-full bg-danger-50 px-2.5 py-1 text-danger-600 ring-1 ring-danger-500/20"
                >
                    Critical {{ data.counts.critical }}
                </span>
                <span
                    class="rounded-full bg-warning-50 px-2.5 py-1 text-warning-600 ring-1 ring-warning-500/20"
                >
                    Warning {{ data.counts.warning }}
                </span>
                <span
                    class="rounded-full bg-info-50 px-2.5 py-1 text-info-600 ring-1 ring-info-500/20"
                >
                    Info {{ data.counts.info }}
                </span>
            </div>
        </div>

        <div v-if="data && data.alerts.length > 0" class="mt-4 flex gap-1.5">
            <button
                v-for="option in severityFilterOptions"
                :key="option.value"
                type="button"
                class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
                :class="
                    severityFilter === option.value
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:bg-surface-secondary'
                "
                :object-id="`btn_DashboardAlertSeverity_${option.value}`"
                @click="severityFilter = option.value"
            >
                {{ option.label }}
            </button>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="space-y-3">
                <div
                    v-for="n in 3"
                    :key="`alert-skel-${n}`"
                    class="h-24 rounded-md bg-surface-secondary animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="error"
                class="rounded-md border border-danger-500/20 bg-danger-50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-danger-500/20 mb-3 text-danger-600"
                >
                    <Icon :icon="AlertTriangle" :size="20" />
                </div>
                <p class="text-sm font-medium text-text">
                    Exception feed unavailable
                </p>
                <p class="text-xs text-text-secondary mt-1">{{ error }}</p>
            </div>

            <div
                v-else-if="!data || data.alerts.length === 0"
                class="rounded-md border border-border bg-surface-secondary/50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-success-500/20 mb-3 text-success-600"
                >
                    <Icon :icon="CheckCircle2" :size="20" />
                </div>
                <p class="text-sm font-medium text-text">
                    No open exceptions
                </p>
                <p class="text-xs text-text-secondary mt-1">
                    Selected warehouse has no active operational risk.
                </p>
            </div>

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
                    <button
                        type="button"
                        class="w-full rounded-md border border-border bg-surface p-4 text-left shadow-xs transition-colors hover:border-primary-200 hover:bg-primary-50/20"
                        :object-id="`btn_DashboardAlertOpen_${index}`"
                        @click="selectedAlert = alert"
                    >
                        <div class="flex items-start gap-3">
                            <div
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                :class="severityIconClass(alert.severity)"
                            >
                                <Icon
                                    :icon="severityIcon(alert.severity)"
                                    :size="16"
                                />
                            </div>
                            <div class="flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span
                                        class="text-sm font-semibold text-text"
                                        >{{ alert.title }}</span
                                    >
                                    <span
                                        class="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary"
                                    >
                                        {{ alert.tag }}
                                    </span>
                                    <span
                                        class="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600"
                                    >
                                        {{ alert.category }}
                                    </span>
                                </div>
                                <p class="text-xs text-text-secondary mt-1">
                                    {{ alert.summary }}
                                </p>
                                <div
                                    class="mt-3 grid gap-2 sm:grid-cols-2 bg-surface-secondary rounded-md p-3"
                                >
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase text-text-secondary"
                                        >
                                            Business Impact
                                        </p>
                                        <p class="text-xs text-text mt-0.5">
                                            {{ alert.businessImpact }}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-[10px] font-semibold uppercase text-text-secondary"
                                        >
                                            Recommended Action
                                        </p>
                                        <p class="text-xs text-text mt-0.5">
                                            {{ alert.recommendedAction }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                </li>
            </ul>
        </div>

        <Drawer
            :model-value="Boolean(selectedAlert)"
            :title="selectedAlert?.title"
            side="right"
            width="md"
            object-id="drw_DashboardAlertDetail"
            @update:model-value="(open) => !open && (selectedAlert = null)"
        >
            <div v-if="selectedAlert" class="space-y-5">
                <div class="flex flex-wrap items-center gap-2">
                    <span
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="severityIconClass(selectedAlert.severity)"
                    >
                        <Icon
                            :icon="severityIcon(selectedAlert.severity)"
                            :size="12"
                        />
                        {{ selectedAlert.severity.toUpperCase() }}
                    </span>
                    <span
                        class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
                    >
                        {{ selectedAlert.tag }}
                    </span>
                    <span
                        class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600"
                    >
                        {{ selectedAlert.category }}
                    </span>
                </div>

                <p class="text-sm text-text">
                    {{ selectedAlert.summary }}
                </p>

                <div
                    class="rounded-md border border-border bg-surface-secondary p-4"
                >
                    <p
                        class="text-[10px] font-semibold uppercase text-text-secondary"
                    >
                        Business Impact
                    </p>
                    <p class="mt-1 text-sm text-text">
                        {{ selectedAlert.businessImpact }}
                    </p>
                </div>

                <div
                    class="rounded-md border border-border bg-surface-secondary p-4"
                >
                    <p
                        class="text-[10px] font-semibold uppercase text-text-secondary"
                    >
                        Recommended Action
                    </p>
                    <p class="mt-1 text-sm text-text">
                        {{ selectedAlert.recommendedAction }}
                    </p>
                </div>

                <div
                    class="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs"
                >
                    <div>
                        <p class="font-semibold uppercase text-text-secondary">
                            Occurred
                        </p>
                        <p class="mt-1 text-text">
                            {{ formatOccurredAt(selectedAlert.occurredAt) }}
                        </p>
                    </div>
                    <div v-if="selectedAlert.docRef">
                        <p class="font-semibold uppercase text-text-secondary">
                            Document Reference
                        </p>
                        <p class="mt-1 text-text">
                            {{ selectedAlert.docRef }}
                        </p>
                    </div>
                </div>
            </div>
        </Drawer>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import { AlertTriangle, CheckCircle2, Info } from "lucide-vue-next";
import { formatDate } from "@/utils/date";
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
    value: DashboardAlertSeverity | "all";
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

const severityIcon = (severity: DashboardAlert["severity"]) =>
    severity === "info" ? Info : AlertTriangle;

const severityIconClass = (severity: DashboardAlert["severity"]) => {
    if (severity === "critical") return "bg-danger-50 text-danger-600";
    if (severity === "warning") return "bg-warning-50 text-warning-600";
    return "bg-info-50 text-info-600";
};

const formatOccurredAt = (value: string) => formatDate(value);
</script>
