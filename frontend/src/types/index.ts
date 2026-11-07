export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface Farm {
  id: number;
  name: string;
  location: string;
  total_area: number;
  created_at: string;
}

export interface Zone {
  id: number;
  farm_id: number;
  name: string;
  crop_type: string;
  area_m2: number;
  description?: string;
  device_count?: number;
}

export interface Device {
  id: number;
  hardware_uid: string;
  name: string;
  type: 'SENSOR' | 'ACTUATOR';
  metrics: string[];
  zone_id: number;
  status: 'ONLINE' | 'OFFLINE';
  is_simulated: boolean;
}

export interface ActuatorItem {
  device_id: number;
  device_code: string;
  name: string;
  type: string;
  metric: string;
  state: 'ON' | 'OFF';
  mode: 'AUTO' | 'MANUAL';
  status: 'ONLINE' | 'OFFLINE';
  last_action_at: string;
}

export interface MetricReading {
  value: number;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  updated_at?: string;
}

export interface ZoneLatestTelemetry {
  zone_id: number;
  zone_name: string;
  crop_type: string;
  metrics: Record<string, MetricReading>;
}

export interface Threshold {
  id: number;
  zone_id: number;
  metric: string;
  warning_min: number;
  warning_max: number;
  danger_min: number;
  danger_max: number;
  auto_actions?: Array<{ trigger: string; target_metric?: string; action: string }>;
}

export interface Schedule {
  id: number;
  zone_id: number;
  device_id: number;
  device_name?: string;
  start_time: string;
  duration_minutes: number;
  days_of_week: number[];
  is_active: boolean;
}

export interface Alert {
  id: number;
  farm_id: number;
  zone_id: number;
  zone_name?: string;
  device_id?: number;
  metric?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'RESOLVED';
  note?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number;
  user_name: string;
  role: string;
  event_type: string;
  farm_name?: string;
  zone_name?: string;
  device_name?: string;
  action: string;
  details?: string;
  ip_address?: string;
}

export interface DashboardSummary {
  farm_id: number;
  farm_name: string;
  total_zones: number;
  total_devices: number;
  devices_online: number;
  active_alerts_count: number;
}
