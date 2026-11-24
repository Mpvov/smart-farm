import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Zone, Farm } from '../../types';
import { Sprout, Plus, MapPin, Cpu, Activity, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from '../ui/Tooltip';

export const FarmZoneScreen: React.FC = () => {
  const { activeFarmId, setActiveFarmId, setActiveZoneId, setActiveScreen } = useFarmStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);

  // New farm form
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState<number>(2000);
  const [creatingFarm, setCreatingFarm] = useState(false);

  // New zone form
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [areaM2, setAreaM2] = useState<number>(500);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const fRes = await apiFetch<{ data: Farm[] }>('/farms');
      setFarms(fRes.data);
      const targetFarmId = activeFarmId || fRes.data[0]?.id;
      if (targetFarmId) {
        const zRes = await apiFetch<{ data: Zone[] }>(`/farms/${targetFarmId}/zones`);
        setZones(zRes.data);
      }
    } catch {
      toast.error('Lỗi tải dữ liệu nông trại');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarmId]);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingFarm(true);
    try {
      const res = await apiFetch<{ data: { id: number } }>('/farms', {
        method: 'POST',
        body: JSON.stringify({
          name: farmName.trim(),
          location: farmLocation.trim(),
          total_area: Number(farmArea),
        }),
      });
      toast.success('Đã tạo nông trại mới');
      setFarmName('');
      setFarmLocation('');
      setFarmArea(2000);
      setShowFarmForm(false);
      if (res.data?.id) {
        setActiveFarmId(res.data.id);
      } else {
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo nông trại');
    } finally {
      setCreatingFarm(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/farms/${activeFarmId}/zones`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          crop_type: cropType.trim(),
          area_m2: Number(areaM2),
          description: desc.trim(),
        }),
      });
      toast.success('Đã tạo phân khu canh tác mới');
      setName('');
      setCropType('');
      setDesc('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo khu vực');
    } finally {
      setLoading(false);
    }
  };

  const activeFarm = farms.find((f) => f.id === activeFarmId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span>Quản trị Nông trại & Phân khu Canh tác (Zones)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu trúc phân cấp Farm → Zone → Cây trồng chuyên canh (1 Crop/Zone)
          </p>
        </div>

        <Tooltip
          title="Thêm Nông trại mới"
          description="Mở biểu mẫu tạo thêm trang trại mới trong hệ thống."
        >
          <button
            type="button"
            onClick={() => setShowFarmForm((prev) => !prev)}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{showFarmForm ? 'Đóng biểu mẫu Farm' : 'Thêm Nông trại'}</span>
          </button>
        </Tooltip>
      </div>

      {/* Form thêm Farm (collapsible) */}
      {showFarmForm && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Tạo Nông trại Mới</span>
          </h3>
          <form onSubmit={handleCreateFarm} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tên nông trại</label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                placeholder="Trang trại Mộc Châu"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Địa điểm</label>
              <input
                type="text"
                required
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                placeholder="Sơn La"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tổng diện tích (m²)</label>
              <input
                type="number"
                required
                min={1}
                value={farmArea}
                onChange={(e) => setFarmArea(Number(e.target.value))}
                className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingFarm}
                className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
              >
                {creatingFarm ? 'Đang tạo...' : 'Lưu Nông trại'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách Farms */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Danh sách Nông trại ({farms.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((f) => {
            const isSelected = f.id === activeFarmId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFarmId(f.id)}
                className={`text-left bg-slate-900 rounded-2xl p-5 transition border ${
                  isSelected
                    ? 'border-2 border-emerald-500/50 shadow-sm'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">Farm #{f.id}</span>
                  {isSelected && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Đang chọn
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-2">{f.name}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{f.location}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Diện tích: <strong className="text-slate-200 font-mono">{f.total_area} m²</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form thêm zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>
            Thêm Phân khu vào {activeFarm ? activeFarm.name : `Farm #${activeFarmId}`}
          </span>
        </h3>

        <form onSubmit={handleCreateZone} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tên Phân khu (Zone)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Khu E - Cà rốt"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Cây trồng chuyên canh</label>
            <input
              type="text"
              required
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Cà rốt F1"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Diện tích (m²)</label>
            <input
              type="number"
              required
              min={1}
              value={areaM2}
              onChange={(e) => setAreaM2(Number(e.target.value))}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mô tả đặc điểm</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Đất thịt nhẹ..."
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Đang tạo...' : 'Tạo Phân khu'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid danh sách các Zone */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Phân khu thuộc: {activeFarm ? activeFarm.name : `Farm #${activeFarmId}`} ({zones.length})
        </div>
        {zones.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
            Nông trại này chưa có phân khu nào. Tạo phân khu mới ở biểu mẫu bên trên.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((z) => (
              <div
                key={z.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold">Zone #{z.id}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">
                      {z.device_count || 0} Thiết bị
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-2">{z.name}</h3>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div>
                      Cây trồng: <strong className="text-slate-200">{z.crop_type}</strong>
                    </div>
                    <div>
                      Diện tích: <strong className="text-slate-200 font-mono">{z.area_m2} m²</strong>
                    </div>
                    {z.description && <div className="text-[11px] text-slate-500">{z.description}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <Tooltip
                    title="Mở Giám sát Phân khu"
                    description="Chuyển tới màn Tổng quan để xem số liệu cảm biến và biểu đồ của phân khu này."
                    className="w-full"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveZoneId(z.id);
                        setActiveScreen('SCR-02');
                      }}
                      className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Giám sát</span>
                    </button>
                  </Tooltip>

                  <Tooltip
                    title="Quản lý Thiết bị Phân khu"
                    description="Mở Danh mục Thiết bị đã lọc theo phân khu này để xem trạng thái hoặc gán cảm biến, máy bơm."
                    className="w-full"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveZoneId(z.id);
                        setActiveScreen('SCR-10');
                      }}
                      className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                    >
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Thiết bị</span>
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
