<template>
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3"
    >
        <ToolbarTitle :title="`${heading} List`" />

        <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end"
        >
            <Input
                :model-value="keyword"
                label="Search opname"
                label-class="sr-only"
                aria-label="Search opname"
                placeholder="Search opname"
                class="w-full sm:max-w-xs"
                object-id="txt_OpnameTreeSearch"
                @update:model-value="
                    (value) => $emit('update:keyword', String(value))
                "
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>

            <div class="grid grid-cols-2 sm:flex items-center gap-2">
                <FilterPopover
                    v-model:open="isFilterOpen"
                    object-id="pop_OpnameTreeFilters"
                >
                    <template #trigger="{ toggle }">
                        <Button
                            variant="outline"
                            class="px-3 w-full sm:w-auto justify-center"
                            object-id="btn_OpnameTreeFilter"
                            @click="toggle"
                        >
                            <Icon :icon="Filter" :size="14" />
                            Filter
                        </Button>
                    </template>
                    <template #default>
                        <Select
                            :model-value="selectedWarehouseId"
                            :options="warehouseOptions"
                            placeholder="Select warehouse"
                            label="Warehouse"
                            aria-label="Warehouse"
                            class="w-full"
                            object-id="cmb_OpnameTreeWarehouse"
                            @update:model-value="
                                (value) =>
                                    $emit(
                                        'update:selectedWarehouseId',
                                        String(value),
                                    )
                            "
                        />

                        <div class="grid grid-cols-2 gap-3">
                            <Input
                                :model-value="startDate"
                                type="date"
                                label="From"
                                aria-label="From date"
                                object-id="dtp_OpnameTreeFromDate"
                                @update:model-value="
                                    (value) =>
                                        $emit('update:startDate', String(value))
                                "
                            />
                            <Input
                                :model-value="endDate"
                                type="date"
                                label="To"
                                aria-label="To date"
                                object-id="dtp_OpnameTreeToDate"
                                @update:model-value="
                                    (value) =>
                                        $emit('update:endDate', String(value))
                                "
                            />
                        </div>

                        <Input
                            :model-value="statusFilter"
                            label="Status"
                            aria-label="Status"
                            placeholder="Draft, On Going, Closed"
                            object-id="txt_OpnameTreeStatus"
                            @update:model-value="
                                (value) =>
                                    $emit('update:statusFilter', String(value))
                            "
                        />

                        <Input
                            :model-value="locationFilter"
                            label="Location"
                            aria-label="Location"
                            placeholder="Search location"
                            object-id="txt_OpnameTreeLocation"
                            @update:model-value="
                                (value) =>
                                    $emit(
                                        'update:locationFilter',
                                        String(value),
                                    )
                            "
                        />
                    </template>
                    <template #actions="{ close }">
                        <Button
                            size="sm"
                            variant="outline"
                            object-id="btn_OpnameTreeCloseFilter"
                            @click="close"
                        >
                            Close
                        </Button>
                    </template>
                </FilterPopover>

                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Refresh"
                    object-id="btn_OpnameTreeRefresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>

                <Button
                    variant="primary"
                    class="px-3 w-full sm:w-auto justify-center"
                    object-id="btn_OpnameTreeNew"
                    :disabled="!selectedWarehouseId"
                    @click="$emit('new')"
                >
                    <Icon :icon="Plus" :size="14" />
                    New
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import FilterPopover from "@/components/molecules/FilterPopover.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import { Search, Filter, RefreshCw, Plus } from "lucide-vue-next";

interface SelectOption {
    label: string;
    value: string;
}

defineProps<{
    heading: string;
    selectedWarehouseId: string;
    warehouseOptions: SelectOption[];
    keyword: string;
    startDate: string;
    endDate: string;
    statusFilter: string;
    locationFilter: string;
}>();

defineEmits<{
    (e: "update:selectedWarehouseId", value: string): void;
    (e: "update:keyword", value: string): void;
    (e: "update:startDate", value: string): void;
    (e: "update:endDate", value: string): void;
    (e: "update:statusFilter", value: string): void;
    (e: "update:locationFilter", value: string): void;
    (e: "refresh"): void;
    (e: "new"): void;
}>();

const isFilterOpen = ref(false);
</script>
