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

            <DataTable
                object-id="UsersList"
                bare
                :rows="displayRows"
                :columns="dataTableColumns"
                :row-key="(row) => String(row.id ?? '')"
                :loading="loading"
                :load-error="error ?? undefined"
                :empty-state-variant="keyword ? 'search' : 'default'"
                :show-search="false"
                :page="pagination.page"
                :page-size="pagination.limit"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @update:page="pagination.page = $event"
                @update:page-size="pagination.limit = $event"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw, Search, Filter } from "lucide-vue-next";
import { useUsers } from "./composables/useUsers";

const {
    columns,
    keyword,
    loading,
    error,
    pagination,
    pageSizeOptions,
    displayRows,
    refresh,
} = useUsers();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns.map((column) => ({ key: column.key, header: column.label })),
);
</script>
