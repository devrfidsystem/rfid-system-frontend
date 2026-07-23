<template>
    <div
        class="flex flex-col justify-between gap-4 px-4 py-3 sm:flex-row sm:items-center"
    >
        <div>
            <h3 class="text-lg font-semibold text-text">{{ title }} List</h3>
        </div>
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
                <div
                    v-if="hasFilterableFields"
                    ref="filterPopoverRef"
                    class="relative flex"
                >
                    <Button
                        variant="outline"
                        class="px-3 w-full sm:w-auto justify-center"
                        object-id="btn_MasterHeaderFilter"
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
                        <div class="pt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                object-id="btn_MasterHeaderCloseFilter"
                                @click="toggleFilter"
                                >Close</Button
                            >
                        </div>
                    </div>
                </div>
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
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
const filterPopoverRef = ref<HTMLElement | null>(null);
const isImportDialogOpen = ref(false);

const toggleFilter = () => {
    isFilterOpen.value = !isFilterOpen.value;
};

const openImportDialog = () => {
    isImportDialogOpen.value = true;
};

const closeImportDialog = () => {
    isImportDialogOpen.value = false;
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

onBeforeUnmount(() => {
    document.removeEventListener("click", closeFilter);
});
</script>
