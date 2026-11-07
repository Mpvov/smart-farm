import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Zone, Farm } from '../../types';
import { Sprout, Layers, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const FarmZoneScreen: React.FC = () => {
  const { activeFarmId } = useFarmStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [areaM2, setAreaM2] = useState<number>(500);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const fRes = await apiFetch<{ data: Farm[] }>('/farms');
      setFarms(fRes.data);
      if (activeFarmId) {
        const zRes = await apiFetch<{ data: Zone[] }>(`/farms/${activeFarmId}/zones`);
        setZones(zRes.data);
      }
    } catch (err: any) {
      toast.error('Lỗi tải dữ liệu nông trại');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarmId]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/farms/${activeFarmId}/zones`, {
        method: 'POST',
        body: JSON.stringify({ name, crop_type: cropType, area_m2: Number(areaM2), description: desc }),
      });
      toast.success('Đã tạo phân khu canh tác mới');
      setName('');
      setCropType('');
      setDesc('');
      loadData();
    } catch (err: any) {
      toast.error('Lỗi tạo khu vực');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-400" />
          <span>Quản trị Nông trại & Phân khu Canh tác (Zones)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Cấu trúc phân cấp Farm $\rightarrow$ Zone $\rightarrow$ Cây trồng chuyên canh (1 Crop/Zone)
        </p>
      </div>

      {/* Form thêm zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Thêm Phân khu Canh tác Mới</span>
        </h3>

        <form onSubmit={handleCreateZone} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Tên Phân khu (Zone)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Cà rốt F1"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Diện tích (m²)</label>
            <input
              type="number"
              required
              value={areaM2}
              onChange={(e) => setAreaM2(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mô tả đặc điểm</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Đất thịt nhẹ..."
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Đang tạo...' : 'Tạo Phân khu'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid danh sách các Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((z) => (
          <div key={z.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-bold">Zone #{z.id}</span>
              <span className="text-[11px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                {z.device_count || 0} Thiết bị
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-2">{z.name}</h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <div>Cây trồng: <strong className="text-slate-200">{z.crop_type}</strong></div>
              <div>Diện tích: <strong className="text-slate-200">{z.area_m2} m²</strong></div>
              {z.description && <div className="text-[11px] text-slate-500">{z.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
