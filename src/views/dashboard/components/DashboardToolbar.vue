<template>
    <Teleport v-if="isMounted" to="#page-toolbar-slot">
        <div
            class="mx-auto w-full max-w-[1400px] px-4 py-3 lg:px-6 flex flex-wrap items-center justify-between gap-4"
        >
            <!-- Left: Filters & Tools -->
            <div class="flex items-center gap-2">
                <!-- Real Warehouse Filter -->
                <div class="w-[200px]">
                    <Select
                        v-if="warehouseOptions.length > 0"
                        :options="warehouseOptions"
                        placeholder="Semua Gudang (Filter)"
                        object-id="cmb_DashboardFilterWarehouse"
                        :placeholder-disabled="false"
                        :model-value="warehouseId ?? undefined"
                        @update:model-value="
                            (val) => $emit('update:warehouseId', val || null)
                        "
                    />
                </div>

                <!-- Sort Stub (matches reference visual) -->
                <Button
                    variant="outline"
                    size="sm"
                    object-id="btn_DashboardSort"
                >
                    <template #leftIcon>
                        <Icon
                            :icon="ArrowUpDown"
                            :size="14"
                            class-name="text-gray-500"
                        />
                    </template>
                    Sort
                </Button>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="loading"
                    object-id="btn_DashboardRefresh"
                    @click="$emit('refresh')"
                >
                    <template #leftIcon>
                        <Icon
                            :icon="RefreshCw"
                            :size="14"
                            :class-name="
                                loading
                                    ? 'animate-spin text-gray-400'
                                    : 'text-gray-500'
                            "
                        />
                    </template>
                    Refresh
                </Button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { ArrowUpDown, RefreshCw } from "lucide-vue-next";

defineProps<{
    warehouseId: string | null | undefined;
    warehouseOptions: Array<{ label: string; value: string }>;
    loading: boolean;
}>();

defineEmits<{
    (e: "update:warehouseId", value: string | null): void;
    (e: "refresh"): void;
}>();

const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});
</script>
