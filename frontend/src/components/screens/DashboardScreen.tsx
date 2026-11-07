import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { DashboardSummary, ZoneLatestTelemetry } from '../../types';
import ReactECharts from 'echarts-for-react';
import { Thermometer, Droplets, Sun, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardScreen: React.FC = () => {
  const { activeFarmId, activeZoneId, liveTelemetry, updateLiveTelemetry } = useFarmStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [telemetry, setTelemetry] = useState<ZoneLatestTelemetry | null>(null);
  const [chartMetric, setChartMetric] = useState<string>('SOIL');
  const [chartData, setChartData] = useState<Array<{ timestamp: string; value: number }>>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Summary & Telemetry
  const loadData = async () => {
    setLoading(true);
    try {
      const sumRes = await apiFetch<{ data: DashboardSummary }>(`/dashboard/summary?farm_id=${activeFarmId}`);
      setSummary(sumRes.data);

      if (activeZoneId) {
        const telRes = await apiFetch<{ data: ZoneLatestTelemetry }>(`/zones/${activeZoneId}/telemetry/latest`);
        setTelemetry(telRes.data);

        const histRes = await apiFetch<{ data: Array<{ timestamp: string; value: number }> }>(
          `/zones/${activeZoneId}/telemetry/history?metric=${chartMetric}`
        );
        setChartData(histRes.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarmId, activeZoneId, chartMetric]);

  // 2. Realtime SSE Connection
  useEffect(() => {
    if (!activeZoneId) return;

    const eventSource = new EventSource(`/api/v1/zones/${activeZoneId}/telemetry/stream`);

    eventSource.addEventListener('telemetry', (e) => {
      try {
        const data = JSON.parse(e.data);
        updateLiveTelemetry(data.metric, data.value, data.timestamp);

        // Update current telemetry state
        setTelemetry((prev) => {
          if (!prev) return prev;
          const unit = data.metric === 'TEMP' ? '°C' : data.metric === 'LIGHT' ? 'Lux' : '%';
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              [data.metric]: {
                value: data.value,
                unit,
                status: 'NORMAL',
                updated_at: data.timestamp,
              },
            },
          };
        });

        // If matching current chart metric, append
        if (data.metric === chartMetric) {
          setChartData((prev) => [...prev.slice(-30), { timestamp: data.timestamp, value: data.value }]);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [activeZoneId, chartMetric]);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'TEMP':
        return <Thermometer className="w-5 h-5 text-amber-400" />;
      case 'HUMI':
        return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'SOIL':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'LIGHT':
        return <Sun className="w-5 h-5 text-yellow-300" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getMetricTitle = (metric: string) => {
    switch (metric) {
      case 'TEMP':
        return 'Nhiệt độ không khí';
      case 'HUMI':
        return 'Độ ẩm không khí';
      case 'SOIL':
        return 'Độ ẩm đất canh tác';
      case 'LIGHT':
        return 'Cường độ ánh sáng';
      default:
        return metric;
    }
  };

  // ECharts Option
  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    grid: {
      top: 30,
      left: 50,
      right: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.timestamp.slice(11, 19)),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [
      {
        name: chartMetric,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: chartData.map((d) => d.value),
        lineStyle: { color: '#10b981', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Giám sát Thời gian thực</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE SSE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu vi khí hậu thu thập tự động theo chu kỳ cho {telemetry?.zone_name || 'Khu vực'}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400">Tổng Khu vực (Zones)</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{summary?.total_zones || 0}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Đang canh tác độc lập</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400">Thiết bị Kết nối</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {summary?.devices_online || 0} / {summary?.total_devices || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Trạng thái Online 98%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400">Cây trồng Chuyên canh</div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 truncate">
            {telemetry?.crop_type || 'Đang cập nhật'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Chu kỳ sinh trưởng chuẩn</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400">Cảnh báo Cần xử lý</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{summary?.active_alerts_count || 0}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Sự cố vi phạm ngưỡng</div>
        </div>
      </div>

      {/* 3. Sensor Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {telemetry &&
          Object.entries(telemetry.metrics).map(([key, data]) => {
            const isSelected = chartMetric === key;
            const isCritical = data.status === 'CRITICAL';
            const isWarning = data.status === 'WARNING';

            return (
              <div
                key={key}
                onClick={() => setChartMetric(key)}
                className={`cursor-pointer bg-slate-900 border rounded-xl p-4 transition relative overflow-hidden ${
                  isSelected ? 'border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{getMetricTitle(key)}</span>
                  {getMetricIcon(key)}
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">{data.value}</span>
                  <span className="text-sm font-medium text-slate-400">{data.unit}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px]">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isWarning
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isCritical ? 'Nguy hiểm' : isWarning ? 'Cảnh báo' : 'An toàn'}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {data.updated_at ? data.updated_at.slice(11, 19) : ''}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* 4. Chart Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Biểu đồ Diễn biến {getMetricTitle(chartMetric)} (24 Giờ gần nhất)
            </h3>
            <p className="text-xs text-slate-400">Xu hướng thay đổi và cập nhật điểm đo realtime từ Simulator</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
            {['TEMP', 'HUMI', 'SOIL', 'LIGHT'].map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  chartMetric === m ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};
