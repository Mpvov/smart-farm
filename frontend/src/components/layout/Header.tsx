import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Farm, Zone } from '../../types';
import { Bell, Activity, MapPin, Layers, UserCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeFarmId, activeZoneId, setActiveFarmId, setActiveZoneId, user, setActiveScreen } = useFarmStore();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    apiFetch<{ data: Farm[] }>('/farms')
      .then((res) => setFarms(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (activeFarmId) {
      apiFetch<{ data: Zone[] }>(`/farms/${activeFarmId}/zones`)
        .then((res) => {
          setZones(res.data);
          if (res.data.length > 0 && !res.data.some((z) => z.id === activeZoneId)) {
            setActiveZoneId(res.data[0].id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [activeFarmId]);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Farm & Zone Switcher */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <select
            value={activeFarmId}
            onChange={(e) => setActiveFarmId(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs sm:text-sm rounded-lg px-2.5 py-1.5 font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <select
            value={activeZoneId}
            onChange={(e) => setActiveZoneId(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs sm:text-sm rounded-lg px-2.5 py-1.5 font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.crop_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Action Profile & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveScreen('SCR-05')}
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          title="Trung tâm Cảnh báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
          <UserCircle className="w-6 h-6 text-emerald-400" />
          <div className="text-left text-xs">
            <div className="font-semibold text-slate-200">{user?.full_name || 'Admin'}</div>
            <div className="text-slate-400 font-mono text-[10px]">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
