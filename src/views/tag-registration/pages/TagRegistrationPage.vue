<template>
    <section class="space-y-6">
        <PageHeader
            title="Tag Registration"
            description="Capture new RFID tags."
            tagline="Log"
        />

        <Card no-padding object-id="wdg_TagRegistrationList">
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
                            placeholder="Search by EPC"
                            class="w-full sm:max-w-xs"
                            object-id="txt_TagRegistrationSearch"
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
                                object-id="btn_TagRegistrationRefresh"
                                @click="handleTagSearch"
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
                <LoadingState />
            </div>

            <div v-else-if="!displayTags.length" class="px-6 pb-5">
                <EmptyState :variant="tagEmptyStateVariant" />
            </div>

            <div v-else>
                <AppTable
                    :columns="tagColumns"
                    :rows="displayTags"
                    class="border-none shadow-none rounded-none"
                    object-id="tbl_TagRegistrationList"
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
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import AppTable from "@/components/organisms/Table.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search, RefreshCw } from "lucide-vue-next";
import { useTagRegistration } from "../composables/useTagRegistration";

const {
    tagsLoading,
    tagsError,
    tagSearch,
    tagEmptyStateVariant,
    tagColumns,
    displayTags,
    pagination,
    pageSizeOptions,
    setPage,
    setLimit,
    handleTagSearch,
} = useTagRegistration();
</script>
