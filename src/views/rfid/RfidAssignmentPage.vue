<template>
    <section class="space-y-6">
        <PageHeader
            title="RFID Assignments"
            description="Tie encoded tags to warehouse locations."
            tagline="RFID"
        />

        <Card no-padding object-id="wdg_RfidAssignmentList">
            <div class="px-6 py-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900">
                            Registered Tags
                        </h3>
                    </div>
                    <div
                        class="flex flex-wrap items-end justify-end gap-3 flex-1"
                    >
                        <Input
                            v-model="tagSearch"
                            placeholder="Search EPC"
                            class="w-full max-w-xs"
                            object-id="txt_RfidAssignmentSearch"
                        >
                            <template #icon>
                                <Icon :icon="Search" :size="16" />
                            </template>
                        </Input>
                        <div class="flex items-center gap-2">
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_RfidAssignmentRefresh"
                                @click="refreshTags"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                        </div>
                    </div>
                </div>
                <p
                    v-if="tagsError && !tagsLoading"
                    class="text-xs text-rose-600 mt-4"
                >
                    {{ tagsError }}
                </p>
            </div>

            <div v-if="tagsLoading" class="px-6 pb-5">
                <LoadingState :lines="5" />
            </div>

            <div v-else-if="!displayTags.length" class="px-6 pb-5">
                <EmptyState :variant="tagSearch ? 'search' : 'default'" />
            </div>

            <div v-else>
                <AppTable
                    :columns="tableColumns"
                    :rows="displayTags"
                    class="border-none shadow-none rounded-none"
                    object-id="tbl_RfidAssignmentList"
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
                </AppTable>
                <div class="border-t border-gray-200 px-6 py-4">
                    <Pagination
                        :page="pagination.page"
                        :page-size="pagination.limit"
                        :total="pagination.total"
                        :page-size-options="pageSizeOptions"
                        @update:page="setPage"
                        @update:page-size="setLimit"
                    />
                </div>
            </div>
        </Card>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Input from "@/components/atoms/Input.vue";
import Badge from "@/components/atoms/Badge.vue";

import Button from "@/components/atoms/Button.vue";
import AppTable from "@/components/organisms/Table.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search, RefreshCw } from "lucide-vue-next";
import { useRfidAssignment } from "./composables/useRfidAssignment";

const {
    tagsLoading,
    tagsError,
    pagination,
    pageSizeOptions,
    setPage,
    setLimit,
    tagSearch,
    tableColumns,
    displayTags,
    refreshTags,
} = useRfidAssignment();

const getStatusTone = (status: string) => {
    const s = status.toLowerCase();
    if (["posted", "closed", "active", "success", "in_use", "encoded", "assigned"].includes(s)) return "success";
    if (["draft", "pending", "neutral", "available"].includes(s)) return "neutral";
    if (["canceled", "cancelled", "error", "inactive", "retired", "quarantined"].includes(s)) return "error";
    if (["counting", "reconciled", "processing"].includes(s)) return "warning";
    return "info";
};
</script>
