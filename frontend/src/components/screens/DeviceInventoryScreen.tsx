import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Device } from '../../types';
import { Cpu, Plus, Wifi, Radio } from 'lucide-react';
import { toast } from 'sonner';

export const DeviceInventoryScreen: React.FC = () => {
  const { activeZoneId } = useFarmStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'SENSOR' | 'ACTUATOR'>('SENSOR');
  const [metricsStr, setMetricsStr] = useState('TEMP,HUMI');
  const [isSim, setIsSim] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await apiFetch<{ data: Device[] }>(`/devices?zone_id=${activeZoneId}`);
      setDevices(res.data);
    } catch (err: any) {
      toast.error('Lỗi tải danh mục thiết bị');
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [activeZoneId]);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const metrics = metricsStr.split(',').map((m) => m.trim().toUpperCase());
      await apiFetch('/devices', {
        method: 'POST',
        body: JSON.stringify({
          hardware_uid: uid,
          name,
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>Quản lý Danh mục Thiết bị Nông trại (Dynamic 1..N)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Gán/gỡ thiết bị động vào từng Zone, hỗ trợ phân loại thiết bị phần cứng thật (PoC) và thiết bị giả lập (Simulator)
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              placeholder="Cảm biến độ ẩm phụ"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Phân loại</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="SENSOR">Cảm biến (Input)</option>
              <option value="ACTUATOR">Chấp hành (Output)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Metrics (cách bởi dấu phẩy)</label>
            <input
              type="text"
              required
              value={metricsStr}
              onChange={(e) => setMetricsStr(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              placeholder="TEMP,HUMI"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nguồn cấp</label>
            <select
              value={isSim ? 'true' : 'false'}
              onChange={(e) => setIsSim(e.target.value === 'true')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="true">Giả lập (Simulator Engine)</option>
              <option value="false">Phần cứng thật (Kit PoC)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Đang thêm...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách thiết bị */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((dev) => (
          <div key={dev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">{dev.hardware_uid}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  dev.is_simulated
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {dev.is_simulated ? 'SIMULATOR' : 'HARDWARE POC'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-100 mt-2">{dev.name}</h3>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span className="font-mono text-[11px] text-emerald-400">{dev.type}</span>
              <span className="font-mono text-[10px] text-slate-500">{dev.metrics.join(' / ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
