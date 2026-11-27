import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { ActuatorItem } from '../../types';
import { Power, Clock, CheckCircle2, CircleSlash } from 'lucide-react';
import { toast } from 'sonner';

export const DeviceControlScreen: React.FC = () => {
  const { activeZoneId } = useFarmStore();
  const [actuators, setActuators] = useState<ActuatorItem[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const loadingIdRef = useRef<number | null>(null);

  const fetchActuators = useCallback(async (silent = false) => {
    if (!activeZoneId) return;
    try {
      const res = await apiFetch<{ data: ActuatorItem[] }>(`/zones/${activeZoneId}/actuators`);
      setActuators(res.data);
    } catch (err: any) {
      if (!silent) {
        toast.error(err.message || 'Lỗi tải danh sách thiết bị');
      }
    }
  }, [activeZoneId]);

  useEffect(() => {
    fetchActuators(false);
    const timer = window.setInterval(() => {
      if (loadingIdRef.current === null) {
        fetchActuators(true);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [fetchActuators]);

  const toggleDevice = async (device: ActuatorItem) => {
    const nextAction = device.state === 'ON' ? 'OFF' : 'ON';
    loadingIdRef.current = device.device_id;
    setLoadingId(device.device_id);
    try {
      await apiFetch(`/devices/${device.device_id}/control`, {
        method: 'POST',
        body: JSON.stringify({ action: nextAction }),
      });
      toast.success(`Đã chuyển ${device.name} sang trạng thái ${nextAction}`);
      await fetchActuators(false);
    } catch (err: any) {
      toast.error(err.message || 'Không thể điều khiển thiết bị');
    } finally {
      loadingIdRef.current = null;
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>Điều khiển Thiết bị Chấp hành</span>
          <span className="text-xs px-2 py-0.5 font-mono bg-slate-800 text-slate-400 rounded-md border border-slate-700">
            ACK &lt; 2s
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Can thiệp thủ công tức thời (Bơm tưới, Van điện từ, Đèn xua côn trùng) kèm ghi nhận Audit Log
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {actuators.map((dev) => {
          const isOn = dev.state === 'ON';
          const isLoading = loadingId === dev.device_id;

          return (
            <div
              key={dev.device_id}
              className={`bg-slate-900 rounded-2xl p-5 transition flex flex-col justify-between ${
                isOn ? 'border-2 border-emerald-500/50 shadow-lg' : 'border border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500">{dev.device_code}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isOn
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isOn ? <CheckCircle2 className="w-3 h-3" /> : <CircleSlash className="w-3 h-3" />}
                      <span>{isOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        dev.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          dev.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {dev.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 mt-2.5">{dev.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 bg-slate-800 rounded font-medium text-[11px] text-slate-300">
                    Chế độ: {dev.mode === 'AUTO' ? 'Tự động' : 'Thủ công'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">Loại: {dev.metric}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{dev.last_action_at ? dev.last_action_at.slice(11, 19) : 'Chưa có'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDevice(dev)}
                  disabled={isLoading}
                  className={`min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition shadow-sm active:scale-[0.98] ${
                    isOn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Power className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Đang gửi...' : isOn ? 'TẮT THIẾT BỊ' : 'BẬT THIẾT BỊ'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
