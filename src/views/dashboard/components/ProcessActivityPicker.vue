<template>
    <div class="space-y-3" object-id="wdg_ProcessActivityPicker">
        <div v-for="group in groups" :key="group.domain">
            <p class="text-[10px] font-semibold uppercase text-text-muted mb-1">
                {{ group.label }}
            </p>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="item in group.items"
                    :key="item.value"
                    type="button"
                    class="px-3 py-1.5 rounded-md border text-sm font-semibold transition-colors"
                    :class="
                        modelValue === item.value
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-border text-text-secondary hover:text-text'
                    "
                    @click="emit('update:modelValue', item.value)"
                >
                    {{ item.label }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ProcessActivity } from "@/model/dashboard";

defineProps<{
    modelValue: ProcessActivity;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: ProcessActivity): void;
}>();

const groups: {
    domain: string;
    label: string;
    items: { value: ProcessActivity; label: string }[];
}[] = [
    {
        domain: "stockIn",
        label: "Stock In",
        items: [
            { value: "receiving", label: "Receiving" },
            { value: "putaway", label: "Putaway" },
        ],
    },
    {
        domain: "stockOut",
        label: "Stock Out",
        items: [{ value: "outbound", label: "Outbound" }],
    },
    {
        domain: "inventory",
        label: "Inventory",
        items: [
            { value: "transfer", label: "Transfer" },
            { value: "relocation", label: "Relocation" },
            { value: "opname", label: "Stock Opname" },
        ],
    },
];
</script>
