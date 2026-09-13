<template>
    <section class="space-y-6">
        <PageHeader
            title="Tracking"
            description="Search EPC history and activities."
            tagline="Log"
        />
        <Card object-id="wdg_TrackingSearch">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    v-model="epc"
                    label="Search EPC"
                    label-class="sr-only"
                    aria-label="Search EPC"
                    placeholder="Search EPC"
                    class="w-full sm:max-w-xs"
                    object-id="txt_TrackingEpc"
                />
                <Button
                    variant="primary"
                    class="w-full justify-center sm:w-auto"
                    object-id="btn_TrackingSearch"
                    @click="loadEvents"
                >
                    Search
                </Button>
            </div>
        </Card>

        <Card no-padding object-id="wdg_TrackingResults">
            <DataTable
                object-id="TrackingResults"
                bare
                :rows="tableRows"
                :columns="trackingColumns"
                :row-key="(row) => String(row.id ?? '')"
                :loading="loading"
                :load-error="error ?? undefined"
                :empty-state-variant="emptyStateVariant"
                :show-search="false"
                :page="pagination.page"
                :page-size="pagination.limit"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @update:page="setPage"
                @update:page-size="setLimit"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import { useTracking } from "./composables/useTracking";
import { toTrackingRows, trackingColumns } from "./trackingTable";

const {
    epc,
    loading,
    error,
    pagination,
    pageSizeOptions,
    sortedEvents,
    emptyStateVariant,
    warehouseName,
    loadEvents,
    setPage,
    setLimit,
} = useTracking();

const tableRows = computed(() =>
    toTrackingRows(sortedEvents.value, warehouseName),
);
</script>
