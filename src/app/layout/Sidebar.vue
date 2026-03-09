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
import { computed, type Component } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import Icon from '@/app/ui/Icon.vue';
import { useTheme } from '@/app/composables/useTheme';
import { useAccess } from '@/composables/useAccess';
import {
  LayoutDashboard,
  Grid,
  Warehouse,
  Box,
  FileBarChart2,
  Activity,
  RotateCw,
  Truck,
  Settings,
  Users,
  MapPin,
  Layers,
  Wifi,
  Radar,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-vue-next';
import type { MenuTreeNode } from '@/services/auth';

type SidebarEmit = (event: 'close') => void;
type NavItem = { title: string; path: string; icon: Component };
type NavGroup = { title: string; items: NavItem[] };

const emit = defineEmits<SidebarEmit>();
const route = useRoute();
const theme = useTheme();
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);
const { menuTree } = useAccess();

const iconMap: Record<string, Component> = {
  DASHBOARD: LayoutDashboard,
  MASTER: Grid,
  MASTER_DATA: Grid,
  WAREHOUSES: Warehouse,
  PRODUCTS: Box,
  TRANSACTIONS: Activity,
  INBOUND: RotateCw,
  OUTBOUND: Truck,
  STOCK: Layers,
  RFID: Wifi,
  REPORTS: FileBarChart2,
  SETTINGS: Settings,
  USERS: Users,
  LOCATION: MapPin,
  LOG: Radar,
  DEFAULT: LayoutDashboard
};

const getIcon = (code?: string | null) => {
  const normalized = code?.toUpperCase() ?? 'DEFAULT';
  return iconMap[normalized] ?? iconMap.DEFAULT;
};

const collectNavItems = (node: MenuTreeNode) => {
  const items: NavItem[] = [];
  const traverse = (current: MenuTreeNode) => {
    if (current.permissions.canView && current.path) {
      items.push({
        title: current.name,
        path: current.path,
        icon: getIcon(current.code)
      });
    }
    current.children.forEach(traverse);
  };
  traverse(node);
  return items;
};

const navGroups = computed<NavGroup[]>(() =>
  menuTree.value
    .filter((node) => node.permissions.canView)
    .map((node) => ({
      title: node.name,
      items: collectNavItems(node)
    }))
    .filter((group) => group.items.length > 0)
);

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`);
const closeOnNavigate = () => emit('close');
const toggleCollapse = () => theme.toggleSidebarCollapsed();
</script>
