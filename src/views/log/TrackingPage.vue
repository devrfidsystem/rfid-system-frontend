<template>
    <section class="space-y-6">
        <PageHeader
            title="Tracking"
            description="Search EPC history and activities."
            tagline="Log"
        />
        <Card object-id="wdg_TrackingSearch">
            <div class="flex flex-wrap items-center gap-4">
                <Input
                    v-model="epc"
                    placeholder="Search EPC"
                    class="w-full max-w-xs"
                    object-id="txt_TrackingEpc"
                />
                <Button
                    variant="primary"
                    object-id="btn_TrackingSearch"
                    @click="loadEvents"
                    >Search</Button
                >
            </div>
            <div class="mt-6">
                <p
                    v-if="error && !loading"
                    class="rounded-md border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600"
                >
                    {{ error }}
                </p>
                <div v-if="loading" class="space-y-3">
                    <div
                        v-for="n in 4"
                        :key="n"
                        class="h-16 rounded-md bg-surface-secondary animate-pulse"
                    ></div>
                </div>
                <div v-else>
                    <EmptyState
                        v-if="!events.length"
                        :variant="emptyStateVariant"
                    />
                    <div v-else>
                        <div
                            class="overflow-x-auto rounded-md border border-border"
                        >
                            <table
                                class="min-w-full divide-y divide-border text-sm text-text"
                                object-id="tbl_TrackingResults"
                            >
                                <thead
                                    class="bg-surface-secondary text-xs font-medium uppercase tracking-wider text-text-secondary"
                                >
                                    <tr>
                                        <th class="px-4 py-3 text-left">EPC</th>
                                        <th class="px-4 py-3 text-left">
                                            Timestamp
                                        </th>
                                        <th class="px-4 py-3 text-left">
                                            Warehouse
                                        </th>
                                        <th class="px-4 py-3 text-left">
                                            Location
                                        </th>
                                        <th class="px-4 py-3 text-left">
                                            Event
                                        </th>
                                        <th class="px-4 py-3 text-left">
                                            Document
                                        </th>
                                    </tr>
                                </thead>
                                <tbody
                                    class="bg-surface divide-y divide-border"
                                >
                                    <tr
                                        v-for="(event, idx) in sortedEvents"
                                        :key="event.id"
                                        class="transition-colors duration-150 hover:bg-surface-secondary/70"
                                        :class="{
                                            'bg-surface-secondary/50':
                                                idx % 2 === 1,
                                        }"
                                    >
                                        <td class="px-4 py-3">
                                            {{ event.epc ?? "-" }}
                                        </td>
                                        <td class="px-4 py-3">
                                            {{ formatDate(event.timestamp) }}
                                        </td>
                                        <td class="px-4 py-3">
                                            {{
                                                warehouseName(event.warehouseId)
                                            }}
                                        </td>
                                        <td class="px-4 py-3">
                                            {{ event.locationId ?? "-" }}
                                        </td>
                                        <td class="px-4 py-3">
                                            {{
                                                event.movementType ?? "Movement"
                                            }}
                                        </td>
                                        <td class="px-4 py-3">
                                            {{
                                                event.documentRef ??
                                                event.docNumber ??
                                                "-"
                                            }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div
                            class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary"
                        >
                            <div>
                                Showing
                                <span class="font-semibold"
                                    >{{ tableRangeStart }} -
                                    {{ tableRangeEnd }}</span
                                >
                                of
                                <span class="font-semibold">{{
                                    pagination.total
                                }}</span>
                                records
                            </div>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    class="rounded-md border border-border px-3 py-1 transition disabled:cursor-not-allowed disabled:bg-surface-secondary"
                                    :disabled="pagination.page <= 1"
                                    object-id="btn_TrackingPrevPage"
                                    @click="setPage(pagination.page - 1)"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    class="rounded-md border border-border px-3 py-1 transition disabled:cursor-not-allowed disabled:bg-surface-secondary"
                                    :disabled="pagination.page >= totalPages"
                                    object-id="btn_TrackingNextPage"
                                    @click="setPage(pagination.page + 1)"
                                >
                                    Next
                                </button>
                                <label
                                    for="tracking-page-size"
                                    class="text-xs font-medium uppercase tracking-wider text-text-secondary"
                                    >Per page</label
                                >
                                <select
                                    id="tracking-page-size"
                                    class="rounded-md border border-border bg-surface px-3 py-1 text-xs text-text"
                                    :value="pagination.limit"
                                    object-id="cmb_TrackingPageSize"
                                    @change="
                                        setLimit(
                                            Number(
                                                (
                                                    $event.target as HTMLSelectElement
                                                ).value,
                                            ),
                                        )
                                    "
                                >
                                    <option
                                        v-for="size in pageSizeOptions"
                                        :key="size"
                                        :value="size"
                                    >
                                        {{ size }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    </section>
</template>

<script setup lang="ts">
import Button from "@/components/atoms/Button.vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import { useTracking } from "./composables/useTracking";

const {
    epc,
    events,
    loading,
    error,
    pagination,
    pageSizeOptions,
    totalPages,
    tableRangeStart,
    tableRangeEnd,
    sortedEvents,
    emptyStateVariant,
    warehouseName,
    formatDate,
    loadEvents,
    setPage,
    setLimit,
} = useTracking();
</script>
