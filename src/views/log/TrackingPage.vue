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
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    {{ error }}
                </p>
                <div v-if="loading" class="space-y-3">
                    <div
                        v-for="n in 4"
                        :key="n"
                        class="h-16 rounded-md bg-gray-200/70 animate-pulse"
                    ></div>
                </div>
                <div v-else>
                    <EmptyState
                        v-if="!events.length"
                        :variant="emptyStateVariant"
                    />
                    <div v-else>
                        <div
                            class="overflow-x-auto rounded-md border border-gray-200"
                        >
                            <table
                                class="min-w-full divide-y divide-gray-200 text-sm text-gray-700"
                                object-id="tbl_TrackingResults"
                            >
                                <thead
                                    class="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500"
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
                                    class="bg-white divide-y divide-gray-200"
                                >
                                    <tr
                                        v-for="(event, idx) in sortedEvents"
                                        :key="event.id"
                                        class="transition-colors duration-150 hover:bg-gray-100/70"
                                        :class="{
                                            'bg-gray-50/50': idx % 2 === 1,
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
                            class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500"
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
                                    class="rounded-md border border-gray-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50"
                                    :disabled="pagination.page <= 1"
                                    object-id="btn_TrackingPrevPage"
                                    @click="setPage(pagination.page - 1)"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    class="rounded-md border border-gray-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50"
                                    :disabled="pagination.page >= totalPages"
                                    object-id="btn_TrackingNextPage"
                                    @click="setPage(pagination.page + 1)"
                                >
                                    Next
                                </button>
                                <label
                                    for="tracking-page-size"
                                    class="text-xs font-medium uppercase tracking-wider text-gray-500"
                                    >Per page</label
                                >
                                <select
                                    id="tracking-page-size"
                                    class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
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
