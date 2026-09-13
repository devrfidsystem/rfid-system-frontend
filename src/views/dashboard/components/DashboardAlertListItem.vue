<template>
    <button
        type="button"
        class="w-full rounded-md border border-border bg-surface p-4 text-left shadow-xs transition-colors hover:border-primary-200 hover:bg-primary-50/20"
        :object-id="objectId"
        @click="$emit('open', alert)"
    >
        <div class="flex items-start gap-3">
            <div :class="iconClasses">
                <Icon :icon="icon" :size="16" />
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-semibold text-text">
                        {{ alert.title }}
                    </span>
                    <Badge tone="neutral">
                        {{ alert.tag }}
                    </Badge>
                    <Badge tone="info">
                        {{ alert.category }}
                    </Badge>
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
                            {{
                                t(
                                    "dashboard.overview.alertCenter.businessImpact",
                                )
                            }}
                        </p>
                        <p class="text-xs text-text mt-0.5">
                            {{ alert.businessImpact }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-secondary"
                        >
                            {{
                                t(
                                    "dashboard.overview.alertCenter.recommendedAction",
                                )
                            }}
                        </p>
                        <p class="text-xs text-text mt-0.5">
                            {{ alert.recommendedAction }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </button>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { useI18n } from "vue-i18n";
import Badge from "@/components/atoms/Badge.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, Info } from "lucide-vue-next";
import type { DashboardAlert } from "@/model/dashboard";

const props = defineProps<{
    alert: DashboardAlert;
    objectId: string;
}>();

defineEmits<{
    (event: "open", alert: DashboardAlert): void;
}>();

const { t } = useI18n();

const icon = computed<Component>(() =>
    props.alert.severity === "info" ? Info : AlertTriangle,
);

const iconClasses = computed(() => {
    const base =
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";
    if (props.alert.severity === "critical") {
        return `${base} bg-danger-50 text-danger-600`;
    }
    if (props.alert.severity === "warning") {
        return `${base} bg-warning-50 text-warning-600`;
    }
    return `${base} bg-info-50 text-info-600`;
});
</script>
