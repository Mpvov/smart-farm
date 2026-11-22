import { create } from 'zustand';
import { User } from '../types';
import { ScreenId } from '../config/navigation';

const SIDEBAR_STORAGE_KEY = 'sf_sidebar_collapsed';

function readInitialSidebarCollapsed(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface FarmState {
  user: User | null;
  activeScreen: ScreenId;
  activeFarmId: number;
  activeZoneId: number;
  sidebarCollapsed: boolean;
  unreadAlertsCount: number;
  liveTelemetry: Record<string, { value: number; timestamp: string }>;
  setUser: (u: User | null) => void;
  setActiveScreen: (screenId: ScreenId) => void;
  setActiveFarmId: (farmId: number) => void;
  setActiveZoneId: (zoneId: number) => void;
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
  activeFarmId: 1,
  activeZoneId: 1,
  sidebarCollapsed: readInitialSidebarCollapsed(),
  unreadAlertsCount: 0,
  liveTelemetry: {},
  setUser: (user) => set({ user }),
  setActiveScreen: (screenId) => set({ activeScreen: screenId }),
  setActiveFarmId: (farmId) => set({ activeFarmId: farmId }),
  setActiveZoneId: (zoneId) => set({ activeZoneId: zoneId }),
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
