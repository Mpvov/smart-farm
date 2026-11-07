import { create } from 'zustand';
import { User, Farm, Zone } from '../types';

interface FarmState {
  user: User | null;
  activeScreen: string; // 'SCR-02' (Dashboard), 'SCR-03' (Device Control), etc.
  activeFarmId: number;
  activeZoneId: number;
  liveTelemetry: Record<string, { value: number; timestamp: string }>;
  setUser: (u: User | null) => void;
  setActiveScreen: (screenId: string) => void;
  setActiveFarmId: (farmId: number) => void;
  setActiveZoneId: (zoneId: number) => void;
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
  liveTelemetry: {},
  setUser: (user) => set({ user }),
  setActiveScreen: (screenId) => set({ activeScreen: screenId }),
  setActiveFarmId: (farmId) => set({ activeFarmId: farmId }),
  setActiveZoneId: (zoneId) => set({ activeZoneId: zoneId }),
  updateLiveTelemetry: (metric, value, timestamp) =>
    set((state) => ({
      liveTelemetry: {
        ...state.liveTelemetry,
        [metric]: { value, timestamp },
      },
    })),
}));
