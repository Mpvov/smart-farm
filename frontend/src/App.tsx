import React, { useEffect } from 'react';
import { useFarmStore } from './store/useFarmStore';
import { canAccessScreen } from './config/navigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Toaster } from 'sonner';

// Screens
import { LoginScreen } from './components/screens/LoginScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { DeviceControlScreen } from './components/screens/DeviceControlScreen';
import { ThresholdScheduleScreen } from './components/screens/ThresholdScheduleScreen';
import { AlertCenterScreen } from './components/screens/AlertCenterScreen';
import { ReportScreen } from './components/screens/ReportScreen';
import { AuditLogScreen } from './components/screens/AuditLogScreen';
import { UserManagementScreen } from './components/screens/UserManagementScreen';
import { FarmZoneScreen } from './components/screens/FarmZoneScreen';
import { DeviceInventoryScreen } from './components/screens/DeviceInventoryScreen';

export const App: React.FC = () => {
  const { activeScreen, setActiveScreen, user, theme } = useFarmStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user && !canAccessScreen(activeScreen, user.role)) {
      setActiveScreen('SCR-02');
    }
  }, [activeScreen, user, setActiveScreen]);

  const toastTheme = theme === 'sunlight' ? 'light' : 'dark';

  if (activeScreen === 'SCR-01' || !user) {
    return (
      <>
        <Toaster richColors position="top-right" theme={toastTheme} />
        <LoginScreen />
      </>
    );
  }

  const safeScreen = canAccessScreen(activeScreen, user.role) ? activeScreen : 'SCR-02';

  const renderScreen = () => {
    switch (safeScreen) {
      case 'SCR-02':
        return <DashboardScreen />;
      case 'SCR-03':
        return <DeviceControlScreen />;
      case 'SCR-04':
        return <ThresholdScheduleScreen />;
      case 'SCR-05':
        return <AlertCenterScreen />;
      case 'SCR-06':
        return <ReportScreen />;
      case 'SCR-07':
        return <AuditLogScreen />;
      case 'SCR-08':
        return <UserManagementScreen />;
      case 'SCR-09':
        return <FarmZoneScreen />;
      case 'SCR-10':
        return <DeviceInventoryScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Toaster richColors position="top-right" theme={toastTheme} />
      {/* 1. Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderScreen()}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
