<template>
    <Teleport v-if="isMounted" to="#page-toolbar-slot">
        <div
            class="mx-auto w-full max-w-[1400px] px-4 py-3 lg:px-6 flex flex-wrap items-center justify-between gap-4"
        >
            <!-- Warehouse scope remains the source-of-truth filter. -->
            <div class="flex items-center gap-2">
                <!-- Real Warehouse Filter -->
                <div class="w-[200px]">
                    <Select
                        v-if="warehouseOptions.length > 0"
                        :options="warehouseOptions"
                        :placeholder="
                            t('dashboard.common.warehouseFilterPlaceholder')
                        "
                        object-id="cmb_DashboardFilterWarehouse"
                        :placeholder-disabled="false"
                        :model-value="warehouseId ?? undefined"
                        @update:model-value="
                            (val) => $emit('update:warehouseId', val || null)
                        "
                    />
                </div>
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
                                    ? 'animate-spin text-text-muted'
                                    : 'text-text-secondary'
                            "
                        />
                    </template>
                    {{ t("dashboard.common.refresh") }}
                </Button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw } from "lucide-vue-next";

defineProps<{
    warehouseId: string | null | undefined;
    warehouseOptions: Array<{ label: string; value: string }>;
    loading: boolean;
}>();

defineEmits<{
    (e: "update:warehouseId", value: string | null): void;
    (e: "refresh"): void;
}>();

const { t } = useI18n();

const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});
</script>
