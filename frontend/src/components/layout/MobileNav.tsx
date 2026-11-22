import React, { useEffect, useState } from 'react';
import { LogOut, Menu, UserCircle, X } from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import {
  MOBILE_PRIMARY_TABS,
  ScreenId,
  getVisibleNavGroups,
  getVisibleNavItems,
} from '../../config/navigation';

export const MobileNav: React.FC = () => {
  const { activeScreen, setActiveScreen, user, unreadAlertsCount, logout } = useFarmStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleItems = getVisibleNavItems(user?.role);
  const primaryTabs = MOBILE_PRIMARY_TABS.map((id) => visibleItems.find((item) => item.id === id)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  );

  const drawerGroups = getVisibleNavGroups(user?.role)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !MOBILE_PRIMARY_TABS.includes(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const isDrawerScreenActive = !MOBILE_PRIMARY_TABS.includes(
    activeScreen as Exclude<ScreenId, 'SCR-01'>
  );
  const badgeText = unreadAlertsCount > 99 ? '99+' : String(unreadAlertsCount);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const handleSelectScreen = (id: ScreenId) => {
    setActiveScreen(id);
    setDrawerOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Điều hướng di động"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur z-40 px-1 py-1.5 grid grid-cols-5"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id && !drawerOpen;
          const showBadge = Boolean(tab.showAlertBadge && unreadAlertsCount > 0);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectScreen(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
                    {badgeText}
                  </span>
                )}
              </span>
              <span className="truncate max-w-full">{tab.shortLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-lg text-[10px] font-medium transition ${
            drawerOpen || isDrawerScreenActive
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>Thêm</span>
        </button>
      </nav>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            className="relative bg-slate-900 border-t border-slate-800 rounded-t-2xl max-h-[82vh] overflow-y-auto p-4 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-100">Menu điều hướng</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <UserCircle className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {user?.full_name || 'Người dùng'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {user?.role}
              </span>
            </div>

            {/* Remaining Role-Filtered Groups */}
            {drawerGroups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectScreen(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
