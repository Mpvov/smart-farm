import React from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import {
  LayoutDashboard,
  Power,
  Sliders,
  AlertTriangle,
  FileBarChart2,
  ShieldCheck,
  Users,
  Sprout,
  Cpu,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'SCR-02', name: 'Live Dashboard', icon: LayoutDashboard },
  { id: 'SCR-03', name: 'Điều khiển Thiết bị', icon: Power },
  { id: 'SCR-04', name: 'Ngưỡng & Lịch trình', icon: Sliders },
  { id: 'SCR-05', name: 'Trung tâm Cảnh báo', icon: AlertTriangle },
  { id: 'SCR-06', name: 'Báo cáo HTTT', icon: FileBarChart2 },
  { id: 'SCR-07', name: 'Nhật ký Audit Log', icon: ShieldCheck },
  { id: 'SCR-08', name: 'Người dùng & Role', icon: Users, adminOnly: true },
  { id: 'SCR-09', name: 'Nông trại & Phân khu', icon: Sprout, adminOnly: true },
  { id: 'SCR-10', name: 'Danh mục Thiết bị', icon: Cpu, adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, user, setUser } = useFarmStore();

  const handleLogout = () => {
    setUser(null);
    setActiveScreen('SCR-01');
  };

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            SF
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-slate-100">SMART FARM</div>
            <div className="text-[10px] text-emerald-400 font-mono tracking-wider">MANAGEMENT OS</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'ADMIN') return null;
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                <span className="ml-auto text-[10px] opacity-40 font-mono">{item.id}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
