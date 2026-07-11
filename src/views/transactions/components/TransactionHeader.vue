<template>
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5"
    >
        <div>
            <h3 class="text-base font-semibold text-gray-900">
                Transactions List
            </h3>
        </div>
        <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end"
        >
            <Input
                id="txt_TransactionHeaderSearch"
                v-model="localKeyword"
                label="Search documents"
                label-class="sr-only"
                aria-label="Search documents"
                placeholder="Search documents"
                class="w-full sm:max-w-xs"
                object-id="txt_TransactionHeaderSearch"
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
                        object-id="btn_TransactionHeaderFilter"
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
                                id="dtp_TransactionHeaderFromDate"
                                v-model="localStartDate"
                                type="date"
                                label="From"
                                aria-label="From date"
                                object-id="dtp_TransactionHeaderFromDate"
                            />
                            <Input
                                id="dtp_TransactionHeaderToDate"
                                v-model="localEndDate"
                                type="date"
                                label="To"
                                aria-label="To date"
                                object-id="dtp_TransactionHeaderToDate"
                            />
                        </div>
                        <Select
                            v-if="showWarehouseFilter"
                            id="cmb_TransactionHeaderWarehouse"
                            v-model="localSelectedWarehouse"
                            :options="warehouseSelectOptions"
                            placeholder="Select warehouse"
                            label="Warehouse"
                            aria-label="Warehouse"
                            class="w-full"
                            object-id="cmb_TransactionHeaderWarehouse"
                        />
                        <Select
                            v-if="
                                partnerFilterSupported &&
                                partnerSelectOptions.length
                            "
                            id="cmb_TransactionHeaderPartner"
                            v-model="localSelectedPartner"
                            :options="partnerSelectOptions"
                            placeholder="Select partner"
                            :label="partnerLabel"
                            :aria-label="partnerLabel"
                            class="w-full"
                            object-id="cmb_TransactionHeaderPartner"
                        />
                        <div class="pt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                object-id="btn_TransactionHeaderCloseFilter"
                                @click="toggleFilter"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
                <Button
                    variant="outline"
                    class="px-3 w-full sm:w-auto justify-center"
                    object-id="btn_TransactionHeaderSort"
                    @click="$emit('sort')"
                >
                    <Icon
                        :icon="sortOrder === 'desc' ? ArrowDown : ArrowUp"
                        :size="14"
                    />
                    {{ sortOrder === "desc" ? "Newest" : "Oldest" }}
                </Button>
                <Button
                    variant="outline"
                    class="px-2 w-full sm:w-auto justify-center"
                    title="Refresh"
                    object-id="btn_TransactionHeaderRefresh"
                    @click="$emit('refresh')"
                >
                    <Icon :icon="RefreshCw" :size="16" />
                </Button>
                <Button
                    variant="primary"
                    class="col-span-2 sm:col-span-1 px-3 w-full sm:w-auto justify-center"
                    :disabled="!hasRows"
                    object-id="btn_TransactionHeaderExport"
                    @click="$emit('export')"
                >
                    <Icon :icon="Download" :size="14" />
                    Export XLS
                </Button>
                <Button
                    variant="primary"
                    class="px-3 w-full sm:w-auto justify-center"
                    object-id="btn_TransactionHeaderNew"
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
import { computed, ref, onMounted, onUnmounted } from "vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import {
    Search,
    Filter,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Download,
    Plus,
} from "lucide-vue-next";

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
    hasRows: boolean;
    sortOrder: "asc" | "desc";
}>();

const emit = defineEmits<{
    (e: "update:keyword", value: string): void;
    (e: "update:startDate", value: string): void;
    (e: "update:endDate", value: string): void;
    (e: "update:selectedWarehouse", value: string): void;
    (e: "update:selectedPartner", value: string): void;
    (e: "refresh"): void;
    (e: "export"): void;
    (e: "new"): void;
    (e: "sort"): void;
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
