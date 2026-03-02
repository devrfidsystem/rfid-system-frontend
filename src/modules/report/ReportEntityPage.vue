<template>
  <section class="space-y-6">
    <PageHeader :title="config.title" :description="config.description" tagline="Reports" :icon="config.icon" />
    <Card>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-wrap gap-2">
          <label class="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">From</label>
          <input type="date" v-model="startDate" class="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium" />
          <label class="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">To</label>
          <input type="date" v-model="endDate" class="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium" />
        </div>
        <Input v-model="keyword" placeholder="Search reports" class="w-full max-w-xs" />
        <Select
          v-if="config.warehouseKey"
          v-model="selectedWarehouse"
          :options="warehouseOptions"
          placeholder="All Warehouses"
        />
        <Select
          v-if="config.partnerDataset"
          v-model="selectedPartner"
          :options="partnerOptions"
          :placeholder="`All ${config.partnerLabel}`"
        />
        <Button variant="secondary" @click="exportRows">Export CSV</Button>
      </div>

      <div class="mt-6">
        <LoadingState v-if="loading" :lines="5" />
        <EmptyState
          v-else-if="!rows.length"
          title="No records found"
          :description="`No ${config.title} entries match the current filters.`"
        />
        <Table v-else :columns="columns" :rows="rows">
          <template #actions="{ row }">
            <Button size="sm" variant="outline" @click="openDetail(row)">Detail</Button>
          </template>
        </Table>
      </div>
    </Card>

    <transition name="drawer">
      <div
        v-if="selectedRow"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Detail</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="selectedRow = null">✕</button>
        </div>
        <div class="mt-4 space-y-3 text-sm text-gray-600">
          <div v-for="(value, key) in selectedRow" :key="key" class="space-y-1">
            <p class="text-xs uppercase tracking-[0.3em] text-gray-400">{{ key }}</p>
            <p class="font-semibold text-gray-900">{{ value }}</p>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Button from '@/app/ui/Button.vue';
import Card from '@/app/ui/Card.vue';
import Input from '@/app/ui/Input.vue';
import Select from '@/app/ui/Select.vue';
import Table from '@/app/ui/Table.vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import EmptyState from '@/app/ui/states/EmptyState.vue';
import LoadingState from '@/app/ui/states/LoadingState.vue';
import { list } from '@/services/mock';
import { exportCsv } from '@/utils/exportCsv';
import { reportConfigs, type ReportKey } from './reportConfig';
import type { EntityKey } from '@/types/entities';

const route = useRoute();
const reportKey = computed(() => route.meta.report as ReportKey);
const config = computed(() => reportConfigs[reportKey.value]);

const rows = ref<Record<string, unknown>[]>([]);
const loading = ref(true);
const keyword = ref('');
const startDate = ref('');
const endDate = ref('');
const selectedWarehouse = ref('');
const selectedPartner = ref('');
const warehouses = ref<Record<string, string>[]>([]);
const partners = ref<Record<string, string>[]>([]);

const warehouseOptions = computed(() =>
  warehouses.value.map((warehouse) => ({ label: warehouse.name, value: warehouse.id }))
);
const partnerOptions = computed(() =>
  partners.value.map((partner) => ({ label: partner.name, value: partner.id }))
);
const selectedRow = ref<Record<string, unknown> | null>(null);

const columns = computed(() => [...config.value.columns, { key: 'actions', label: '' }]);

const loadOptions = async () => {
  const warehouseResult = await list('warehouses', { perPage: 10 });
  warehouses.value = warehouseResult.data;
  if (config.value.partnerDataset) {
    const partnerResult = await list(config.value.partnerDataset, { perPage: 20 });
    partners.value = partnerResult.data;
  }
};

const loadRows = async () => {
  loading.value = true;
  const filters: Record<string, string> = {};
  if (config.value.warehouseKey && selectedWarehouse.value) {
    filters[config.value.warehouseKey] = selectedWarehouse.value;
  }
  if (config.value.partnerKey && selectedPartner.value) {
    filters[config.value.partnerKey] = selectedPartner.value;
  }
  const result = await list(config.value.entity, {
    keyword: keyword.value,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    filters,
    perPage: 20
  });
  rows.value = result.data;
  loading.value = false;
};

const openDetail = (row: Record<string, unknown>) => {
  selectedRow.value = row;
};

const exportRows = () => {
  exportCsv(rows.value, `${config.value.title}.csv`);
};

watch([keyword, startDate, endDate, selectedWarehouse, selectedPartner], () => {
  loadRows();
});

watch(reportKey, () => {
  startDate.value = '';
  endDate.value = '';
  selectedWarehouse.value = '';
  selectedPartner.value = '';
  keyword.value = '';
  selectedRow.value = null;
  loadOptions();
  loadRows();
}, { immediate: true });
</script>
