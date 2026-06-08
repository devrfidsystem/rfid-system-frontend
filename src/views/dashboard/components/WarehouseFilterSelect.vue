<template>
    <div class="flex flex-col gap-1">
        <label
            for="global-warehouse-filter"
            class="text-xs font-medium uppercase tracking-wider text-gray-500"
            >Filter Gudang</label
        >
        <select
            placeholder="Semua Warehouse"
            object-id="cmb_GlobalWarehouseFilter"
            :value="modelValue ?? ''"
            :disabled="loading"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            @change="handleChange"
        >
            <option value="">Semua Gudang</option>
            <option
                v-for="warehouse in options"
                :key="warehouse.id"
                :value="warehouse.id"
            >
                {{ warehouse.name }}
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import type { WarehouseOption } from "@/model/dashboard";

withDefaults(
    defineProps<{
        options?: WarehouseOption[];
        modelValue?: string | null;
        loading?: boolean;
    }>(),
    {
        options: () => [],
        modelValue: null,
        loading: false,
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", value: string | null): void;
}>();

const handleChange = (event: Event) => {
    const value = (event.target as HTMLSelectElement).value;
    emit("update:modelValue", value || null);
};
</script>
