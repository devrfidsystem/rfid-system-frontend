<template>
    <section class="space-y-6">
        <PageHeader
            title="Users"
            description="Review application users, assigned roles, and account access."
            tagline="IAM"
        />

        <Card no-padding object-id="wdg_UsersList">
            <UsersTableToolbar v-model:keyword="keyword" @refresh="refresh" />

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
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import { useUsers } from "./composables/useUsers";
import UsersTableToolbar from "./components/UsersTableToolbar.vue";

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
