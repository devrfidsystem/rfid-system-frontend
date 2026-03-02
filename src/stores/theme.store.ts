import { defineStore } from 'pinia';

type ThemeMode = 'light' | 'dark';
type ThemeDensity = 'comfortable' | 'compact';

const STORAGE_KEYS = {
  mode: 'rfid-theme-mode',
  density: 'rfid-theme-density',
  sidebar: 'rfid-sidebar-collapsed'
};

const getPreferredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(STORAGE_KEYS.mode) as ThemeMode | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getPreferredDensity = (): ThemeDensity => {
  if (typeof window === 'undefined') return 'comfortable';
  const stored = window.localStorage.getItem(STORAGE_KEYS.density) as ThemeDensity | null;
  if (stored) return stored;
  return 'comfortable';
};

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'light' as ThemeMode,
    density: 'comfortable' as ThemeDensity,
    sidebarCollapsed: false,
    initialized: false
  }),
  getters: {
    isDark: (state) => state.mode === 'dark',
    isCompact: (state) => state.density === 'compact'
  },
  actions: {
    initialize() {
      if (this.initialized) return;
      this.mode = getPreferredMode();
      this.density = getPreferredDensity();
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEYS.sidebar);
        this.sidebarCollapsed = stored === 'true';
      }
      this.initialized = true;
    },
    setMode(mode: ThemeMode) {
      this.mode = mode;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.mode, mode);
      }
    },
    toggleMode() {
      this.setMode(this.mode === 'light' ? 'dark' : 'light');
    },
    setDensity(density: ThemeDensity) {
      this.density = density;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.density, density);
      }
    },
    toggleDensity() {
      this.setDensity(this.density === 'comfortable' ? 'compact' : 'comfortable');
    },
    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.sidebar, value ? 'true' : 'false');
      }
    },
    toggleSidebarCollapsed() {
      this.setSidebarCollapsed(!this.sidebarCollapsed);
    }
  }
});
