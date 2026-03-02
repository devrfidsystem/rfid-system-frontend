<template>
  <section class="space-y-6">
    <PageHeader title="Tracking" description="Search EPC history and activities." tagline="Log" :icon="Radar" />
    <Card>
      <div class="flex flex-wrap items-center gap-4">
        <Input v-model="epc" placeholder="Search EPC" class="w-full max-w-xs" />
        <Button variant="primary" @click="loadEvents">Search</Button>
      </div>
      <div class="mt-6">
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 4" :key="n" class="h-16 rounded-lg bg-gray-200/70 animate-pulse"></div>
        </div>
        <div v-else>
          <div v-if="!events.length" class="text-center text-sm text-gray-500">
            <p>Type an EPC to start tracking or use one of the sample tags.</p>
          </div>
          <div v-else class="space-y-6">
            <div id="timeline" class="space-y-4">
              <div
                v-for="event in sortedEvents"
                :key="event.id"
                class="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-400">
                  <span>{{ formatDate(event.timestamp) }}</span>
                  <span>{{ warehouseName(event.warehouseId) }}</span>
                </div>
                <div class="mt-3 space-y-2 text-sm text-gray-700">
                  <p class="text-sm font-semibold text-gray-900">{{ event.activity }}</p>
                  <p>Location: {{ locationPath(event.locationId) }}</p>
                  <p>Document: {{ event.documentRef }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from '@/app/ui/Button.vue';
import Card from '@/app/ui/Card.vue';
import Input from '@/app/ui/Input.vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import { list } from '@/services/mock';
import { Radar } from 'lucide-vue-next';
import type { EpcEventRecord, LocationRecord, WarehouseRecord } from '@/types/entities';

const epc = ref('EPC-A001');
const events = ref<EpcEventRecord[]>([]);
const loading = ref(false);
const locations = ref<LocationRecord[]>([]);
const warehouses = ref<WarehouseRecord[]>([]);

const loadEvents = async () => {
  loading.value = true;
  const result = await list('epc_events', { keyword: epc.value, perPage: 30 });
  events.value = result.data as EpcEventRecord[];
  loading.value = false;
};

const loadLookups = async () => {
  const [locationResult, warehouseResult] = await Promise.all([
    list('locations', { perPage: 50 }),
    list('warehouses', { perPage: 10 })
  ]);
  locations.value = locationResult.data as LocationRecord[];
  warehouses.value = warehouseResult.data as WarehouseRecord[];
};

const warehouseName = (id: string) => warehouses.value.find((wh) => wh.id === id)?.name ?? id;
const locationPath = (id: string) => locations.value.find((loc) => loc.id === id)?.path ?? id;

const sortedEvents = computed(() => [...events.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

const formatDate = (value: string) => new Date(value).toLocaleString();

loadLookups();
loadEvents();
</script>
