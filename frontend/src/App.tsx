import React from 'react';
import { useFarmStore } from './store/useFarmStore';
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
  const { activeScreen, user } = useFarmStore();

  if (activeScreen === 'SCR-01' || !user) {
    return (
      <>
        <Toaster richColors position="top-right" theme="dark" />
        <LoginScreen />
      </>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
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
      <Toaster richColors position="top-right" theme="dark" />
      {/* 1. Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
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
