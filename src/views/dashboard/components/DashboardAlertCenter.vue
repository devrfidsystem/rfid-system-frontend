<template>
    <Card object-id="wdg_DashboardAlertCenter">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h2 class="text-lg font-semibold text-gray-900">
                    Operations Alert Center
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">
                    What requires immediate attention right now
                </p>
            </div>
            <div
                v-if="data"
                class="flex items-center gap-2 text-xs font-semibold"
            >
                <span
                    class="rounded-full bg-red-50 px-2.5 py-1 text-signal-red ring-1 ring-red-200/60"
                >
                    Critical {{ data.counts.critical }}
                </span>
                <span
                    class="rounded-full bg-orange-50 px-2.5 py-1 text-action-orange ring-1 ring-orange-200/60"
                >
                    Warning {{ data.counts.warning }}
                </span>
                <span
                    class="rounded-full bg-blue-50 px-2.5 py-1 text-primary-600 ring-1 ring-blue-200/60"
                >
                    Info {{ data.counts.info }}
                </span>
            </div>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="space-y-3">
                <div
                    v-for="n in 3"
                    :key="`alert-skel-${n}`"
                    class="h-24 rounded-md bg-workspace-bg animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.alerts.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-emerald-500"
                >
                    <Icon :icon="CheckCircle2" :size="20" />
                </div>
                <p class="text-sm font-medium text-gray-900">No alerts</p>
                <p class="text-xs text-gray-500 mt-1">
                    Nothing requires attention for the selected warehouse.
                </p>
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="(alert, index) in data.alerts"
                    :key="`${alert.title}-${index}`"
                    class="rounded-md border border-border-default bg-white p-4 shadow-xs"
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
                                    class="text-sm font-semibold text-gray-900"
                                    >{{ alert.title }}</span
                                >
                                <span
                                    class="rounded-full bg-workspace-bg px-2 py-0.5 text-xs font-medium text-text-secondary"
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
                                class="mt-3 grid gap-2 sm:grid-cols-2 bg-workspace-bg rounded-md p-3"
                            >
                                <div>
                                    <p
                                        class="text-[10px] font-semibold uppercase text-text-secondary"
                                    >
                                        Business Impact
                                    </p>
                                    <p class="text-xs text-gray-700 mt-0.5">
                                        {{ alert.businessImpact }}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        class="text-[10px] font-semibold uppercase text-text-secondary"
                                    >
                                        Recommended Action
                                    </p>
                                    <p class="text-xs text-gray-700 mt-0.5">
                                        {{ alert.recommendedAction }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, CheckCircle2, Info } from "lucide-vue-next";
import type {
    DashboardAlert,
    DashboardAlertsResponse,
} from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardAlertsResponse | null;
}>();

const severityIcon = (severity: DashboardAlert["severity"]) =>
    severity === "info" ? Info : AlertTriangle;

const severityIconClass = (severity: DashboardAlert["severity"]) => {
    if (severity === "critical") return "bg-red-50 text-signal-red";
    if (severity === "warning") return "bg-orange-50 text-action-orange";
    return "bg-blue-50 text-primary-600";
};
</script>
