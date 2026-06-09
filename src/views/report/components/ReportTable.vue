<template>
    <div>
        <div v-if="loading" class="px-6 pb-5">
            <LoadingState :lines="5" />
        </div>

        <div v-else-if="!rows.length" class="px-6 pb-5">
            <EmptyState :variant="emptyStateVariant" />
        </div>

        <div v-else>
            <AppTable
                :columns="columns"
                :rows="rows"
                class="border-none shadow-none rounded-none"
                object-id="tbl_ReportTable"
            >
                <template #status="{ row }">
                    <Badge
                        v-if="row.status"
                        :tone="getStatusTone(String(row.status))"
                    >
                        {{ row.status }}
                    </Badge>
                    <span v-else>-</span>
                </template>
                <template #actions="{ row }">
                    <Button
                        size="sm"
                        variant="outline"
                        object-id="btn_ReportTableDetail"
                        @click="$emit('openDetail', row)"
                    >
                        <Icon :icon="Eye" :size="14" />
                        Detail
                    </Button>
                </template>
            </AppTable>
            <div class="border-t border-gray-200 px-6 py-4">
                <Pagination
                    v-model:page="localPage"
                    v-model:page-size="localLimit"
                    :total="total"
                    :page-size-options="pageSizeOptions"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppTable from "@/components/organisms/Table.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import Badge from "@/components/atoms/Badge.vue";
import { Eye } from "lucide-vue-next";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";

const props = defineProps<{
    loading: boolean;
    rows: Record<string, string | number>[];
    columns: { key: string; label: string }[];
    emptyStateVariant: "default" | "search" | "filter";
    page: number;
    limit: number;
    total: number;
    pageSizeOptions: number[];
}>();

const emit = defineEmits<{
    (e: "update:page", value: number): void;
    (e: "update:limit", value: number): void;
    (e: "openDetail", row: Record<string, string | number>): void;
}>();

const localPage = computed({
    get: () => props.page,
    set: (value) => emit("update:page", value),
});

const localLimit = computed({
    get: () => props.limit,
    set: (value) => emit("update:limit", value),
});

const getStatusTone = (status: string) => {
    const s = status.toLowerCase();
    if (["posted", "closed", "active", "success"].includes(s)) return "success";
    if (["draft", "pending", "neutral"].includes(s)) return "neutral";
    if (["canceled", "cancelled", "error", "inactive"].includes(s))
        return "error";
    if (["counting", "reconciled", "processing"].includes(s)) return "warning";
    return "info";
};
</script>
