import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Layers,
  LogOut,
  MapPin,
  Moon,
  Sun,
  UserCircle,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { DashboardSummary, Farm, Zone } from '../../types';
import { getScreenMeta } from '../../config/navigation';
import { Select } from '../ui/Select';
import { Tooltip } from '../ui/Tooltip';

export const Header: React.FC = () => {
  const {
    activeScreen,
    activeFarmId,
    activeZoneId,
    setActiveFarmId,
    setActiveZoneId,
    user,
    setActiveScreen,
    unreadAlertsCount,
    setUnreadAlertsCount,
    theme,
    toggleTheme,
    logout,
  } = useFarmStore();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const meta = getScreenMeta(activeScreen);
  const contextScope = meta?.contextScope ?? 'global';
  const showFarm = contextScope === 'farm' || contextScope === 'farm-zone';
  const showZone = contextScope === 'farm-zone';

  useEffect(() => {
    apiFetch<{ data: Farm[] }>('/farms')
      .then((res) => setFarms(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!activeFarmId) return;
    apiFetch<{ data: Zone[] }>(`/farms/${activeFarmId}/zones`)
      .then((res) => {
        setZones(res.data);
        if (res.data.length > 0 && !res.data.some((z) => z.id === activeZoneId)) {
          setActiveZoneId(res.data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [activeFarmId]);

  useEffect(() => {
    if (!activeFarmId) return;
    apiFetch<{ data: DashboardSummary }>(`/dashboard/summary?farm_id=${activeFarmId}`)
      .then((res) => setUnreadAlertsCount(res.data.active_alerts_count ?? 0))
      .catch(() => {
        // Ignore silent telemetry badge refresh errors
      });
  }, [activeFarmId, activeScreen, setUnreadAlertsCount]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const farmOptions = farms.map((f) => ({ value: f.id, label: f.name }));
  const zoneOptions = zones.map((z) => ({ value: z.id, label: z.name, sublabel: z.crop_type }));

  const renderContextSelectors = (compact = false) => {
    if (!showFarm) return null;

    return (
      <>
        <Select
          value={activeFarmId}
          options={farmOptions}
          onChange={(val) => setActiveFarmId(Number(val))}
          ariaLabel="Chọn nông trại"
          icon={<MapPin className="w-4 h-4 text-emerald-400" />}
          className={compact ? 'flex-1 min-w-0' : 'min-w-[200px]'}
          buttonClassName={compact ? 'min-h-[44px]' : 'min-h-[40px]'}
        />

        {showZone && (
          <Select
            value={activeZoneId}
            options={zoneOptions}
            onChange={(val) => setActiveZoneId(Number(val))}
            ariaLabel="Chọn phân khu"
            icon={<Layers className="w-4 h-4 text-emerald-400" />}
            className={compact ? 'flex-1 min-w-0' : 'min-w-[210px]'}
            buttonClassName={compact ? 'min-h-[44px]' : 'min-h-[40px]'}
          />
        )}
      </>
    );
  };

  const badgeText = unreadAlertsCount > 99 ? '99+' : String(unreadAlertsCount);

  return (
    <header className="border-b border-slate-800 bg-slate-900/75 backdrop-blur sticky top-0 z-30">
      {/* Primary Row */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Page Breadcrumb & Title */}
        <div className="min-w-0">
          {meta?.groupLabel && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 leading-tight">
              <span>{meta.groupLabel}</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
            </div>
          )}
          <h1 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
            {meta?.label ?? 'Tổng quan'}
          </h1>
        </div>

        {/* Desktop/Tablet Context Switcher */}
        {showFarm && (
          <div className="hidden md:flex items-center gap-3 ml-auto mr-2">
            {renderContextSelectors(false)}
          </div>
        )}

        {/* Right Actions: Theme Toggle + Alerts + User Popover */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Tooltip
            title="Đổi chế độ hiển thị"
            description={
              theme === 'sunlight'
                ? 'Đang bật nền sáng tương phản cao cho ngoài trời. Bấm để chuyển sang nền tối.'
                : 'Đang dùng nền tối. Bấm để bật nền sáng tương phản cao dễ đọc dưới nắng gắt.'
            }
          >
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'sunlight' ? 'Chuyển sang chế độ Tối' : 'Bật chế độ Ngoài trời'}
              className="min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition active:scale-[0.97]"
            >
              {theme === 'sunlight' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Nắng gắt</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="hidden sm:inline">Tối</span>
                </>
              )}
            </button>
          </Tooltip>

          <Tooltip
            title="Trung tâm cảnh báo"
            description="Mở danh sách cảnh báo vượt ngưỡng để xem chi tiết và xác nhận xử lý."
          >
            <button
              type="button"
              onClick={() => setActiveScreen('SCR-05')}
              className="relative min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition active:scale-[0.97]"
              aria-label="Trung tâm cảnh báo"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {badgeText}
                </span>
              )}
            </button>
          </Tooltip>

          <div ref={profileRef} className="relative pl-2 sm:pl-3 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 py-1 px-2 rounded-xl hover:bg-slate-800/70 transition"
            >
              <UserCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="hidden sm:block text-left text-xs">
                <div className="font-semibold text-slate-200 max-w-[140px] truncate">
                  {user?.full_name || 'Người dùng'}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 space-y-3 z-50"
              >
                <div className="border-b border-slate-800 pb-2.5">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {user?.full_name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {user?.role}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Context Row on Mobile */}
      {showFarm && (
        <div className="md:hidden border-t border-slate-800/70 px-4 py-2 flex items-center gap-2">
          {renderContextSelectors(true)}
        </div>
      )}
    </header>
  );
};
