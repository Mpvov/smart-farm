import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  OctagonAlert,
  RefreshCw,
  Sprout,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import {
  METRICS_ORDER,
  METRIC_META,
  STATUS_META,
  STATUS_PRIORITY,
  getPlainMetricHint,
  getZoneWorstStatus,
} from '../../config/dashboard';
import { DashboardSummary, Farm, Zone, ZoneLatestTelemetry } from '../../types';
import { ZoneDetailView } from './dashboard/ZoneDetailView';
import { Tooltip } from '../ui/Tooltip';

type ViewLevel = 'farms' | 'zones' | 'zone-detail';
type ZoneViewMode = 'list' | 'map';

function getPrimaryZoneIssueText(tel?: ZoneLatestTelemetry): string {
  if (!tel?.metrics) return 'Đang chờ số liệu';
  for (const target of ['CRITICAL', 'WARNING'] as const) {
    for (const key of METRICS_ORDER) {
      const m = tel.metrics[key];
      if (m && m.status === target) {
        return `${getPlainMetricHint(key, m.value, m.status)} (${m.value}${m.unit})`;
      }
    }
  }
  return 'Mọi chỉ số ổn định';
}

export const DashboardScreen: React.FC = () => {
  const {
    user,
    activeFarmId,
    activeZoneId,
    defaultFarmId,
    setActiveFarmId,
    setActiveZoneId,
    setDefaultFarmId,
    setActiveScreen,
    setUnreadAlertsCount,
  } = useFarmStore();

  const isAdmin = user?.role === 'ADMIN';
  const [viewLevel, setViewLevel] = useState<ViewLevel>('farms');
  const [zoneViewMode, setZoneViewMode] = useState<ZoneViewMode>('list');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmSummaries, setFarmSummaries] = useState<Record<number, DashboardSummary>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneTelemetries, setZoneTelemetries] = useState<Record<number, ZoneLatestTelemetry>>({});
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const initializedRef = useRef(false);

  const loadFarms = async () => {
    setLoadingFarms(true);
    try {
      const res = await apiFetch<{ data: Farm[] }>('/farms');
      const farmList = res.data;
      setFarms(farmList);

      const summaryResults = await Promise.all(
        farmList.map((f) =>
          apiFetch<{ data: DashboardSummary }>(`/dashboard/summary?farm_id=${f.id}`)
            .then((r) => [f.id, r.data] as const)
            .catch(() => null)
        )
      );

      const nextSummaries: Record<number, DashboardSummary> = {};
      for (const entry of summaryResults) {
        if (entry) nextSummaries[entry[0]] = entry[1];
      }
      setFarmSummaries(nextSummaries);

      if (!initializedRef.current) {
        initializedRef.current = true;
        if (farmList.length === 1) {
          setActiveFarmId(farmList[0].id);
          setViewLevel('zones');
        } else if (defaultFarmId !== null && farmList.some((f) => f.id === defaultFarmId)) {
          setActiveFarmId(defaultFarmId);
          setViewLevel('zones');
        } else {
          setViewLevel('farms');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFarms(false);
    }
  };

  const loadFarmZones = async (farmId: number) => {
    setLoadingZones(true);
    try {
      const [zRes, sRes] = await Promise.all([
        apiFetch<{ data: Zone[] }>(`/farms/${farmId}/zones`),
        apiFetch<{ data: DashboardSummary }>(`/dashboard/summary?farm_id=${farmId}`).catch(() => null),
      ]);

      const zoneList = zRes.data;
      setZones(zoneList);

      if (sRes) {
        setFarmSummaries((prev) => ({ ...prev, [farmId]: sRes.data }));
        setUnreadAlertsCount(sRes.data.active_alerts_count ?? 0);
      }

      const telResults = await Promise.all(
        zoneList.map((z) =>
          apiFetch<{ data: ZoneLatestTelemetry }>(`/zones/${z.id}/telemetry/latest`)
            .then((r) => [z.id, r.data] as const)
            .catch(() => null)
        )
      );

      const nextTel: Record<number, ZoneLatestTelemetry> = {};
      for (const entry of telResults) {
        if (entry) nextTel[entry[0]] = entry[1];
      }
      setZoneTelemetries(nextTel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if ((viewLevel === 'zones' || viewLevel === 'zone-detail') && activeFarmId) {
      loadFarmZones(activeFarmId);
    }
  }, [viewLevel, activeFarmId]);

  const handleToggleDefaultFarm = (e: React.MouseEvent, farm: Farm) => {
    e.stopPropagation();
    const isCurrentDefault = defaultFarmId === farm.id;
    setDefaultFarmId(isCurrentDefault ? null : farm.id);
    toast.success(
      isCurrentDefault
        ? `Đã bỏ ghim mặc định ${farm.name}`
        : `Đã đặt ${farm.name} làm nông trại mặc định`
    );
  };

  const currentFarm = farms.find((f) => f.id === activeFarmId) ?? farms[0];
  const currentZone = zones.find((z) => z.id === activeZoneId);

  // Level 2: Zone Detail (full-frame drill-down)
  if (viewLevel === 'zone-detail' && currentFarm && currentZone) {
    return (
      <ZoneDetailView
        farm={currentFarm}
        zone={currentZone}
        hasMultipleFarms={farms.length > 1}
        onBackToFarms={() => setViewLevel('farms')}
        onBackToZones={() => setViewLevel('zones')}
      />
    );
  }

  // Level 1: Single Farm -> Zones Grid / Schematic Lot Map
  if (viewLevel === 'zones' && currentFarm) {
    const summary = farmSummaries[currentFarm.id];
    const isDefault = defaultFarmId === currentFarm.id;
    const totalAlerts = summary?.active_alerts_count ?? 0;

    // 3-second scan: place CRITICAL -> WARNING -> NORMAL zones at top-left first
    const sortedZones = [...zones].sort((a, b) => {
      const sa = STATUS_PRIORITY[getZoneWorstStatus(zoneTelemetries[a.id])];
      const sb = STATUS_PRIORITY[getZoneWorstStatus(zoneTelemetries[b.id])];
      return sa !== sb ? sa - sb : a.id - b.id;
    });

    const criticalZonesCount = sortedZones.filter(
      (z) => getZoneWorstStatus(zoneTelemetries[z.id]) === 'CRITICAL'
    ).length;
    const warningZonesCount = sortedZones.filter(
      (z) => getZoneWorstStatus(zoneTelemetries[z.id]) === 'WARNING'
    ).length;

    return (
      <div className="space-y-5">
        {/* 3-Second Glance Status Banner (Top-Left Golden Point) */}
        <div
          className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            criticalZonesCount > 0 || totalAlerts > 0
              ? 'bg-rose-500/15 border-2 border-rose-500/40'
              : warningZonesCount > 0
              ? 'bg-amber-500/15 border-2 border-amber-500/40'
              : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {criticalZonesCount > 0 || totalAlerts > 0 ? (
              <OctagonAlert className="w-6 h-6 text-rose-400 shrink-0" />
            ) : warningZonesCount > 0 ? (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold text-slate-100">
                {criticalZonesCount > 0
                  ? `${criticalZonesCount} phân khu đang ở mức nguy hiểm — kiểm tra ngay`
                  : warningZonesCount > 0
                  ? `${warningZonesCount} phân khu cần chú ý`
                  : 'Tất cả phân khu đều an toàn'}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {currentFarm.name} · {summary?.devices_online ?? 0}/{summary?.total_devices ?? 0} thiết bị Online ·{' '}
                {totalAlerts} cảnh báo chờ xử lý
              </div>
            </div>
          </div>

          {totalAlerts > 0 && (
            <button
              type="button"
              onClick={() => setActiveScreen('SCR-05')}
              className="min-h-[48px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
            >
              <span>Xem {totalAlerts} cảnh báo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {farms.length > 1 && (
              <button
                type="button"
                onClick={() => setViewLevel('farms')}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tất cả Farm</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{currentFarm.name}</h2>
                {isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentFarm.location} · {currentFarm.total_area} m²
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* List vs Schematic Lot Map Toggle */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <Tooltip
                title="Chế độ Danh sách"
                description="Xem chi tiết 4 chỉ số cảm biến trên từng thẻ phân khu."
              >
                <button
                  type="button"
                  onClick={() => setZoneViewMode('list')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                    zoneViewMode === 'list'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Danh sách</span>
                </button>
              </Tooltip>
              <Tooltip
                title="Chế độ Sơ đồ lô"
                description="Xem bố cục các khu theo tỷ lệ diện tích để định vị sự cố trong 1 lần liếc mắt."
              >
                <button
                  type="button"
                  onClick={() => setZoneViewMode('map')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                    zoneViewMode === 'map'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Sơ đồ lô</span>
                </button>
              </Tooltip>
            </div>

            {farms.length > 1 && (
              <Tooltip
                title={isDefault ? 'Đang là nông trại mặc định' : 'Ghim làm nông trại mặc định'}
                description={
                  isDefault
                    ? 'Bấm để bỏ ghim — lần sau mở Tổng quan sẽ hiện toàn bộ danh sách nông trại.'
                    : 'Lần sau mở Tổng quan sẽ vào thẳng các phân khu của nông trại này, bỏ qua bước chọn lại.'
                }
              >
                <button
                  type="button"
                  onClick={(e) => handleToggleDefaultFarm(e, currentFarm)}
                  className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition active:scale-[0.98] ${
                    isDefault
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isDefault ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{isDefault ? 'Mặc định' : 'Ghim mặc định'}</span>
                </button>
              </Tooltip>
            )}

            <button
              type="button"
              onClick={() => loadFarmZones(currentFarm.id)}
              disabled={loadingZones}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${loadingZones ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Zones Display: Schematic Lot Map OR Glanceable Cards */}
        {sortedZones.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">
              Nông trại chưa có phân khu canh tác nào
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveScreen('SCR-09')}
                className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                <span>Tạo phân khu mới</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : zoneViewMode === 'map' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Sơ đồ phân khu theo tỷ lệ diện tích (ưu tiên lô sự cố lên góc trên-trái)
              </span>
              <span className="hidden sm:inline">Chạm vào lô để xem chi tiết</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {sortedZones.map((z) => {
                const tel = zoneTelemetries[z.id];
                const worstStatus = getZoneWorstStatus(tel);
                const stMeta = STATUS_META[worstStatus];
                const StatusIcon = stMeta.Icon;
                const flexGrow = Math.max(1, Math.round(z.area_m2 / 500));

                return (
                  <button
                    key={z.id}
                    type="button"
                    style={{ flex: `${flexGrow} 1 220px` }}
                    onClick={() => {
                      setActiveZoneId(z.id);
                      setViewLevel('zone-detail');
                    }}
                    className={`min-h-[144px] text-left rounded-2xl p-4 transition active:scale-[0.98] flex flex-col justify-between ${stMeta.mapCls}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-100 truncate">{z.name}</div>
                        <div className="text-xs text-emerald-400 font-medium mt-0.5 truncate">
                          {z.crop_type}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${stMeta.badgeCls}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{stMeta.label}</span>
                      </span>
                    </div>

                    <div className="mt-3 text-xs font-semibold text-slate-200">
                      {getPrimaryZoneIssueText(tel)}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{z.area_m2} m²</span>
                      <span>{z.device_count ?? 0} thiết bị →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedZones.map((z) => {
              const tel = zoneTelemetries[z.id];
              const worstStatus = getZoneWorstStatus(tel);
              const stMeta = STATUS_META[worstStatus];
              const StatusIcon = stMeta.Icon;

              return (
                <div
                  key={z.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveZoneId(z.id);
                    setViewLevel('zone-detail');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveZoneId(z.id);
                      setViewLevel('zone-detail');
                    }
                  }}
                  className={`bg-slate-900 ${stMeta.cardCls} hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between gap-4 shadow-sm active:scale-[0.99]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-100 truncate">{z.name}</h3>
                      <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        <Sprout className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{z.crop_type}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${stMeta.badgeCls}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{stMeta.label}</span>
                    </span>
                  </div>

                  {/* Plain-language Status Line */}
                  <div className="text-xs font-semibold text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-800">
                    {getPrimaryZoneIssueText(tel)}
                  </div>

                  {/* Mini 2x2 Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {METRICS_ORDER.map((key) => {
                      const { shortLabel, unit, Icon } = METRIC_META[key];
                      const reading = tel?.metrics?.[key];
                      const statusCls =
                        reading?.status === 'CRITICAL'
                          ? 'border-2 border-rose-500/40 text-rose-300'
                          : reading?.status === 'WARNING'
                          ? 'border-2 border-amber-500/40 text-amber-300'
                          : 'border border-slate-800 text-slate-100';

                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl bg-slate-800/50 ${statusCls}`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{shortLabel}</span>
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="mt-1 font-mono text-base font-extrabold">
                            {reading ? `${reading.value} ${reading.unit || unit}` : '--'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {z.area_m2} m² · {z.device_count ?? 0} thiết bị
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>Chi tiết</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Level 0: All Farms Portfolio (sorted by alerts descending so issues sit top-left)
  const sortedFarms = [...farms].sort((a, b) => {
    const aa = farmSummaries[a.id]?.active_alerts_count ?? 0;
    const ab = farmSummaries[b.id]?.active_alerts_count ?? 0;
    return ab !== aa ? ab - aa : a.id - b.id;
  });

  const totalSystemAlerts = Object.values(farmSummaries).reduce(
    (sum, s) => sum + (s.active_alerts_count ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* System-wide 3-second Glance Banner */}
      <div
        className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          totalSystemAlerts > 0
            ? 'bg-rose-500/15 border-2 border-rose-500/40'
            : 'bg-emerald-500/10 border border-emerald-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {totalSystemAlerts > 0 ? (
            <OctagonAlert className="w-6 h-6 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          )}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {totalSystemAlerts > 0
                ? `Cần chú ý: ${totalSystemAlerts} cảnh báo chưa xử lý`
                : `Toàn bộ ${farms.length} nông trại đang ổn định`}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Ưu tiên nông trại có sự cố lên góc trên-trái · Chọn nông trại để xem từng khu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadFarms}
          disabled={loadingFarms}
          className="min-h-[44px] self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${loadingFarms ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {sortedFarms.length === 0 && !loadingFarms ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-200">Chưa có nông trại nào trong hệ thống</div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveScreen('SCR-09')}
              className="min-h-[48px] inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
            >
              <span>Thiết lập nông trại</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedFarms.map((farm) => {
            const summary = farmSummaries[farm.id];
            const isDefault = defaultFarmId === farm.id;
            const alertsCount = summary?.active_alerts_count ?? 0;

            return (
              <div
                key={farm.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveFarmId(farm.id);
                  setViewLevel('zones');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveFarmId(farm.id);
                    setViewLevel('zones');
                  }
                }}
                className={`bg-slate-900 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between gap-4 active:scale-[0.99] ${
                  alertsCount > 0
                    ? 'border-2 border-rose-500/40 hover:border-rose-400/60'
                    : isDefault
                    ? 'border-2 border-amber-500/40 hover:border-amber-400/60'
                    : 'border border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-100 truncate">{farm.name}</h3>
                      {isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {farm.location} · {farm.total_area} m²
                      </span>
                    </p>
                  </div>

                  <Tooltip
                    title={isDefault ? 'Đang là nông trại mặc định' : 'Ghim làm nông trại mặc định'}
                    description={
                      isDefault
                        ? 'Bấm để bỏ ghim — lần sau mở Tổng quan sẽ hiện toàn bộ danh sách nông trại.'
                        : 'Lần sau mở Tổng quan sẽ vào thẳng các phân khu của nông trại này, bỏ qua bước chọn lại.'
                    }
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleDefaultFarm(e, farm)}
                      aria-label={isDefault ? 'Bỏ ghim mặc định' : 'Đặt làm nông trại mặc định'}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition shrink-0"
                    >
                      <Star className={`w-5 h-5 ${isDefault ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Phân khu</div>
                    <div className="text-lg font-extrabold font-mono text-slate-100 mt-0.5">
                      {summary?.total_zones ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Online</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
                      {summary?.devices_online ?? 0}/{summary?.total_devices ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Cảnh báo</div>
                    <div
                      className={`text-lg font-extrabold font-mono mt-0.5 flex items-center justify-center gap-1 ${
                        alertsCount > 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {alertsCount > 0 && <OctagonAlert className="w-4 h-4" />}
                      <span>{alertsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Xem phân khu &amp; số liệu</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span>Mở Farm</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
