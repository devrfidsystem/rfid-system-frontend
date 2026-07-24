<template>
    <div
        class="flex gap-2 border-b border-border"
        object-id="wdg_KpiDomainTabs"
    >
        <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors"
            :class="
                modelValue === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text'
            "
            @click="emit('update:modelValue', tab.value)"
        >
            {{ tab.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { DashboardKpiDomain } from "@/model/dashboard";

defineProps<{
    modelValue: DashboardKpiDomain;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: DashboardKpiDomain): void;
}>();

const tabs: { value: DashboardKpiDomain; label: string }[] = [
    { value: "stockIn", label: "Stock In" },
    { value: "inventory", label: "Inventory" },
    { value: "stockOut", label: "Stock Out" },
];
</script>
