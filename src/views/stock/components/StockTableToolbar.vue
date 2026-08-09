<template>
    <div
        class="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        :object-id="`wdg_${objectIdPrefix}Toolbar`"
    >
        <ToolbarTitle :title="`${heading} List`" />

        <div
            class="flex w-full flex-1 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end"
        >
            <Input
                :model-value="keyword"
                :placeholder="searchPlaceholder"
                :aria-label="searchPlaceholder"
                label="Search stock"
                label-class="sr-only"
                class="w-full sm:max-w-xs"
                :object-id="`txt_${objectIdPrefix}Search`"
                @update:model-value="
                    (value) => emit('update:keyword', String(value))
                "
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>

            <div class="grid grid-cols-3 items-center gap-2 sm:flex">
                <FilterPopover
                    v-model:open="filterOpen"
                    :object-id="`pop_${objectIdPrefix}Filters`"
                >
                    <template #trigger="{ toggle }">
                        <Button
                            variant="outline"
                            class="w-full justify-center px-3 sm:w-auto"
                            :object-id="`btn_${objectIdPrefix}Filter`"
                            @click="toggle"
                        >
                            <Icon :icon="Filter" :size="14" />
                            Filter
                        </Button>
                    </template>
                    <template #default>
                        <Select
                            :model-value="selectedWarehouse"
                            :options="warehouseOptions"
                            placeholder="All warehouses"
                            label="Warehouse"
                            aria-label="Warehouse"
                            class="w-full"
                            :object-id="`cmb_${objectIdPrefix}Warehouse`"
                            @update:model-value="
                                (value) =>
                                    emit('update:selectedWarehouse', String(value))
                            "
                        />
                    </template>
                    <template #actions="{ close }">
                        <Button
                            size="sm"
                            variant="outline"
                            :object-id="`btn_${objectIdPrefix}CloseFilter`"
                            @click="close"
                        >
                            Close
                        </Button>
                    </template>
                </FilterPopover>

                <Button
                    variant="outline"
                    class="w-full justify-center px-2 sm:w-auto"
                    title="Refresh"
                    :object-id="`btn_${objectIdPrefix}Refresh`"
                    @click="emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>

                <Button
                    variant="outline"
                    class="w-full justify-center px-3 sm:w-auto"
                    :disabled="exportDisabled"
                    :object-id="`btn_${objectIdPrefix}Export`"
                    @click="emit('export')"
                >
                    <Icon :icon="Download" :size="14" />
                    Export XLS
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
import { Download, Filter, RefreshCw, Search } from "lucide-vue-next";

type SelectOption = {
    label: string;
    value: string;
};

withDefaults(
    defineProps<{
        heading: string;
        keyword: string;
        selectedWarehouse: string;
        warehouseOptions: SelectOption[];
        searchPlaceholder: string;
        objectIdPrefix: string;
        exportDisabled?: boolean;
    }>(),
    {
        exportDisabled: false,
    },
);

const emit = defineEmits<{
    (event: "update:keyword", value: string): void;
    (event: "update:selectedWarehouse", value: string): void;
    (event: "refresh"): void;
    (event: "export"): void;
}>();

const filterOpen = ref(false);
</script>
