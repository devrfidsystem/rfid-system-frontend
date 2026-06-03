<template>
    <section class="space-y-6">
        <PageHeader
            title="RFID Assignments"
            description="Tie encoded tags to warehouse locations."
            tagline="RFID"
        />

        <Card>
            <div class="space-y-6">
                <div>
                    <h3 class="text-base font-semibold text-gray-900 mb-1">
                        Assign RFID Tag
                    </h3>
                    <p class="text-xs text-gray-500">
                        Hubungkan tag yang ter-encode dengan lokasi gudang dan
                        dokumen referensi.
                    </p>
                </div>
                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Select
                        v-model="selectedTagId"
                        :options="tagOptions"
                        placeholder="Select tag"
                        label="Tag"
                        :error="
                            fieldErrors['selectedTagId'] ?? fieldErrors['tagId']
                        "
                    />
                    <Input
                        v-model="locationId"
                        label="Location ID"
                        placeholder="Enter Location ID"
                        :error="fieldErrors['locationId']"
                    />
                    <Input
                        v-model="documentRef"
                        label="Document Ref"
                        placeholder="Enter Document Reference"
                        :error="fieldErrors['documentRef']"
                    />
                </div>
                <div v-if="assignError" class="text-sm text-signal-red">
                    {{ assignError }}
                </div>
                <div class="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                        variant="primary"
                        :disabled="isAssigning || !selectedTagId || !locationId"
                        @click="assignTag"
                    >
                        Assign Tag
                    </Button>
                </div>
            </div>
        </Card>

        <Card no-padding>
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
                />
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
import Select from "@/components/atoms/Select.vue";
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
    selectedTagId,
    locationId,
    documentRef,
    assignError,
    fieldErrors,
    isAssigning,
    tagOptions,
    tableColumns,
    displayTags,
    refreshTags,
    assignTag,
} = useRfidAssignment();
</script>
