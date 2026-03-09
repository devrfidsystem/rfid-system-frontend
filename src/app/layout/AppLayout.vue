<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
  <div
    class="grid grid-cols-1 gap-0"
    :class="['grid grid-cols-1 gap-0', columnsClass]"
  >
      <Sidebar />
      <div class="min-w-0 flex flex-col bg-gray-50">
        <Topbar @toggle-sidebar="ui.toggleSidebar" />
        <main class="flex-1 bg-gray-50 overflow-auto px-4 py-4 lg:px-6 lg:py-6">
          <div class="mx-auto w-full max-w-[1400px] space-y-6">
            <router-view v-slot="{ Component, route }">
              <component :is="Component" :key="route.fullPath" />
            </router-view>
          </div>
        </main>
      </div>
    </div>
    <transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200">
      <div v-if="ui.sidebarOpen" class="fixed inset-0 z-40 lg:hidden">
        <div class="absolute inset-0 bg-gray-800/40" @click="ui.closeSidebar"></div>
        <div class="absolute left-0 top-0 h-full w-[280px] p-4">
          <Sidebar @close="ui.closeSidebar" />
        </div>
      </div>
    </transition>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';
import { useTheme } from '@/app/composables/useTheme';
import { useUiStore } from '@/stores/uiStore';
import { useRoute } from 'vue-router';
import ToastContainer from '@/app/ui/ToastContainer.vue';

const ui = useUiStore();
const theme = useTheme();
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);
const columnsClass = computed(() =>
  sidebarCollapsed.value ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[280px_1fr]'
);
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    ui.closeSidebar();
  }
);
</script>
