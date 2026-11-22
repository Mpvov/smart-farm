import React from 'react';
import { Activity, Droplets, Sun, Thermometer } from 'lucide-react';

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
    unit: 'Lux',
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
