<template>
  <section class="space-y-6">
    <PageHeader :title="config.title" :description="config.description" tagline="Master Data" :icon="config.icon" />
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-gray-400">{{ config.title }}</p>
          <h2 class="text-lg font-semibold text-gray-900">{{ config.description }}</h2>
        </div>
        <Button variant="primary" @click="openAdd">Add {{ config.title }}</Button>
      </div>
      <div class="mt-4">
        <LoadingState v-if="loading" />
        <EmptyState
          v-else-if="!rows.length"
          :title="`No ${config.title} yet`"
          description="Create a new record to get started."
          :icon="Inbox"
        />
        <DataTable
          v-else
          :rows="rows"
          :columns="columnDefs"
          :rowKey="rowKey"
          :pageSizeOptions="[8, 20, 50]"
          :initialSort="initialSort"
          :selectable="true"
        >
          <template #rowActions="{ row }">
            <div class="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" @click="openEdit(row)">Edit</Button>
              <Button size="sm" variant="danger" @click="confirmDelete(row)">Delete</Button>
            </div>
          </template>
        </DataTable>
      </div>
    </Card>

    <Modal :isOpen="showAddModal" :title="`Add ${config.title}`" @close="closeAdd">
      <form class="space-y-4" @submit.prevent="handleCreate">
      <div v-for="field in config.formFields" :key="field.key" class="space-y-2">
        <Input
          v-if="field.type !== 'textarea'"
          v-model="formState[field.key]"
          :label="field.label"
          :placeholder="field.label"
        />
        <div v-else class="flex flex-col gap-1">
          <label class="font-semibold text-gray-700">{{ field.label }}</label>
          <textarea
            v-model="formState[field.key]"
            class="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            rows="2"
          />
        </div>
      </div>
        <div class="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" @click="closeAdd" type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit">Save</Button>
        </div>
      </form>
    </Modal>

    <Modal :isOpen="showEditModal" :title="`Edit ${config.title}`" @close="closeEdit">
      <form class="space-y-4" @submit.prevent="handleUpdate">
        <div v-for="field in config.formFields" :key="`edit-${field.key}`" class="space-y-2">
          <Input
            v-if="field.type !== 'textarea'"
            v-model="formState[field.key]"
            :label="field.label"
            :placeholder="field.label"
          />
          <div v-else class="flex flex-col gap-1">
            <label class="font-semibold text-gray-700">{{ field.label }}</label>
            <textarea
              v-model="formState[field.key]"
              class="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
              rows="2"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" @click="closeEdit" type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit">Update</Button>
        </div>
      </form>
    </Modal>

    <Modal :isOpen="showDeleteModal" title="Confirm Delete" @close="closeDelete">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">Are you sure you want to delete this record?</p>
        <div class="flex justify-end gap-3">
          <Button variant="outline" size="sm" @click="closeDelete" type="button">Cancel</Button>
          <Button variant="danger" size="sm" @click="handleDelete" type="button">Delete</Button>
        </div>
      </div>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Button from '@/app/ui/Button.vue';
import Card from '@/app/ui/Card.vue';
import Modal from '@/app/ui/Modal.vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import DataTable from '@/app/ui/DataTable/DataTable.vue';
import Input from '@/app/ui/Input.vue';
import EmptyState from '@/app/ui/states/EmptyState.vue';
import LoadingState from '@/app/ui/states/LoadingState.vue';
import type { ColumnDef, SortState } from '@/app/ui/DataTable/types';
import { masterEntities } from './entityConfig';
import { list, create, update, remove } from '@/services/mock';
import { useNotifier } from '@/composables/useNotifier';
import type { EntityKey } from '@/types/entities';
import { Inbox } from 'lucide-vue-next';

const route = useRoute();
const entityKey = computed(() => route.meta.entity as EntityKey);
const config = computed(() => masterEntities[entityKey.value]);
const { notifySuccess } = useNotifier();

const rows = ref<Record<string, unknown>[]>([]);
const loading = ref(true);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedRow = ref<Record<string, unknown> | null>(null);
const formState = reactive<Record<string, string>>({});

const columnDefs = computed<ColumnDef<Record<string, unknown>>[]>(() =>
  config.value.columns.map((column) => ({
    ...column,
    accessor: (row) => (row[column.key] ?? '') as string | number | null,
    sortable: true
  }))
);

const initialSort = computed<SortState | undefined>(() =>
  config.value.columns.some((column) => column.key === 'createdAt')
    ? { key: 'createdAt', dir: 'desc' }
    : undefined
);

const rowKey = (row: Record<string, unknown>) => String(row.id ?? row.code ?? '');

const resetForm = () => {
  config.value.formFields.forEach((field) => {
    formState[field.key] = '';
  });
};

const loadRows = async () => {
  loading.value = true;
  const result = await list(entityKey.value, { perPage: 500 });
  rows.value = result.data;
  loading.value = false;
};

const submitPayload = () => {
  const payload: Record<string, unknown> = {};
  config.value.formFields.forEach((field) => {
    const value = formState[field.key]?.trim();
    if (!value) return;
    payload[field.key] = ['rowNo', 'colNo'].includes(field.key) ? Number(value) : value;
  });
  return payload;
};

const openAdd = () => {
  resetForm();
  showAddModal.value = true;
};

const closeAdd = () => {
  showAddModal.value = false;
};

const openEdit = (row: Record<string, unknown>) => {
  selectedRow.value = row;
  config.value.formFields.forEach((field) => {
    formState[field.key] = row[field.key] ? String(row[field.key]) : '';
  });
  showEditModal.value = true;
};

const closeEdit = () => {
  selectedRow.value = null;
  showEditModal.value = false;
};

const confirmDelete = (row: Record<string, unknown>) => {
  selectedRow.value = row;
  showDeleteModal.value = true;
};

const closeDelete = () => {
  selectedRow.value = null;
  showDeleteModal.value = false;
};

const handleCreate = async () => {
  const payload = submitPayload();
  if (!Object.keys(payload).length) return;
  await create(entityKey.value, payload as never);
  notifySuccess(`Created ${config.value.title}`);
  closeAdd();
  loadRows();
};

const handleUpdate = async () => {
  if (!selectedRow.value?.id) return;
  const payload = submitPayload();
  await update(entityKey.value, String(selectedRow.value.id), payload as never);
  notifySuccess(`Updated ${config.value.title}`);
  closeEdit();
  loadRows();
};

const handleDelete = async () => {
  if (!selectedRow.value?.id) return;
  await remove(entityKey.value, String(selectedRow.value.id));
  notifySuccess(`Deleted ${config.value.title}`);
  closeDelete();
  loadRows();
};

const resetStateForEntity = () => {
  resetForm();
  selectedRow.value = null;
  closeAdd();
  closeEdit();
  closeDelete();
};

watch(
  entityKey,
  () => {
    resetStateForEntity();
    loadRows();
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  () => {
    closeAdd();
    closeEdit();
    closeDelete();
  }
);
</script>
