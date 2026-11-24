import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { ActuatorItem, Device, ZoneLatestTelemetry } from '../../types';
import {
  METRIC_META,
  MetricKey,
  STATUS_META,
  getChartThemeColors,
  getPlainMetricHint,
} from '../../config/dashboard';
import { Activity, Cpu, Plus, Power, Wifi, WifiOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { Select } from '../ui/Select';
import { Tooltip } from '../ui/Tooltip';

export const DeviceInventoryScreen: React.FC = () => {
  const { activeZoneId, theme, setActiveScreen } = useFarmStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'SENSOR' | 'ACTUATOR'>('SENSOR');
  const [metricsStr, setMetricsStr] = useState('TEMP,HUMI');
  const [isSim, setIsSim] = useState(true);
  const [loading, setLoading] = useState(false);

  // Device detail modal state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sensorTelemetry, setSensorTelemetry] = useState<ZoneLatestTelemetry | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('TEMP');
  const [historyPoints, setHistoryPoints] = useState<Array<{ timestamp: string; value: number }>>([]);
  const [actuatorInfo, setActuatorInfo] = useState<ActuatorItem | null>(null);
  const [controlling, setControlling] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await apiFetch<{ data: Device[] }>(`/devices?zone_id=${activeZoneId}`);
      setDevices(res.data);
    } catch {
      toast.error('Lỗi tải danh mục thiết bị');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [activeZoneId]);

  useEffect(() => {
    if (!selectedDevice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDevice(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDevice]);

  const loadSensorMetricHistory = async (zoneId: number, metric: string) => {
    setSelectedMetric(metric);
    try {
      const histRes = await apiFetch<{ data: Array<{ timestamp: string; value: number }> }>(
        `/zones/${zoneId}/telemetry/history?metric=${metric}&range=24h`
      );
      setHistoryPoints(histRes.data);
    } catch {
      setHistoryPoints([]);
    }
  };

  const openDeviceDetail = async (dev: Device) => {
    setSelectedDevice(dev);
    setDetailLoading(true);
    setSensorTelemetry(null);
    setHistoryPoints([]);
    setActuatorInfo(null);

    try {
      if (dev.type === 'SENSOR') {
        const firstMetric = dev.metrics[0] || 'TEMP';
        setSelectedMetric(firstMetric);
        const [telRes, histRes] = await Promise.all([
          apiFetch<{ data: ZoneLatestTelemetry }>(`/zones/${dev.zone_id}/telemetry/latest`).catch(() => null),
          apiFetch<{ data: Array<{ timestamp: string; value: number }> }>(
            `/zones/${dev.zone_id}/telemetry/history?metric=${firstMetric}&range=24h`
          ).catch(() => null),
        ]);
        if (telRes) setSensorTelemetry(telRes.data);
        if (histRes) setHistoryPoints(histRes.data);
      } else {
        const actRes = await apiFetch<{ data: ActuatorItem[] }>(`/zones/${dev.zone_id}/actuators`);
        const matched = actRes.data.find((a) => a.device_id === dev.id) || null;
        setActuatorInfo(matched);
      }
    } catch {
      toast.error('Lỗi tải chi tiết thiết bị');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleControlActuator = async () => {
    if (!selectedDevice) return;
    const nextAction = actuatorInfo?.state === 'ON' ? 'OFF' : 'ON';
    setControlling(true);
    try {
      await apiFetch(`/devices/${selectedDevice.id}/control`, {
        method: 'POST',
        body: JSON.stringify({ action: nextAction }),
      });
      toast.success(`Đã ${nextAction === 'ON' ? 'BẬT' : 'TẮT'} ${selectedDevice.name}`);
      const actRes = await apiFetch<{ data: ActuatorItem[] }>(`/zones/${selectedDevice.zone_id}/actuators`);
      setActuatorInfo(actRes.data.find((a) => a.device_id === selectedDevice.id) || null);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi gửi lệnh điều khiển');
    } finally {
      setControlling(false);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const metrics = metricsStr
        .split(',')
        .map((m) => m.trim().toUpperCase())
        .filter(Boolean);
      await apiFetch('/devices', {
        method: 'POST',
        body: JSON.stringify({
          hardware_uid: uid.trim(),
          name: name.trim(),
          type,
          metrics,
          zone_id: activeZoneId,
          is_simulated: isSim,
        }),
      });
      toast.success('Đã đăng ký thiết bị mới');
      setUid('');
      setName('');
      fetchDevices();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const chartColors = getChartThemeColors(theme);
  const currentReading = sensorTelemetry?.metrics?.[selectedMetric];
  const currentMeta = METRIC_META[selectedMetric as MetricKey];
  const currentStatusMeta = currentReading ? STATUS_META[currentReading.status] : null;

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartColors.tooltipBg,
      borderColor: chartColors.tooltipBorder,
      textStyle: { color: chartColors.tooltipText, fontSize: 12 },
    },
    grid: { left: 42, right: 16, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: historyPoints.map((p) => p.timestamp.slice(11, 16)),
      axisLine: { lineStyle: { color: chartColors.axisLine } },
      axisLabel: { color: chartColors.axisText, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: chartColors.splitLine, type: 'dashed' } },
      axisLabel: { color: chartColors.axisText, fontSize: 11 },
    },
    series: [
      {
        name: currentMeta?.shortLabel || selectedMetric,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: historyPoints.map((p) => p.value),
        lineStyle: { color: chartColors.lineColor, width: 2.5 },
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
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>Quản lý Danh mục Thiết bị Nông trại (Dynamic 1..N)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Gán/gỡ thiết bị động vào từng Zone; bấm vào từng thiết bị để xem biểu đồ cảm biến hoặc điều khiển trực tiếp
        </p>
      </div>

      {/* Form đăng ký */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Đăng ký Thiết bị Mới vào Zone</span>
        </h3>

        <form onSubmit={handleRegisterDevice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mã UID Phần cứng</label>
            <input
              type="text"
              required
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              placeholder="DHT20-Z1-02"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tên thiết bị</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Cảm biến độ ẩm phụ"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Phân loại</label>
            <Select<'SENSOR' | 'ACTUATOR'>
              value={type}
              onChange={(val) => setType(val)}
              ariaLabel="Phân loại thiết bị"
              buttonClassName="min-h-[40px] rounded-lg text-xs py-1.5"
              options={[
                { value: 'SENSOR', label: 'Cảm biến (Input)' },
                { value: 'ACTUATOR', label: 'Chấp hành (Output)' },
              ]}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Metrics (cách bởi dấu phẩy)</label>
            <input
              type="text"
              required
              value={metricsStr}
              onChange={(e) => setMetricsStr(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              placeholder="TEMP,HUMI"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nguồn cấp</label>
            <Select<string>
              value={isSim ? 'true' : 'false'}
              onChange={(val) => setIsSim(val === 'true')}
              ariaLabel="Nguồn cấp thiết bị"
              buttonClassName="min-h-[40px] rounded-lg text-xs py-1.5"
              options={[
                { value: 'true', label: 'Giả lập (Simulator Engine)' },
                { value: 'false', label: 'Phần cứng thật (Kit PoC)' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Đang thêm...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách thiết bị */}
      {devices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          Phân khu này chưa có thiết bị nào. Hãy đăng ký thiết bị mới bằng biểu mẫu ở trên.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const isOnline = dev.status === 'ONLINE';
            const isActuator = dev.type === 'ACTUATOR';
            return (
              <button
                key={dev.id}
                type="button"
                onClick={() => openDeviceDetail(dev)}
                className="text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm transition active:scale-[0.99] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400">{dev.hardware_uid}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOnline
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {dev.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          dev.is_simulated
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {dev.is_simulated ? 'SIMULATOR' : 'HARDWARE POC'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mt-2.5">{dev.name}</h3>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">{dev.type}</span>
                    <span className="font-mono text-[10px] text-slate-400 truncate">
                      {dev.metrics.join(' / ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 shrink-0 inline-flex items-center gap-1">
                    {isActuator ? (
                      <>
                        <Power className="w-3 h-3" />
                        <span>Điều khiển →</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3 h-3" />
                        <span>Xem biểu đồ →</span>
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal Chi tiết Thiết bị */}
      {selectedDevice && (
        <div
          onClick={() => setSelectedDevice(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết ${selectedDevice.name}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {selectedDevice.hardware_uid}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    {selectedDevice.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedDevice.status === 'ONLINE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {selectedDevice.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedDevice.name}</h3>
              </div>

              <Tooltip title="Đóng cửa sổ" description="Đóng hộp thoại chi tiết thiết bị." placement="left">
                <button
                  type="button"
                  onClick={() => setSelectedDevice(null)}
                  aria-label="Đóng chi tiết thiết bị"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Đang tải dữ liệu thiết bị...</div>
            ) : selectedDevice.type === 'SENSOR' ? (
              <div className="space-y-4">
                {/* Metric switcher */}
                {selectedDevice.metrics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDevice.metrics.map((m) => {
                      const meta = METRIC_META[m as MetricKey];
                      const active = selectedMetric === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => loadSensorMetricHistory(selectedDevice.zone_id, m)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            active
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {meta ? `${meta.shortLabel} (${meta.unit})` : m}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Latest reading */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-slate-400">
                      {currentMeta?.title || selectedMetric} mới nhất
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-100 mt-0.5">
                      {currentReading ? `${currentReading.value} ${currentReading.unit}` : 'Chưa có số đo'}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {getPlainMetricHint(
                        selectedMetric as MetricKey,
                        currentReading?.value,
                        currentReading?.status
                      )}
                    </div>
                  </div>

                  {currentStatusMeta && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStatusMeta.badgeCls}`}
                    >
                      <currentStatusMeta.Icon className="w-4 h-4" />
                      <span>{currentStatusMeta.label}</span>
                    </span>
                  )}
                </div>

                {/* History Chart */}
                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3">
                  {historyPoints.length > 0 ? (
                    <ReactECharts option={chartOption} style={{ height: 240 }} />
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      Chưa có chuỗi dữ liệu lịch sử cho thông số {selectedMetric}.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {actuatorInfo ? (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-xs text-slate-400">Trạng thái hiện tại</div>
                        <div
                          className={`text-lg font-bold mt-0.5 ${
                            actuatorInfo.state === 'ON' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {actuatorInfo.state === 'ON' ? 'ĐANG BẬT (ON)' : 'ĐANG TẮT (OFF)'}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                        Chế độ: {actuatorInfo.mode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Tác động gần nhất: {actuatorInfo.last_action_at.slice(0, 19).replace('T', ' ')}
                    </div>

                    <button
                      type="button"
                      disabled={controlling}
                      onClick={handleControlActuator}
                      className={`w-full min-h-[48px] px-5 py-3 rounded-xl text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                        actuatorInfo.state === 'ON'
                          ? 'bg-rose-600 hover:bg-rose-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>
                        {controlling
                          ? 'Đang gửi lệnh...'
                          : actuatorInfo.state === 'ON'
                          ? 'TẮT THIẾT BỊ NGAY'
                          : 'BẬT THIẾT BỊ NGAY'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-400">
                    Thiết bị chấp hành này chưa có trạng thái đồng bộ từ Gateway.
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice(null);
                      setActiveScreen('SCR-03');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition"
                  >
                    Mở Điều khiển chi tiết (SCR-03) →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
