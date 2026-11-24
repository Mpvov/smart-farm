import { create } from 'zustand';
import { User } from '../types';
import { ScreenId } from '../config/navigation';

const SIDEBAR_STORAGE_KEY = 'sf_sidebar_collapsed';
const DEFAULT_FARM_STORAGE_KEY = 'sf_default_farm_id';
const THEME_STORAGE_KEY = 'sf_theme';
const AUTH_TOKEN_STORAGE_KEY = 'sf_access_token';
const AUTH_USER_STORAGE_KEY = 'sf_user';

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

function readInitialAuth(): { user: User | null; accessToken: string | null } {
  try {
    if (typeof window === 'undefined') return { user: null, accessToken: null };
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!token || !rawUser) return { user: null, accessToken: null };
    const parsed = JSON.parse(rawUser) as User;
    if (!parsed || typeof parsed.id !== 'number' || !parsed.role) {
      return { user: null, accessToken: null };
    }
    return { user: parsed, accessToken: token };
  } catch {
    return { user: null, accessToken: null };
  }
}

const initialDefaultFarmId = readInitialDefaultFarmId();
const initialTheme = readInitialTheme();
const initialAuth = readInitialAuth();
applyThemeAttribute(initialTheme);

interface FarmState {
  user: User | null;
  accessToken: string | null;
  activeScreen: ScreenId;
  activeFarmId: number;
  activeZoneId: number;
  defaultFarmId: number | null;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  unreadAlertsCount: number;
  liveTelemetry: Record<string, { value: number; timestamp: string }>;
  setUser: (u: User | null) => void;
  setAuth: (user: User, token: string) => void;
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
  user: initialAuth.user,
  accessToken: initialAuth.accessToken,
  activeScreen: initialAuth.user && initialAuth.accessToken ? 'SCR-02' : 'SCR-01',
  activeFarmId: initialDefaultFarmId ?? 1,
  activeZoneId: 1,
  defaultFarmId: initialDefaultFarmId,
  theme: initialTheme,
  sidebarCollapsed: readInitialSidebarCollapsed(),
  unreadAlertsCount: 0,
  liveTelemetry: {},
  setUser: (user) => set({ user }),
  setAuth: (user, accessToken) => {
    try {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
    set({ user, accessToken, activeScreen: 'SCR-02' });
  },
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
  logout: () => {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    set({ user: null, accessToken: null, activeScreen: 'SCR-01', unreadAlertsCount: 0 });
  },
  updateLiveTelemetry: (metric, value, timestamp) =>
    set((state) => ({
      liveTelemetry: {
        ...state.liveTelemetry,
        [metric]: { value, timestamp },
      },
    })),
}));
