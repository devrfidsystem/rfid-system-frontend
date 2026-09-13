<template>
    <div
        class="flex flex-col justify-between gap-4 px-4 py-3 sm:flex-row sm:items-center"
    >
        <ToolbarTitle :title="`${title} List`" />
        <div
            class="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
            <Input
                v-model="localKeyword"
                placeholder="Search data..."
                class="w-full sm:max-w-xs"
                object-id="txt_MasterHeaderSearch"
            >
                <template #icon>
                    <Icon :icon="Search" :size="16" />
                </template>
            </Input>
            <div class="grid grid-cols-3 items-center gap-2 sm:flex">
                <FilterPopover
                    v-if="hasFilterableFields"
                    v-model:open="isFilterOpen"
                    object-id="pop_MasterHeaderFilters"
                >
                    <template #trigger="{ toggle }">
                        <Button
                            variant="outline"
                            class="px-3 w-full sm:w-auto justify-center"
                            object-id="btn_MasterHeaderFilter"
                            @click="toggle"
                        >
                            <Icon :icon="Filter" :size="14" />
                            Filter
                        </Button>
                    </template>
                    <template #default>
                        <Select
                            v-if="entityKey === 'products'"
                            v-model="localFilterCategoryId"
                            :options="categoryOptions ?? []"
                            placeholder="All categories"
                            label="Category"
                            class="w-full"
                            object-id="cmb_MasterHeaderCategory"
                        />
                        <Select
                            v-if="entityKey === 'products'"
                            v-model="localFilterUomId"
                            :options="uomOptions ?? []"
                            placeholder="All UOMs"
                            label="Unit of Measure"
                            class="w-full"
                            object-id="cmb_MasterHeaderUom"
                        />
                        <Select
                            v-if="entityKey === 'attributes'"
                            v-model="localFilterType"
                            :options="typeOptions ?? []"
                            placeholder="All types"
                            label="Type"
                            class="w-full"
                            object-id="cmb_MasterHeaderType"
                        />
                        <Select
                            v-if="entityKey === 'locations'"
                            v-model="localFilterWarehouseId"
                            :options="warehouseOptions ?? []"
                            placeholder="All warehouses"
                            label="Warehouse"
                            class="w-full"
                            object-id="cmb_MasterHeaderWarehouse"
                        />
                    </template>
                    <template #actions="{ close }">
                        <Button
                            size="sm"
                            variant="outline"
                            object-id="btn_MasterHeaderCloseFilter"
                            @click="close"
                            >Close</Button
                        >
                    </template>
                </FilterPopover>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Import"
                    :disabled="!canAdd"
                    :loading="isImporting"
                    object-id="btn_MasterHeaderImport"
                    @click="openImportDialog"
                >
                    <Icon :icon="Upload" :size="16" />
                </Button>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Export"
                    :disabled="!canAdd"
                    object-id="btn_MasterHeaderExport"
                    @click="$emit('export')"
                >
                    <Icon :icon="Download" :size="16" />
                </Button>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Refresh"
                    object-id="btn_MasterHeaderRefresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>
            </div>
            <Button
                variant="primary"
                :disabled="!canAdd"
                object-id="btn_MasterHeaderAdd"
                @click="$emit('add')"
            >
                <Icon :icon="Plus" :size="14" />
                Add {{ title }}
            </Button>
        </div>
        <MasterImportDialog
            :is-open="isImportDialogOpen"
            :title="title"
            :is-importing="isImporting"
            @close="closeImportDialog"
            @import="$emit('import', $event)"
            @export-template="$emit('export-template')"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import FilterPopover from "@/components/molecules/FilterPopover.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import MasterImportDialog from "./MasterImportDialog.vue";
import {
    Search,
    Filter,
    RefreshCw,
    Plus,
    Upload,
    Download,
} from "lucide-vue-next";

interface SelectOption {
    label: string;
    value: string;
}

const props = defineProps<{
    title: string;
    keyword: string;
    canAdd: boolean;
    isImporting?: boolean;
    entityKey?: string;
    filterCategoryId?: string;
    filterUomId?: string;
    filterType?: string;
    filterWarehouseId?: string;
    categoryOptions?: SelectOption[];
    uomOptions?: SelectOption[];
    typeOptions?: SelectOption[];
    warehouseOptions?: SelectOption[];
}>();

const emit = defineEmits<{
    (e: "update:keyword", value: string): void;
    (e: "update:filterCategoryId", value: string): void;
    (e: "update:filterUomId", value: string): void;
    (e: "update:filterType", value: string): void;
    (e: "update:filterWarehouseId", value: string): void;
    (e: "refresh"): void;
    (e: "add"): void;
    (e: "import", file: File): void;
    (e: "export"): void;
    (e: "export-template"): void;
}>();

const localKeyword = computed({
    get: () => props.keyword,
    set: (value) => emit("update:keyword", value),
});

const localFilterCategoryId = computed({
    get: () => props.filterCategoryId ?? "",
    set: (value) => emit("update:filterCategoryId", value),
});

const localFilterUomId = computed({
    get: () => props.filterUomId ?? "",
    set: (value) => emit("update:filterUomId", value),
});

const localFilterType = computed({
    get: () => props.filterType ?? "",
    set: (value) => emit("update:filterType", value),
});

const localFilterWarehouseId = computed({
    get: () => props.filterWarehouseId ?? "",
    set: (value) => emit("update:filterWarehouseId", value),
});

const hasFilterableFields = computed(() =>
    ["products", "attributes", "locations"].includes(props.entityKey ?? ""),
);

const isFilterOpen = ref(false);
const isImportDialogOpen = ref(false);

const openImportDialog = () => {
    isImportDialogOpen.value = true;
};

const closeImportDialog = () => {
    isImportDialogOpen.value = false;
};
</script>
