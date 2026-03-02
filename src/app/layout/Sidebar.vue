<template>
  <aside
    class="h-screen bg-white border-r border-gray-200 overflow-x-hidden transition-[width] duration-200 ease-out"
    :class="sidebarCollapsed ? 'w-20' : 'w-[280px]'"
  >
    <div class="flex h-full flex-col px-3 py-4">
      <div class="mb-6 flex items-center gap-3" :class="sidebarCollapsed ? 'justify-center' : ''">
        <div class="h-9 w-9 rounded-lg bg-primary-50 ring-1 ring-primary-100 grid place-items-center">
          <Icon :icon="LayoutDashboard" :size="20" className="text-primary-500" />
        </div>
        <div v-if="!sidebarCollapsed" class="flex flex-col">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">RFID</p>
          <p class="text-sm font-semibold text-gray-900">Warehouse Control</p>
        </div>
      </div>
      <nav class="flex-1">
        <div v-for="group in navGroups" :key="group.title">
          <p
            v-if="!sidebarCollapsed"
            class="mt-5 mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          >
            {{ group.title }}
          </p>
          <div>
            <RouterLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="group flex items-center rounded-md px-3 py-2 text-sm transition-colors text-gray-700"
              :class="[
                sidebarCollapsed ? 'justify-center gap-0' : 'gap-3 justify-start',
                isActive(item.path)
                  ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100 font-semibold'
                  : 'hover:bg-gray-50'
              ]"
              @click="closeOnNavigate"
              :title="sidebarCollapsed ? item.title : undefined"
            >
              <Icon
                :icon="item.icon"
                :size="18"
                :className="isActive(item.path) ? 'text-primary-700' : 'text-gray-500'"
              />
              <span v-if="!sidebarCollapsed">{{ item.title }}</span>
            </RouterLink>
          </div>
        </div>
      </nav>
      <div class="mt-auto pt-4">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 transition hover:bg-gray-50"
          @click="toggleCollapse"
        >
          <Icon :icon="sidebarCollapsed ? ChevronsRight : ChevronsLeft" :size="18" />
          <span v-if="!sidebarCollapsed">Collapse sidebar</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import Icon from '@/app/ui/Icon.vue';
import { useTheme } from '@/app/composables/useTheme';
import {
  LayoutDashboard,
  Tags,
  Radar,
  Layers,
  Grid,
  Users,
  Truck,
  Warehouse,
  MapPin,
  Ruler,
  Box,
  FileBarChart2,
  Activity,
  RotateCw,
  Repeat,
  Settings,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-vue-next';

type SidebarEmit = (event: 'close') => void;
const emit = defineEmits<SidebarEmit>();
const route = useRoute();
const theme = useTheme();
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`);
const closeOnNavigate = () => emit('close');

const toggleCollapse = () => theme.toggleSidebarCollapsed();

const navGroups = [
  {
    title: 'Core',
    items: [{ title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }]
  },
  {
    title: 'Log',
    items: [
      { title: 'Tag Registration', path: '/log/tag-registration', icon: Tags },
      { title: 'Tracking', path: '/log/tracking', icon: Radar }
    ]
  },
  {
    title: 'Master',
    items: [
      { title: 'Attribute', path: '/master/attribute', icon: Layers },
      { title: 'Category', path: '/master/category', icon: Grid },
      { title: 'Customer', path: '/master/customer', icon: Users },
      { title: 'Warehouse', path: '/master/warehouse', icon: Warehouse },
      { title: 'Location', path: '/master/location', icon: MapPin },
      { title: 'UoM', path: '/master/uom', icon: Ruler },
      { title: 'Supplier', path: '/master/supplier', icon: Truck },
      { title: 'Product', path: '/master/product', icon: Box }
    ]
  },
  {
    title: 'Reports',
    items: [
      { title: 'Inbound', path: '/report/inbound', icon: FileBarChart2 },
      { title: 'Outbound', path: '/report/outbound', icon: FileBarChart2 },
      { title: 'Stock Opname', path: '/report/stock-opname', icon: Activity },
      { title: 'Relocation', path: '/report/relocation', icon: RotateCw },
      { title: 'Transfer', path: '/report/transfer', icon: Repeat },
      { title: 'Return', path: '/report/return', icon: Activity },
      { title: 'Current Stock', path: '/report/current-stock', icon: FileBarChart2 },
      { title: 'Stock Period', path: '/report/stock-period', icon: FileBarChart2 }
    ]
  },
  {
    title: 'Settings',
    items: [
      { title: 'Menus', path: '/settings/menus', icon: Settings },
      { title: 'Roles', path: '/settings/roles', icon: Settings },
      { title: 'Users', path: '/settings/users', icon: Users },
      { title: 'User Companies', path: '/settings/user-companies', icon: Warehouse },
      { title: 'User Apps', path: '/settings/user-apps', icon: Activity }
    ]
  }
];
</script>
