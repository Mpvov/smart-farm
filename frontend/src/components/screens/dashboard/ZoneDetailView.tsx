import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ChevronRight,
  Clock,
  Cpu,
  MapPin,
  Power,
  RefreshCw,
  Sliders,
  Sprout,
} from 'lucide-react';
import { useFarmStore } from '../../../store/useFarmStore';
import { apiFetch, subscribeZoneTelemetry } from '../../../lib/api';
import {
  CHART_RANGE_PRESETS,
  ChartRangeId,
  DEFAULT_CHART_METRIC,
  DEFAULT_CHART_RANGE,
  METRICS_ORDER,
  METRIC_META,
  MetricKey,
  STATUS_META,
  filterHistoryByRange,
  getChartThemeColors,
  getPlainMetricHint,
} from '../../../config/dashboard';
import {
  ActuatorItem,
  Device,
  Farm,
  MetricReading,
  Schedule,
  Threshold,
  Zone,
  ZoneLatestTelemetry,
} from '../../../types';
import { ScreenId } from '../../../config/navigation';

interface ZoneDetailViewProps {
  farm: Farm;
  zone: Zone;
  hasMultipleFarms: boolean;
  onBackToFarms: () => void;
  onBackToZones: () => void;
}

type DetailTab = 'realtime' | 'config' | 'profile';

const DAY_LABELS: Record<number, string> = {
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
  7: 'CN',
};

function computeMetricStatus(
  value: number,
  threshold?: Threshold,
  fallback: MetricReading['status'] = 'NORMAL'
): MetricReading['status'] {
  if (!threshold) return fallback;
  if (value < threshold.danger_min || value > threshold.danger_max) return 'CRITICAL';
  if (value < threshold.warning_min || value > threshold.warning_max) return 'WARNING';
  return 'NORMAL';
}

export const ZoneDetailView: React.FC<ZoneDetailViewProps> = ({
  farm,
  zone,
  hasMultipleFarms,
  onBackToFarms,
  onBackToZones,
}) => {
  const { user, theme, setActiveFarmId, setActiveZoneId, setActiveScreen, updateLiveTelemetry } = useFarmStore();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<DetailTab>('realtime');
  const [telemetry, setTelemetry] = useState<ZoneLatestTelemetry | null>(null);
  const [chartMetric, setChartMetric] = useState<MetricKey>(DEFAULT_CHART_METRIC);
  const [chartRange, setChartRange] = useState<ChartRangeId>(DEFAULT_CHART_RANGE);
  const [chartData, setChartData] = useState<Array<{ timestamp: string; value: number }>>([]);
  const [actuators, setActuators] = useState<ActuatorItem[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  const loadZoneContext = async () => {
    setLoading(true);
    try {
      const [telRes, histRes, actRes, thRes, scRes, devRes] = await Promise.all([
        apiFetch<{ data: ZoneLatestTelemetry }>(`/zones/${zone.id}/telemetry/latest`).catch(() => null),
        apiFetch<{ data: Array<{ timestamp: string; value: number }> }>(
          `/zones/${zone.id}/telemetry/history?metric=${chartMetric}&range=${chartRange}`
        ).catch(() => null),
        apiFetch<{ data: ActuatorItem[] }>(`/zones/${zone.id}/actuators`).catch(() => null),
        apiFetch<{ data: Threshold[] }>(`/zones/${zone.id}/thresholds`).catch(() => null),
        apiFetch<{ data: Schedule[] }>(`/zones/${zone.id}/schedules`).catch(() => null),
        apiFetch<{ data: Device[] }>(`/devices?zone_id=${zone.id}`).catch(() => null),
      ]);

      if (telRes) setTelemetry(telRes.data);
      if (histRes) setChartData(filterHistoryByRange(histRes.data, chartRange));
      if (actRes) setActuators(actRes.data);
      if (thRes) setThresholds(thRes.data);
      if (scRes) setSchedules(scRes.data);
      if (devRes) setDevices(devRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZoneContext();
  }, [zone.id]);

  useEffect(() => {
    apiFetch<{ data: Array<{ timestamp: string; value: number }> }>(
      `/zones/${zone.id}/telemetry/history?metric=${chartMetric}&range=${chartRange}`
    )
      .then((res) => setChartData(filterHistoryByRange(res.data, chartRange)))
      .catch(() => null);
  }, [zone.id, chartMetric, chartRange]);

  // Single realtime stream subscription via prototype adapter
  useEffect(() => {
    return subscribeZoneTelemetry(zone.id, (data) => {
      updateLiveTelemetry(data.metric, data.value, data.timestamp);

      setTelemetry((prev) => {
        if (!prev) return prev;
        const meta = METRIC_META[data.metric as MetricKey];
        const unit = meta?.unit ?? '%';
        const thresh = thresholds.find((t) => t.metric === data.metric);
        const prevStatus = prev.metrics[data.metric]?.status ?? 'NORMAL';
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            [data.metric]: {
              value: data.value,
              unit,
              status: computeMetricStatus(data.value, thresh, prevStatus),
              updated_at: data.timestamp,
            },
          },
        };
      });

      if (data.metric === chartMetric) {
        setChartData((prev) => [...prev.slice(-30), { timestamp: data.timestamp, value: data.value }]);
      }
    });
  }, [zone.id, chartMetric, thresholds, updateLiveTelemetry]);

  const jumpToScreen = (screenId: ScreenId) => {
    setActiveFarmId(farm.id);
    setActiveZoneId(zone.id);
    setActiveScreen(screenId);
  };

  const chartColors = getChartThemeColors(theme);
  const activeThreshold = thresholds.find((t) => t.metric === chartMetric);

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartColors.tooltipBg,
      borderColor: chartColors.tooltipBorder,
      textStyle: { color: chartColors.tooltipText, fontSize: 12 },
    },
    grid: { top: 32, left: 50, right: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.timestamp.slice(11, 19)),
      axisLine: { lineStyle: { color: chartColors.axisLine } },
      axisLabel: { color: chartColors.axisText, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: chartColors.splitLine } },
      axisLabel: { color: chartColors.axisText, fontSize: 11 },
    },
    series: [
      {
        name: chartMetric,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: chartData.map((d) => d.value),
        lineStyle: { color: chartColors.lineColor, width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: chartColors.areaTop },
              { offset: 1, color: chartColors.areaBottom },
            ],
          },
        },
        ...(activeThreshold
          ? {
              markArea: {
                silent: true,
                itemStyle: { color: chartColors.optimalBandBg },
                label: {
                  show: true,
                  position: 'insideTopRight',
                  color: chartColors.optimalBandText,
                  fontSize: 10,
                },
                data: [
                  [
                    { name: 'Vùng tối ưu', yAxis: activeThreshold.warning_min },
                    { yAxis: activeThreshold.warning_max },
                  ],
                ],
              },
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { color: chartColors.dangerLine, type: 'dashed', width: 1.5 },
                label: {
                  color: chartColors.dangerLine,
                  fontSize: 10,
                  formatter: '{b}: {c}',
                },
                data: [
                  { name: 'Nguy hiểm thấp', yAxis: activeThreshold.danger_min },
                  { name: 'Nguy hiểm cao', yAxis: activeThreshold.danger_max },
                ],
              },
            }
          : {}),
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
          {hasMultipleFarms && (
            <>
              <button
                type="button"
                onClick={onBackToFarms}
                className="hover:text-emerald-400 transition font-medium"
              >
                Tất cả Farm
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </>
          )}
          <button
            type="button"
            onClick={onBackToZones}
            className="hover:text-emerald-400 transition font-medium"
          >
            {farm.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-semibold">{zone.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">{zone.name}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sprout className="w-3 h-3" />
                {zone.crop_type}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {zone.area_m2} m²
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {farm.name} · {farm.location}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => jumpToScreen('SCR-03')}
              className="min-h-[48px] flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition active:scale-[0.98]"
            >
              <Power className="w-4 h-4" />
              <span>Điều khiển thiết bị</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => jumpToScreen('SCR-04')}
                className="min-h-[48px] flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition border border-slate-700 active:scale-[0.98]"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Cấu hình ngưỡng &amp; lịch</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadZoneContext}
              disabled={loading}
              className="min-h-[48px] flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl transition border border-slate-700 active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
        {[
          { id: 'realtime' as DetailTab, label: 'Realtime & Biểu đồ' },
          { id: 'config' as DetailTab, label: 'Cấu hình & Thiết bị' },
          { id: 'profile' as DetailTab, label: 'Hồ sơ Zone' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[44px] flex-1 sm:flex-initial whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Realtime */}
      {activeTab === 'realtime' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {METRICS_ORDER.map((key) => {
              const data = telemetry?.metrics?.[key];
              const meta = METRIC_META[key];
              const Icon = meta.Icon;
              const isSelected = chartMetric === key;
              const status = data?.status ?? 'NORMAL';
              const stMeta = STATUS_META[status];
              const StatusIcon = stMeta.Icon;
              const thresh = thresholds.find((t) => t.metric === key);
              const plainHint = getPlainMetricHint(key, data?.value, status, thresh);

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setChartMetric(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setChartMetric(key);
                    }
                  }}
                  className={`cursor-pointer bg-slate-900 rounded-2xl p-4 transition active:scale-[0.99] ${
                    isSelected
                      ? 'border-2 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                      : `${stMeta.cardCls} hover:border-slate-700`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{meta.title}</span>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                      {data ? data.value : '--'}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">{data?.unit ?? meta.unit}</span>
                  </div>

                  <div className="mt-1.5 text-xs font-semibold text-slate-200">{plainHint}</div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${stMeta.badgeCls}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{stMeta.label}</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {data?.updated_at ? data.updated_at.slice(11, 19) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Biểu đồ Diễn biến {METRIC_META[chartMetric].title} (
                  {CHART_RANGE_PRESETS.find((r) => r.id === chartRange)?.titleLabel ?? '24 giờ gần nhất'})
                </h3>
                <p className="text-xs text-slate-400">
                  Vùng xanh: ngưỡng tối ưu · Vạch đứt đỏ: ngưỡng nguy hiểm
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  {CHART_RANGE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setChartRange(preset.id)}
                      className={`min-h-[40px] min-w-[40px] px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        chartRange === preset.id
                          ? 'bg-slate-700 text-emerald-400 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  {METRICS_ORDER.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartMetric(m)}
                      className={`min-h-[40px] px-3 py-1 text-xs font-semibold rounded-lg transition ${
                        chartMetric === m
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Read-only Config & Actuators Summary */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Actuators Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-400" />
                <span>Thiết bị chấp hành ({actuators.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => jumpToScreen('SCR-03')}
                className="text-xs text-emerald-400 hover:underline font-medium"
              >
                Mở trang điều khiển →
              </button>
            </div>

            {actuators.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có thiết bị chấp hành trong phân khu.</p>
            ) : (
              <div className="space-y-2">
                {actuators.map((act) => (
                  <div
                    key={act.device_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{act.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {act.device_code} · {act.mode} · {act.status}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        act.state === 'ON'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {act.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thresholds Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Ngưỡng cảnh báo ({thresholds.length})</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => jumpToScreen('SCR-04')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  Chỉnh ngưỡng →
                </button>
              )}
            </div>

            {thresholds.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa cấu hình ngưỡng cho phân khu.</p>
            ) : (
              <div className="space-y-2">
                {thresholds.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs"
                  >
                    <span className="font-semibold text-slate-200">
                      {METRIC_META[t.metric as MetricKey]?.title ?? t.metric}
                    </span>
                    <div className="text-right font-mono text-[11px]">
                      <div className="text-amber-400">
                        Cảnh báo: {t.warning_min} – {t.warning_max}
                      </div>
                      <div className="text-rose-400">
                        Nguy hiểm: &lt;{t.danger_min} / &gt;{t.danger_max}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedules Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Lịch trình tự động ({schedules.length})</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => jumpToScreen('SCR-04')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  Quản lý lịch trình →
                </button>
              )}
            </div>

            {schedules.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có lịch trình vận hành nào.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {sc.device_name || `Thiết bị #${sc.device_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {sc.start_time} · {sc.duration_minutes} phút ·{' '}
                        {sc.days_of_week.map((d) => DAY_LABELS[d] ?? d).join(', ')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sc.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {sc.is_active ? 'Đang bật' : 'Tắt'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Zone Profile & Devices */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Hồ sơ phân khu</h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => jumpToScreen('SCR-09')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  Quản lý →
                </button>
              )}
            </div>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-400">Tên phân khu</dt>
                <dd className="text-slate-100 font-semibold mt-0.5">{zone.name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Nông trại trực thuộc</dt>
                <dd className="text-slate-200 font-medium mt-0.5">
                  {farm.name} ({farm.location})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Cây trồng chuyên canh</dt>
                <dd className="text-emerald-400 font-semibold mt-0.5">{zone.crop_type}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Diện tích canh tác</dt>
                <dd className="text-slate-200 font-mono mt-0.5">{zone.area_m2} m²</dd>
              </div>
              <div>
                <dt className="text-slate-400">Mô tả</dt>
                <dd className="text-slate-300 mt-0.5">{zone.description || 'Chưa có mô tả chi tiết.'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Thiết bị đang gắn ({devices.length})</span>
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => jumpToScreen('SCR-10')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  Danh mục thiết bị →
                </button>
              )}
            </div>

            {devices.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có thiết bị nào được gán vào phân khu này.</p>
            ) : (
              <div className="space-y-2">
                {devices.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{d.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {d.hardware_uid} · {d.type === 'SENSOR' ? 'Cảm biến' : 'Chấp hành'} ·{' '}
                        {d.metrics.join(', ')} · {d.is_simulated ? 'Mô phỏng' : 'Phần cứng'}
                      </div>
                    </div>
                    <span
                      className={`self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
