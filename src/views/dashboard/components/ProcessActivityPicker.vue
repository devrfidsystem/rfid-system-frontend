<template>
    <div class="space-y-3" object-id="wdg_ProcessActivityPicker">
        <div v-for="group in groups" :key="group.domain">
            <p class="mb-1 text-xs font-semibold uppercase text-text-muted">
                {{ group.label }}
            </p>
            <SegmentedControl
                :model-value="modelValue"
                :options="group.items"
                :object-id="`seg_ProcessActivityPicker_${group.domain}`"
                object-id-prefix="btn_ProcessActivity"
                @update:model-value="selectActivity"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import type { ProcessActivity } from "@/model/dashboard";

defineProps<{
    modelValue: ProcessActivity;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: ProcessActivity): void;
}>();

const selectActivity = (value: string) => {
    emit("update:modelValue", value as ProcessActivity);
};

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
