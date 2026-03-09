<template>
  <header class="sticky top-0 z-30 border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div class="container mx-auto max-w-[1400px] px-4 lg:px-6 py-3 flex items-center gap-4">
      <div class="flex items-center gap-3">
        <button
          class="lg:hidden rounded-md border border-gray-200 bg-white p-2 text-gray-600"
          @click="$emit('toggle-sidebar')"
        >
          <Icon :icon="Menu" :size="20" />
        </button>
        <Breadcrumb :items="breadcrumbItems" />
        <IconButton
          variant="neutral"
          class="hidden lg:flex"
          @click="toggleSidebarCollapsed"
        >
          <Icon :icon="sidebarCollapsed ? ChevronsRight : ChevronsLeft" :size="16" />
        </IconButton>
      </div>
      <div class="flex flex-1 items-center">
        <div class="relative w-full max-w-[420px]">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :icon="Search" :size="16" />
          <input
            v-model="search"
            placeholder="Search commands"
            class="search-input"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">Export</Button>
        <Button variant="primary" size="sm">
          <template #leftIcon>
            <Icon :icon="Plus" :size="16" className="text-white" />
          </template>
          Add
        </Button>
        <IconButton variant="neutral" @click="toggleMode">
          <Icon :icon="themeModeIcon" :size="18" />
        </IconButton>
        <IconButton variant="neutral" @click="toggleDensity">
          <Icon :icon="themeDensityIcon" :size="18" />
        </IconButton>
        <IconButton variant="neutral">
          <Icon :icon="Bell" :size="18" />
        </IconButton>
        <div class="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 shadow-sm">
          <Icon :icon="User" :size="18" />
          <span class="font-semibold">{{ userName }}</span>
          <Button variant="ghost" size="sm" class="px-2 py-1" :loading="logoutLoading" @click="handleLogout">
            Logout
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumb from '@/app/ui/Breadcrumb.vue';
import Button from '@/app/ui/Button.vue';
import Icon from '@/app/ui/Icon.vue';
import IconButton from '@/app/ui/IconButton.vue';
import { Bell, Plus, Search, Sun, Moon, Shrink, Expand, Menu, ChevronsLeft, ChevronsRight, User } from 'lucide-vue-next';
import { useTheme } from '@/app/composables/useTheme';
import { useAuthStore } from '@/stores/auth';
import { useNotifier } from '@/composables/useNotifier';

const search = ref('');
const theme = useTheme();
const authStore = useAuthStore();
const router = useRouter();
const logoutLoading = ref(false);
const { withToast } = useNotifier();

const themeModeIcon = computed(() => (theme.mode.value === 'dark' ? Sun : Moon));
const themeDensityIcon = computed(() => (theme.density.value === 'compact' ? Expand : Shrink));
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);

const toggleMode = () => theme.toggleMode();
const toggleDensity = () => theme.toggleDensity();
const toggleSidebarCollapsed = () => theme.toggleSidebarCollapsed();

const userName = computed(() => authStore.profile?.user.fullName ?? 'User');

const handleLogout = async () => {
  if (logoutLoading.value) return;

  try {
    await withToast(
      () => authStore.logout(),
      {
        loadingRef: logoutLoading,
        successMessage: 'Kamu telah keluar dari sesi.',
        errorMessage: 'Logout gagal. Coba lagi nanti.'
      }
    );
    await router.replace('/auth/login');
  } catch {
    // already handled by withToast
  }
};

defineProps<{}>();

const breadcrumbItems = [
  { label: 'Command Center', active: false },
  { label: 'Dashboard', active: true }
];
</script>
