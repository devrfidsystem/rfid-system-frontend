<template>
    <section class="space-y-6">
        <PageHeader
            title="Users"
            description="List of application users and their roles."
            tagline="IAM"
        />

        <Card no-padding object-id="wdg_UsersList">
            <div
                class="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
            >
                <div>
                    <h3 class="text-base font-semibold text-gray-900">
                        Users List
                    </h3>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <Input
                        v-model="keyword"
                        placeholder="Search email or name"
                        class="w-full max-w-xs"
                        object-id="txt_UsersSearch"
                    >
                        <template #icon>
                            <Icon :icon="Search" :size="16" />
                        </template>
                    </Input>
                    <div class="flex items-center gap-2">
                        <Button
                            variant="outline"
                            class="px-3"
                            object-id="btn_UsersFilter"
                        >
                            <Icon :icon="Filter" :size="14" />
                            Filter
                        </Button>
                        <Button
                            variant="outline"
                            class="px-3"
                            object-id="btn_UsersSort"
                            @click="toggleSort"
                        >
                            <Icon
                                :icon="
                                    sortOrder === 'desc' ? ArrowDown : ArrowUp
                                "
                                :size="14"
                            />
                            {{ sortOrder === "desc" ? "Newest" : "Oldest" }}
                        </Button>
                        <Button
                            variant="outline"
                            class="px-2"
                            title="Refresh"
                            object-id="btn_UsersRefresh"
                            @click="refresh"
                        >
                            <Icon :icon="RefreshCw" :size="16" />
                        </Button>
                    </div>
                </div>
            </div>

            <p
                v-if="error && loading === false"
                class="mx-6 mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
                {{ error }}
            </p>

            <div v-if="loading" class="px-6 pb-5">
                <LoadingState :lines="5" />
            </div>

            <div v-else-if="displayRows.length === 0" class="px-6 pb-5">
                <EmptyState :variant="keyword ? 'search' : 'default'" />
            </div>

            <div v-else>
                <AppTable
                    :columns="columns"
                    :rows="displayRows"
                    class="border-none shadow-none rounded-none"
                    object-id="tbl_UsersList"
                />
                <div class="border-t border-gray-200 px-6 py-4">
                    <Pagination
                        v-model:page="pagination.page"
                        v-model:page-size="pagination.limit"
                        :total="pagination.total"
                        :page-size-options="pageSizeOptions"
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
import Button from "@/components/atoms/Button.vue";
import AppTable from "@/components/organisms/Table.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw, Search, Filter, ArrowUp, ArrowDown } from "lucide-vue-next";
import { useUsers } from "./composables/useUsers";

const {
    columns,
    keyword,
    loading,
    error,
    pagination,
    pageSizeOptions,
    sortOrder,
    toggleSort,
    displayRows,
    refresh,
} = useUsers();
</script>
