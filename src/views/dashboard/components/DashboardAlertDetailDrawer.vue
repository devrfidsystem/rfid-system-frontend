<template>
    <Drawer
        :model-value="Boolean(alert)"
        :title="alert?.title"
        side="right"
        width="md"
        object-id="drw_DashboardAlertDetail"
        @update:model-value="(open) => !open && emit('close')"
    >
        <div v-if="alert" class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
                <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="severityClass(alert.severity)"
                >
                    <Icon :icon="severityIcon(alert.severity)" :size="12" />
                    {{ alert.severity.toUpperCase() }}
                </span>
                <Badge tone="neutral">
                    {{ alert.tag }}
                </Badge>
                <Badge tone="info">
                    {{ alert.category }}
                </Badge>
            </div>

            <p class="text-sm text-text">
                {{ alert.summary }}
            </p>

            <div
                class="rounded-md border border-border bg-surface-secondary p-4"
            >
                <p
                    class="text-[10px] font-semibold uppercase text-text-secondary"
                >
                    {{ t("dashboard.overview.alertCenter.businessImpact") }}
                </p>
                <p class="mt-1 text-sm text-text">
                    {{ alert.businessImpact }}
                </p>
            </div>

            <div
                class="rounded-md border border-border bg-surface-secondary p-4"
            >
                <p
                    class="text-[10px] font-semibold uppercase text-text-secondary"
                >
                    {{ t("dashboard.overview.alertCenter.recommendedAction") }}
                </p>
                <p class="mt-1 text-sm text-text">
                    {{ alert.recommendedAction }}
                </p>
            </div>

            <div
                class="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs"
            >
                <div>
                    <p class="font-semibold uppercase text-text-secondary">
                        {{ t("dashboard.overview.alertCenter.occurred") }}
                    </p>
                    <p class="mt-1 text-text">
                        {{ formatDate(alert.occurredAt) }}
                    </p>
                </div>
                <div v-if="alert.docRef">
                    <p class="font-semibold uppercase text-text-secondary">
                        {{
                            t(
                                "dashboard.overview.alertCenter.documentReference",
                            )
                        }}
                    </p>
                    <p class="mt-1 text-text">
                        {{ alert.docRef }}
                    </p>
                </div>
            </div>
        </div>
    </Drawer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import { AlertTriangle, Info } from "lucide-vue-next";
import { formatDate } from "@/utils/date";
import type { DashboardAlert } from "@/model/dashboard";

defineProps<{
    alert: DashboardAlert | null;
}>();

const emit = defineEmits<{
    (event: "close"): void;
}>();

const { t } = useI18n();

const severityIcon = (severity: DashboardAlert["severity"]) =>
    severity === "info" ? Info : AlertTriangle;

const severityClass = (severity: DashboardAlert["severity"]) => {
    if (severity === "critical") return "bg-danger-50 text-danger-600";
    if (severity === "warning") return "bg-warning-50 text-warning-600";
    return "bg-info-50 text-info-600";
};
</script>
