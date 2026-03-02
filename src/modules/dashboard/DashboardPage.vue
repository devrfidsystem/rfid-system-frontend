<template>
  <section class="space-y-6">
    <PageHeader
      title="Dashboard"
      description="Operational health of RFID-enabled warehouses."
      tagline="Command Center"
      :icon="LayoutDashboard"
    />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card v-for="card in kpis" :key="card.label" class="ring-1 ring-gray-100">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-gray-400">{{ card.label }}</p>
            <p class="text-3xl font-semibold text-gray-900">{{ card.value }}</p>
            <p class="text-xs text-gray-500">{{ card.caption }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Icon :icon="card.icon" :size="20" />
          </div>
        </div>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2 ring-1 ring-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-gray-400">Heatmap</p>
            <h2 class="text-lg font-semibold text-gray-900">Inventory density</h2>
          </div>
          <p class="text-xs text-gray-500">Row / Column</p>
        </div>
        <div v-if="loading" class="mt-6 grid gap-3 md:grid-cols-4">
          <div v-for="n in 6" :key="n" class="h-20 rounded-lg bg-gray-200/70 animate-pulse"></div>
        </div>
        <div v-else class="mt-6 space-y-3">
          <div v-for="row in heatmapGrid" :key="row.row" class="flex gap-3">
            <div v-for="cell in row.cells" :key="cell.id" class="flex-1">
              <div
                class="rounded-lg px-3 py-4 text-center text-sm font-semibold"
                :class="heatTone(cell.quantity)"
              >
                <p class="truncate text-xs text-gray-700">{{ cell.label }}</p>
                <p class="text-xs text-gray-500">{{ cell.quantity }} units</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card class="ring-1 ring-gray-100">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-gray-400">Chart</p>
          <h2 class="text-lg font-semibold text-gray-900">Warehouse throughput</h2>
        </div>
        <div class="mt-6 space-y-4">
          <div v-for="item in chartBars" :key="item.label" class="space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ item.label }}</span>
              <span>{{ item.value }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100">
              <div class="h-2 rounded-full bg-primary-500" :style="{ width: `${item.pct}%` }"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Card from '@/app/ui/Card.vue';
import Icon from '@/app/ui/Icon.vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import { list } from '@/services/mock';
import type {
  StockBalanceRecord,
  TagRegistrationRecord,
  TransactionRecord,
  OpnameRecord,
  LocationRecord,
  WarehouseRecord
} from '@/types/entities';
import {
  LayoutDashboard,
  Box,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck
} from 'lucide-vue-next';

const loading = ref(true);
const stockBalance = ref<StockBalanceRecord[]>([]);
const tagRegistrations = ref<TagRegistrationRecord[]>([]);
const inboundRecords = ref<TransactionRecord[]>([]);
const outboundRecords = ref<TransactionRecord[]>([]);
const opnameRecords = ref<OpnameRecord[]>([]);
const locations = ref<LocationRecord[]>([]);
const warehouses = ref<WarehouseRecord[]>([]);

const loadData = async () => {
  loading.value = true;
  const [stock, tags, inbound, outbound, opname, locationResult, warehouseResult] = await Promise.all([
    list('stock_balance', { perPage: 50 }),
    list('tag_registrations', { perPage: 20 }),
    list('inbound', { perPage: 20 }),
    list('outbound', { perPage: 20 }),
    list('opname', { perPage: 20 }),
    list('locations', { perPage: 50 }),
    list('warehouses', { perPage: 10 })
  ]);
  stockBalance.value = stock.data as StockBalanceRecord[];
  tagRegistrations.value = tags.data as TagRegistrationRecord[];
  inboundRecords.value = inbound.data as TransactionRecord[];
  outboundRecords.value = outbound.data as TransactionRecord[];
  opnameRecords.value = opname.data as OpnameRecord[];
  locations.value = locationResult.data as LocationRecord[];
  warehouses.value = warehouseResult.data as WarehouseRecord[];
  loading.value = false;
};

loadData();

const totalStock = computed(() => stockBalance.value.reduce((sum, row) => sum + (row.quantity ?? 0), 0));
const epcActive = computed(() => tagRegistrations.value.length);
const latestInboundDate = computed(() => inboundRecords.value.reduce((latest, row) => (row.date > latest ? row.date : latest), '0000-00-00'));
const inboundToday = computed(() => inboundRecords.value.filter((record) => record.date === latestInboundDate.value).length);
const latestOutboundDate = computed(() => outboundRecords.value.reduce((latest, row) => (row.date > latest ? row.date : latest), '0000-00-00'));
const outboundToday = computed(() => outboundRecords.value.filter((record) => record.date === latestOutboundDate.value).length);
const opnamePending = computed(() => opnameRecords.value.filter((record) => record.status === 'pending').length);

const maxQuantity = computed(() => Math.max(...stockBalance.value.map((row) => row.quantity ?? 0), 1));

const heatmapGrid = computed(() => {
  const grouped: Record<number, { id: string; label: string; quantity: number }[]> = {};
  locations.value.forEach((loc) => {
    const qty = stockBalance.value
      .filter((row) => row.locationId === loc.id)
      .reduce((sum, row) => sum + (row.quantity ?? 0), 0);
    if (!grouped[loc.rowNo]) grouped[loc.rowNo] = [];
    grouped[loc.rowNo].push({
      id: loc.id,
      label: loc.path,
      quantity: qty
    });
  });
  return Object.entries(grouped)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([row, cells]) => ({ row: Number(row), cells }));
});

const heatTone = (value: number) => {
  const ratio = maxQuantity.value ? value / maxQuantity.value : 0;
  if (ratio > 0.8) return 'bg-primary-500 text-white';
  if (ratio > 0.6) return 'bg-primary-400 text-white';
  if (ratio > 0.4) return 'bg-primary-300 text-primary-900';
  if (ratio > 0.2) return 'bg-primary-200 text-primary-900';
  return 'bg-primary-100 text-primary-900';
};

const kpis = computed(() => [
  { label: 'Total Stock', value: totalStock.value, caption: 'All warehouses', icon: Box },
  { label: 'EPC Active', value: epcActive.value, caption: 'Tags monitored', icon: Zap },
  { label: 'Inbound Today', value: inboundToday.value, caption: latestInboundDate.value, icon: ArrowDownRight },
  { label: 'Outbound Today', value: outboundToday.value, caption: latestOutboundDate.value, icon: ArrowUpRight },
  { label: 'Opname Pending', value: opnamePending.value, caption: 'Scheduled audits', icon: ClipboardCheck }
]);

const chartData = computed(() =>
  warehouses.value.map((warehouse) => {
    const inboundTotal = inboundRecords.value
      .filter((record) => record.warehouseId === warehouse.id)
      .reduce((sum, row) => sum + row.items.reduce((sub, item) => sub + item.quantity, 0), 0);
    const outboundTotal = outboundRecords.value
      .filter((record) => record.warehouseId === warehouse.id)
      .reduce((sum, row) => sum + row.items.reduce((sub, item) => sub + item.quantity, 0), 0);
    const max = Math.max(inboundTotal, outboundTotal, 1);
    return {
      id: warehouse.id,
      name: warehouse.name,
      inboundTotal,
      outboundTotal,
      inboundPct: Math.min(100, Math.round((inboundTotal / max) * 100)),
      outboundPct: Math.min(100, Math.round((outboundTotal / max) * 100))
    };
  })
);

const chartBars = computed(() => {
  const maxValue = Math.max(...chartData.value.map((item) => item.inboundTotal + item.outboundTotal), 1);
  return chartData.value.map((entry) => ({
    label: entry.name,
    value: entry.inboundTotal + entry.outboundTotal,
    pct: Math.min(100, Math.round(((entry.inboundTotal + entry.outboundTotal) / maxValue) * 100))
  }));
});
</script>
