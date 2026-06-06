<template>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
        <div>
            <h3 class="text-base font-semibold text-gray-900">
                Transactions List
            </h3>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end">
            <Input
                v-model="localKeyword"
                placeholder="Search documents"
                class="w-full sm:max-w-xs"
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>
            <div class="grid grid-cols-2 sm:flex items-center gap-2">
                <div ref="filterPopoverRef" class="relative flex">
                    <Button
                        variant="outline"
                        class="px-3 w-full sm:w-auto justify-center"
                        @click="toggleFilter"
                    >
                        <Icon :icon="Filter" :size="14" />
                        Filter
                    </Button>
                    <div
                        v-if="isFilterOpen"
                        class="absolute right-0 sm:right-auto z-10 mt-12 sm:mt-2 w-[320px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4 space-y-4"
                    >
                        <h4 class="font-medium text-sm text-gray-900 mb-2">
                            Filters
                        </h4>
                        <div class="grid grid-cols-2 gap-3">
                            <Input
                                id="transaction-date-from"
                                v-model="localStartDate"
                                type="date"
                                label="From"
                            />
                            <Input
                                id="transaction-date-to"
                                v-model="localEndDate"
                                type="date"
                                label="To"
                            />
                        </div>
                        <Select
                            v-if="showWarehouseFilter"
                            v-model="localSelectedWarehouse"
                            :options="warehouseSelectOptions"
                            placeholder="Select warehouse"
                            label="Warehouse"
                            class="w-full"
                        />
                        <Select
                            v-if="
                                partnerFilterSupported &&
                                partnerSelectOptions.length
                            "
                            v-model="localSelectedPartner"
                            :options="partnerSelectOptions"
                            placeholder="Select partner"
                            :label="partnerLabel"
                            class="w-full"
                        />
                        <div class="pt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                @click="toggleFilter"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
                <Button variant="outline" class="px-3 w-full sm:w-auto justify-center">
                    <Icon :icon="ArrowUpDown" :size="14" />
                    Sort
                </Button>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Refresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>
                <Button variant="primary" class="px-3 w-full sm:w-auto justify-center" @click="$emit('new')">
                    <Icon :icon="Plus" :size="14" />
                    New
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search, Filter, ArrowUpDown, RefreshCw, Plus } from "lucide-vue-next";

interface SelectOption {
    label: string;
    value: string;
}

const props = defineProps<{
    keyword: string;
    startDate: string;
    endDate: string;
    selectedWarehouse: string;
    selectedPartner: string;
    showWarehouseFilter: boolean;
    partnerFilterSupported: boolean;
    warehouseSelectOptions: SelectOption[];
    partnerSelectOptions: SelectOption[];
    partnerLabel: string;
}>();

const emit = defineEmits<{
    (e: "update:keyword", value: string): void;
    (e: "update:startDate", value: string): void;
    (e: "update:endDate", value: string): void;
    (e: "update:selectedWarehouse", value: string): void;
    (e: "update:selectedPartner", value: string): void;
    (e: "refresh"): void;
    (e: "new"): void;
}>();

const localKeyword = computed({
    get: () => props.keyword,
    set: (value) => emit("update:keyword", value),
});
const localStartDate = computed({
    get: () => props.startDate,
    set: (value) => emit("update:startDate", value),
});
const localEndDate = computed({
    get: () => props.endDate,
    set: (value) => emit("update:endDate", value),
});
const localSelectedWarehouse = computed({
    get: () => props.selectedWarehouse,
    set: (value) => emit("update:selectedWarehouse", value),
});
const localSelectedPartner = computed({
    get: () => props.selectedPartner,
    set: (value) => emit("update:selectedPartner", value),
});

const isFilterOpen = ref(false);
const filterPopoverRef = ref<HTMLElement | null>(null);

const toggleFilter = () => {
    isFilterOpen.value = !isFilterOpen.value;
};

const closeFilter = (e: Event) => {
    if (
        filterPopoverRef.value &&
        !filterPopoverRef.value.contains(e.target as Node)
    ) {
        isFilterOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", closeFilter);
});

onUnmounted(() => {
    document.removeEventListener("click", closeFilter);
});
</script>
