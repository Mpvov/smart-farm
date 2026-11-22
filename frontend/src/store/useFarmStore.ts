import { create } from 'zustand';
import { User } from '../types';
import { ScreenId } from '../config/navigation';

const SIDEBAR_STORAGE_KEY = 'sf_sidebar_collapsed';
const DEFAULT_FARM_STORAGE_KEY = 'sf_default_farm_id';
const THEME_STORAGE_KEY = 'sf_theme';

export type ThemeMode = 'sunlight' | 'dark';

function readInitialSidebarCollapsed(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function readInitialDefaultFarmId(): number | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(DEFAULT_FARM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function readInitialTheme(): ThemeMode {
  try {
    if (typeof window === 'undefined') return 'sunlight';
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'sunlight' ? raw : 'sunlight';
  } catch {
    return 'sunlight';
  }
}

function applyThemeAttribute(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

const initialDefaultFarmId = readInitialDefaultFarmId();
const initialTheme = readInitialTheme();
applyThemeAttribute(initialTheme);

interface FarmState {
  user: User | null;
  activeScreen: ScreenId;
  activeFarmId: number;
  activeZoneId: number;
  defaultFarmId: number | null;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  unreadAlertsCount: number;
  liveTelemetry: Record<string, { value: number; timestamp: string }>;
  setUser: (u: User | null) => void;
  setActiveScreen: (screenId: ScreenId) => void;
  setActiveFarmId: (farmId: number) => void;
  setActiveZoneId: (zoneId: number) => void;
  setDefaultFarmId: (farmId: number | null) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setUnreadAlertsCount: (count: number) => void;
  logout: () => void;
  updateLiveTelemetry: (metric: string, value: number, timestamp: string) => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  user: {
    id: 1,
    email: 'admin@smartfarm.vn',
    full_name: 'Quản Trị Viên (Owner)',
    role: 'ADMIN',
  },
  activeScreen: 'SCR-02',
  activeFarmId: initialDefaultFarmId ?? 1,
  activeZoneId: 1,
  defaultFarmId: initialDefaultFarmId,
  theme: initialTheme,
  sidebarCollapsed: readInitialSidebarCollapsed(),
  unreadAlertsCount: 0,
  liveTelemetry: {},
  setUser: (user) => set({ user }),
  setActiveScreen: (screenId) => set({ activeScreen: screenId }),
  setActiveFarmId: (farmId) => set({ activeFarmId: farmId }),
  setActiveZoneId: (zoneId) => set({ activeZoneId: zoneId }),
  setDefaultFarmId: (farmId) => {
    try {
      if (farmId === null) {
        window.localStorage.removeItem(DEFAULT_FARM_STORAGE_KEY);
      } else {
        window.localStorage.setItem(DEFAULT_FARM_STORAGE_KEY, String(farmId));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    set({ defaultFarmId: farmId });
  },
  setTheme: (theme) => {
    applyThemeAttribute(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === 'sunlight' ? 'dark' : 'sunlight';
      applyThemeAttribute(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      return { theme: next };
    }),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Ignore storage errors in restricted contexts
      }
      return { sidebarCollapsed: next };
    }),
  setUnreadAlertsCount: (count) => set({ unreadAlertsCount: count }),
  logout: () => set({ user: null, activeScreen: 'SCR-01', unreadAlertsCount: 0 }),
  updateLiveTelemetry: (metric, value, timestamp) =>
    set((state) => ({
      liveTelemetry: {
        ...state.liveTelemetry,
        [metric]: { value, timestamp },
      },
    })),
}));
