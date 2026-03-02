import { computed, onMounted, watch } from 'vue';
import type { ComputedRef } from 'vue';
import { useThemeStore } from '@/stores/theme.store';

type ThemeHook = {
  mode: ComputedRef<'light' | 'dark'>;
  density: ComputedRef<'comfortable' | 'compact'>;
  sidebarCollapsed: ComputedRef<boolean>;
  toggleMode: () => void;
  toggleDensity: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

const applyThemeAttributes = (store: ReturnType<typeof useThemeStore>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = store.mode;
  root.dataset.density = store.density;
};

export const useTheme = (): ThemeHook => {
  const store = useThemeStore();
  store.initialize();

  watch(
    () => store.mode,
    () => applyThemeAttributes(store),
    { immediate: true }
  );
  watch(
    () => store.density,
    () => applyThemeAttributes(store),
    { immediate: true }
  );

  onMounted(() => applyThemeAttributes(store));

  return {
    mode: computed(() => store.mode),
    density: computed(() => store.density),
    sidebarCollapsed: computed(() => store.sidebarCollapsed),
    toggleMode: () => store.toggleMode(),
    toggleDensity: () => store.toggleDensity(),
    setSidebarCollapsed: (value: boolean) => store.setSidebarCollapsed(value),
    toggleSidebarCollapsed: () => store.toggleSidebarCollapsed()
  };
};
