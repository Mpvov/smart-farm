import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Layers,
  MapPin,
  RefreshCw,
  Sprout,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { METRICS_ORDER, METRIC_META } from '../../config/dashboard';
import { DashboardSummary, Farm, MetricReading, Zone, ZoneLatestTelemetry } from '../../types';
import { ZoneDetailView } from './dashboard/ZoneDetailView';

type ViewLevel = 'farms' | 'zones' | 'zone-detail';

function getZoneWorstStatus(telemetry?: ZoneLatestTelemetry): MetricReading['status'] {
  if (!telemetry?.metrics) return 'NORMAL';
  const statuses = Object.values(telemetry.metrics).map((m) => m.status);
  if (statuses.includes('CRITICAL')) return 'CRITICAL';
  if (statuses.includes('WARNING')) return 'WARNING';
  return 'NORMAL';
}

function getStatusBadge(status: MetricReading['status']) {
  if (status === 'CRITICAL') {
    return {
      text: 'Nguy hiểm',
      cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    };
  }
  if (status === 'WARNING') {
    return {
      text: 'Cảnh báo',
      cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    };
  }
  return {
    text: 'An toàn',
    cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  };
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

  // Level 1: Single Farm -> Zones Grid
  if (viewLevel === 'zones' && currentFarm) {
    const summary = farmSummaries[currentFarm.id];
    const isDefault = defaultFarmId === currentFarm.id;
    const totalAlerts = summary?.active_alerts_count ?? 0;

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {farms.length > 1 && (
              <button
                type="button"
                onClick={() => setViewLevel('farms')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
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

          <div className="flex items-center gap-2">
            {farms.length > 1 && (
              <button
                type="button"
                onClick={(e) => handleToggleDefaultFarm(e, currentFarm)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  isDefault
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isDefault ? 'Đã đặt mặc định' : 'Đặt làm mặc định'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadFarmZones(currentFarm.id)}
              disabled={loadingZones}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingZones ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Farm Profile & KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-medium text-slate-400">Tổng Phân khu (Zones)</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {summary?.total_zones ?? zones.length}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">Chuyên canh từng loại cây</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-medium text-slate-400">Thiết bị Kết nối</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {summary?.devices_online ?? 0} / {summary?.total_devices ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Cảm biến &amp; chấp hành Online</div>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('SCR-05')}
            className="text-left bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-xl p-4 transition"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Cảnh báo Cần xử lý</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                totalAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {totalAlerts}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {totalAlerts > 0 ? 'Bấm để mở Trung tâm cảnh báo' : 'Toàn bộ ngưỡng an toàn'}
            </div>
          </button>
        </div>

        {/* Zones Glanceable Grid */}
        {zones.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">
              Nông trại chưa có phân khu canh tác nào
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveScreen('SCR-09')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <span>Tạo phân khu mới</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {zones.map((z) => {
              const tel = zoneTelemetries[z.id];
              const worstStatus = getZoneWorstStatus(tel);
              const badge = getStatusBadge(worstStatus);

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
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate">{z.name}</h3>
                      <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                        <Sprout className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{z.crop_type}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Mini 2x2 Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {METRICS_ORDER.map((key) => {
                      const { shortLabel, unit, Icon } = METRIC_META[key];
                      const reading = tel?.metrics?.[key];
                      const statusCls =
                        reading?.status === 'CRITICAL'
                          ? 'border-rose-500/40 text-rose-300'
                          : reading?.status === 'WARNING'
                          ? 'border-amber-500/40 text-amber-300'
                          : 'border-slate-800 text-slate-100';

                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl bg-slate-800/50 border ${statusCls}`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{shortLabel}</span>
                            <Icon className="w-3 h-3 text-slate-400" />
                          </div>
                          <div className="mt-1 font-mono text-sm font-bold">
                            {reading ? `${reading.value} ${reading.unit || unit}` : '--'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {z.area_m2} m² · {z.device_count ?? 0} thiết bị
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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

  // Level 0: All Farms Portfolio
  const totalSystemAlerts = Object.values(farmSummaries).reduce(
    (sum, s) => sum + (s.active_alerts_count ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Tổng quan hệ thống nông trại</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {farms.length} nông trại đang quản lý ·{' '}
            <span className={totalSystemAlerts > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
              {totalSystemAlerts} cảnh báo chưa xử lý
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadFarms}
          disabled={loadingFarms}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingFarms ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {farms.length === 0 && !loadingFarms ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-200">Chưa có nông trại nào trong hệ thống</div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveScreen('SCR-09')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <span>Thiết lập nông trại</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {farms.map((farm) => {
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
                className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between gap-4 ${
                  isDefault
                    ? 'border-amber-500/40 hover:border-amber-400/60'
                    : 'border-slate-800 hover:border-emerald-500/40'
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

                  <button
                    type="button"
                    onClick={(e) => handleToggleDefaultFarm(e, farm)}
                    title={isDefault ? 'Bỏ ghim mặc định' : 'Đặt làm nông trại mặc định'}
                    aria-label={isDefault ? 'Bỏ ghim mặc định' : 'Đặt làm nông trại mặc định'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition shrink-0"
                  >
                    <Star className={`w-4 h-4 ${isDefault ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Phân khu</div>
                    <div className="text-base font-bold text-slate-100 mt-0.5">
                      {summary?.total_zones ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Online</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {summary?.devices_online ?? 0}/{summary?.total_devices ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cảnh báo</div>
                    <div
                      className={`text-base font-bold mt-0.5 flex items-center justify-center gap-1 ${
                        alertsCount > 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {alertsCount > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{alertsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Xem phân khu &amp; số liệu</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span>Mở Farm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
