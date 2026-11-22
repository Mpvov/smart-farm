import React from 'react';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getVisibleNavGroups } from '../../config/navigation';

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    user,
    sidebarCollapsed,
    toggleSidebar,
    unreadAlertsCount,
    logout,
  } = useFarmStore();

  const groups = getVisibleNavGroups(user?.role);
  const badgeText = unreadAlertsCount > 99 ? '99+' : String(unreadAlertsCount);

  return (
    <aside
      className={`hidden lg:flex ${
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0 transition-[width] duration-200`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand + Collapse Toggle */}
        <div
          className={`h-16 border-b border-slate-800 flex items-center shrink-0 ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                SF
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm tracking-wide text-slate-100 truncate">SMART FARM</div>
                <div className="text-[10px] text-emerald-400 font-mono tracking-wider truncate">
                  MANAGEMENT OS
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((group, idx) => (
            <div key={group.id}>
              {sidebarCollapsed ? (
                idx > 0 && <div className="border-t border-slate-800/80 my-2" />
              ) : (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.label}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  const showBadge = Boolean(item.showAlertBadge && unreadAlertsCount > 0);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveScreen(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`relative w-full flex items-center ${
                        sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                      } rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r"
                        />
                      )}

                      <span className="relative shrink-0">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {sidebarCollapsed && showBadge && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"
                          />
                        )}
                      </span>

                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                      {!sidebarCollapsed && showBadge && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {badgeText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Logout */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <button
          type="button"
          onClick={logout}
          title={sidebarCollapsed ? 'Đăng xuất' : undefined}
          aria-label="Đăng xuất"
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
          } text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};
