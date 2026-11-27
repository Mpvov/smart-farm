import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  OctagonAlert,
  Sun,
  Thermometer,
} from 'lucide-react';
import { MetricReading, Threshold, ZoneLatestTelemetry } from '../types';
import { ThemeMode } from '../store/useFarmStore';

export type MetricKey = 'TEMP' | 'HUMI' | 'SOIL' | 'LIGHT';
export type ChartRangeId = '1h' | '6h' | '24h' | '7d';

export const METRICS_ORDER: readonly MetricKey[] = ['TEMP', 'HUMI', 'SOIL', 'LIGHT'];

export const METRIC_META: Record<
  MetricKey,
  { title: string; shortLabel: string; unit: string; Icon: React.ElementType; color: string }
> = {
  TEMP: {
    title: 'Nhiệt độ không khí',
    shortLabel: 'Nhiệt độ',
    unit: '°C',
    Icon: Thermometer,
    color: 'text-amber-400',
  },
  HUMI: {
    title: 'Độ ẩm không khí',
    shortLabel: 'Ẩm KK',
    unit: '%',
    Icon: Droplets,
    color: 'text-blue-400',
  },
  SOIL: {
    title: 'Độ ẩm đất canh tác',
    shortLabel: 'Ẩm đất',
    unit: '%',
    Icon: Activity,
    color: 'text-emerald-400',
  },
  LIGHT: {
    title: 'Cường độ ánh sáng',
    shortLabel: 'Ánh sáng',
    unit: '%',
    Icon: Sun,
    color: 'text-yellow-300',
  },
};

export const CHART_RANGE_PRESETS: ReadonlyArray<{
  id: ChartRangeId;
  label: string;
  titleLabel: string;
  ms: number;
}> = [
  { id: '1h', label: '1h', titleLabel: '1 giờ gần nhất', ms: 1 * 3600_000 },
  { id: '6h', label: '6h', titleLabel: '6 giờ gần nhất', ms: 6 * 3600_000 },
  { id: '24h', label: '24h', titleLabel: '24 giờ gần nhất', ms: 24 * 3600_000 },
  { id: '7d', label: '7d', titleLabel: '7 ngày gần nhất', ms: 7 * 24 * 3600_000 },
];

export const DEFAULT_CHART_METRIC: MetricKey = 'SOIL';
export const DEFAULT_CHART_RANGE: ChartRangeId = '24h';

export const STATUS_PRIORITY: Record<MetricReading['status'], number> = {
  CRITICAL: 0,
  WARNING: 1,
  NORMAL: 2,
};

export const STATUS_META: Record<
  MetricReading['status'],
  {
    label: string;
    Icon: React.ElementType;
    badgeCls: string;
    cardCls: string;
    mapCls: string;
  }
> = {
  CRITICAL: {
    label: 'Nguy hiểm',
    Icon: OctagonAlert,
    badgeCls: 'bg-rose-500/15 text-rose-400 border-2 border-rose-500/40',
    cardCls: 'border-2 border-rose-500/40',
    mapCls: 'bg-rose-500/15 border-2 border-rose-500/40 text-rose-300',
  },
  WARNING: {
    label: 'Cảnh báo',
    Icon: AlertTriangle,
    badgeCls: 'bg-amber-500/15 text-amber-300 border-2 border-amber-500/40',
    cardCls: 'border-2 border-amber-500/40',
    mapCls: 'bg-amber-500/15 border-2 border-amber-500/40 text-amber-300',
  },
  NORMAL: {
    label: 'An toàn',
    Icon: CheckCircle2,
    badgeCls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cardCls: 'border border-slate-800',
    mapCls: 'bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400',
  },
};

const DEFAULT_SAFE_BOUNDS: Record<MetricKey, { min: number; max: number }> = {
  SOIL: { min: 45, max: 75 },
  TEMP: { min: 18, max: 32 },
  HUMI: { min: 50, max: 85 },
  LIGHT: { min: 1000, max: 8000 },
};

export function getZoneWorstStatus(telemetry?: ZoneLatestTelemetry): MetricReading['status'] {
  if (!telemetry?.metrics) return 'NORMAL';
  const statuses = Object.values(telemetry.metrics).map((m) => m.status);
  if (statuses.includes('CRITICAL')) return 'CRITICAL';
  if (statuses.includes('WARNING')) return 'WARNING';
  return 'NORMAL';
}

export function getPlainMetricHint(
  metric: MetricKey,
  value?: number,
  status?: MetricReading['status'],
  threshold?: Threshold
): string {
  if (value === undefined) return 'Chưa có số đo';
  if (!status || status === 'NORMAL') {
    switch (metric) {
      case 'SOIL':
        return 'Độ ẩm đất ổn';
      case 'TEMP':
        return 'Nhiệt độ dễ chịu';
      case 'HUMI':
        return 'Độ ẩm không khí ổn';
      case 'LIGHT':
        return 'Ánh sáng đủ';
    }
  }

  const bounds = threshold
    ? { min: threshold.warning_min, max: threshold.warning_max }
    : DEFAULT_SAFE_BOUNDS[metric];
  const isLow = value < bounds.min;

  switch (metric) {
    case 'SOIL':
      return isLow ? 'Đất khô — cần tưới' : 'Đất quá ướt';
    case 'TEMP':
      return isLow ? 'Trời quá lạnh' : 'Trời quá nóng';
    case 'HUMI':
      return isLow ? 'Không khí hanh khô' : 'Không khí quá ẩm';
    case 'LIGHT':
      return isLow ? 'Thiếu ánh sáng' : 'Nắng gắt';
  }
}

export function getChartThemeColors(theme: ThemeMode) {
  if (theme === 'sunlight') {
    return {
      axisText: '#334155',
      axisLine: '#94a3b8',
      splitLine: '#e2e8f0',
      tooltipBg: '#ffffff',
      tooltipBorder: '#cbd5e1',
      tooltipText: '#0f172a',
      legendText: '#1e293b',
      lineColor: '#047857',
      areaTop: 'rgba(4, 120, 87, 0.22)',
      areaBottom: 'rgba(4, 120, 87, 0.0)',
      optimalBandBg: 'rgba(16, 185, 129, 0.14)',
      optimalBandText: '#047857',
      dangerLine: '#e11d48',
    };
  }
  return {
    axisText: '#94a3b8',
    axisLine: '#334155',
    splitLine: '#1e293b',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    tooltipText: '#f8fafc',
    legendText: '#94a3b8',
    lineColor: '#10b981',
    areaTop: 'rgba(16, 185, 129, 0.35)',
    areaBottom: 'rgba(16, 185, 129, 0.0)',
    optimalBandBg: 'rgba(16, 185, 129, 0.1)',
    optimalBandText: '#34d399',
    dangerLine: '#fb7185',
  };
}

export function filterHistoryByRange(
  points: Array<{ timestamp: string; value: number }>,
  rangeId: ChartRangeId
): Array<{ timestamp: string; value: number }> {
  if (points.length <= 1) return points;
  const preset = CHART_RANGE_PRESETS.find((p) => p.id === rangeId);
  if (!preset) return points;

  const latestMs = Date.parse(points[points.length - 1].timestamp);
  if (Number.isNaN(latestMs)) return points;

  const cutoff = latestMs - preset.ms;
  const filtered = points.filter((p) => {
    const t = Date.parse(p.timestamp);
    return !Number.isNaN(t) && t >= cutoff;
  });

  return filtered.length >= 2 ? filtered : points.slice(-2);
}
