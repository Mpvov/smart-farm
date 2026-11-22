import React from 'react';
import {
  AlertTriangle,
  Cpu,
  FileBarChart2,
  LayoutDashboard,
  Power,
  ShieldCheck,
  Sliders,
  Sprout,
  Users,
} from 'lucide-react';
import { User } from '../types';

export type ScreenId =
  | 'SCR-01'
  | 'SCR-02'
  | 'SCR-03'
  | 'SCR-04'
  | 'SCR-05'
  | 'SCR-06'
  | 'SCR-07'
  | 'SCR-08'
  | 'SCR-09'
  | 'SCR-10';

export type NavGroupId = 'operations' | 'analytics' | 'admin';
export type ContextScope = 'global' | 'farm' | 'farm-zone';

export interface NavItem {
  id: Exclude<ScreenId, 'SCR-01'>;
  label: string;
  shortLabel: string;
  group: NavGroupId;
  icon: React.ElementType;
  adminOnly?: boolean;
  contextScope: ContextScope;
  showAlertBadge?: boolean;
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

export const NAV_GROUPS: NavGroup[] = [
  { id: 'operations', label: 'Vận hành' },
  { id: 'analytics', label: 'Phân tích' },
  { id: 'admin', label: 'Quản trị' },
];

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'SCR-02',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    group: 'operations',
    icon: LayoutDashboard,
    contextScope: 'global',
  },
  {
    id: 'SCR-03',
    label: 'Điều khiển thiết bị',
    shortLabel: 'Điều khiển',
    group: 'operations',
    icon: Power,
    contextScope: 'farm-zone',
  },
  {
    id: 'SCR-05',
    label: 'Trung tâm cảnh báo',
    shortLabel: 'Cảnh báo',
    group: 'operations',
    icon: AlertTriangle,
    contextScope: 'farm',
    showAlertBadge: true,
  },
  {
    id: 'SCR-06',
    label: 'Báo cáo HTTT',
    shortLabel: 'Báo cáo',
    group: 'analytics',
    icon: FileBarChart2,
    contextScope: 'farm-zone',
  },
  {
    id: 'SCR-07',
    label: 'Nhật ký hoạt động',
    shortLabel: 'Nhật ký',
    group: 'analytics',
    icon: ShieldCheck,
    adminOnly: true,
    contextScope: 'global',
  },
  {
    id: 'SCR-04',
    label: 'Ngưỡng & Lịch trình',
    shortLabel: 'Ngưỡng/Lịch',
    group: 'admin',
    icon: Sliders,
    adminOnly: true,
    contextScope: 'farm-zone',
  },
  {
    id: 'SCR-09',
    label: 'Nông trại & Phân khu',
    shortLabel: 'Nông trại',
    group: 'admin',
    icon: Sprout,
    adminOnly: true,
    contextScope: 'farm',
  },
  {
    id: 'SCR-10',
    label: 'Danh mục thiết bị',
    shortLabel: 'Thiết bị',
    group: 'admin',
    icon: Cpu,
    adminOnly: true,
    contextScope: 'farm-zone',
  },
  {
    id: 'SCR-08',
    label: 'Người dùng & Phân quyền',
    shortLabel: 'Người dùng',
    group: 'admin',
    icon: Users,
    adminOnly: true,
    contextScope: 'global',
  },
];

export const MOBILE_PRIMARY_TABS: Exclude<ScreenId, 'SCR-01'>[] = [
  'SCR-02',
  'SCR-03',
  'SCR-05',
  'SCR-06',
];

export function canAccessScreen(screenId: ScreenId, role?: User['role']): boolean {
  if (screenId === 'SCR-01') return true;
  const item = NAV_ITEMS.find((nav) => nav.id === screenId);
  if (!item) return false;
  return item.adminOnly ? role === 'ADMIN' : true;
}

export function getVisibleNavItems(role?: User['role']): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN');
}

export function getVisibleNavGroups(role?: User['role']): Array<NavGroup & { items: NavItem[] }> {
  const visible = getVisibleNavItems(role);
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: visible.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

export function getScreenMeta(screenId: ScreenId): (NavItem & { groupLabel: string }) | undefined {
  if (screenId === 'SCR-01') return undefined;
  const item = NAV_ITEMS.find((nav) => nav.id === screenId);
  if (!item) return undefined;
  const group = NAV_GROUPS.find((g) => g.id === item.group);
  return { ...item, groupLabel: group?.label ?? '' };
}
