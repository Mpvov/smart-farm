import React from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import {
  LayoutDashboard,
  Power,
  Sliders,
  AlertTriangle,
  FileBarChart2,
  Menu,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeScreen, setActiveScreen } = useFarmStore();

  const mobileTabs = [
    { id: 'SCR-02', label: 'Monitor', icon: LayoutDashboard },
    { id: 'SCR-03', label: 'Control', icon: Power },
    { id: 'SCR-04', label: 'Config', icon: Sliders },
    { id: 'SCR-05', label: 'Alerts', icon: AlertTriangle },
    { id: 'SCR-06', label: 'Report', icon: FileBarChart2 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur z-40 px-2 py-1.5 flex items-center justify-around">
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveScreen(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
