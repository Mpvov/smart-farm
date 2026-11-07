import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Threshold, Schedule } from '../../types';
import { Sliders, Calendar, Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const ThresholdScheduleScreen: React.FC = () => {
  const { activeZoneId } = useFarmStore();
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [saving, setSaving] = useState(false);

  // New schedule form state
  const [newDevId, setNewDevId] = useState<number>(4);
  const [newTime, setNewTime] = useState('07:00');
  const [newDuration, setNewDuration] = useState<number>(15);

  const loadData = async () => {
    if (!activeZoneId) return;
    try {
      const thRes = await apiFetch<{ data: Threshold[] }>(`/zones/${activeZoneId}/thresholds`);
      setThresholds(thRes.data);

      const scRes = await apiFetch<{ data: Schedule[] }>(`/zones/${activeZoneId}/schedules`);
      setSchedules(scRes.data);
    } catch (err: any) {
      toast.error('Lỗi tải cấu hình');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeZoneId]);

  const handleThresholdChange = (index: number, field: keyof Threshold, value: number) => {
    setThresholds((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleApplyThresholds = async () => {
    setSaving(true);
    try {
      await apiFetch(`/zones/${activeZoneId}/thresholds`, {
        method: 'PUT',
        body: JSON.stringify({ thresholds }),
      });
      toast.success('Đã đồng bộ ngưỡng an toàn mới xuống thiết bị (Realtime Sync)');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi áp dụng cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/zones/${activeZoneId}/schedules`, {
        method: 'POST',
        body: JSON.stringify({
          device_id: Number(newDevId),
          start_time: newTime,
          duration_minutes: Number(newDuration),
          days_of_week: [1, 2, 3, 4, 5, 6, 7],
          is_active: true,
        }),
      });
      toast.success('Thêm lịch trình thành công');
      loadData();
    } catch (err: any) {
      toast.error('Lỗi tạo lịch');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await apiFetch(`/schedules/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa lịch trình');
      loadData();
    } catch (err: any) {
      toast.error('Lỗi xóa lịch');
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Ngưỡng cảnh báo đa cấp */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Cấu hình Dải Ngưỡng An toàn & Tự động hóa</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thiết lập trực tiếp trên Dashboard và đồng bộ tức thì thời gian thực (Realtime Sync) khi Apply
            </p>
          </div>

          <button
            onClick={handleApplyThresholds}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-950"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Đang đồng bộ...' : 'ÁP DỤNG CẤU HÌNH (APPLY)'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Thông số</th>
                <th className="py-2.5 px-3">Nguy hiểm Min</th>
                <th className="py-2.5 px-3">Cảnh báo Min</th>
                <th className="py-2.5 px-3">Cảnh báo Max</th>
                <th className="py-2.5 px-3">Nguy hiểm Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {thresholds.map((th, idx) => (
                <tr key={th.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-3 font-bold text-emerald-400">{th.metric}</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={th.danger_min}
                      onChange={(e) => handleThresholdChange(idx, 'danger_min', parseFloat(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={th.warning_min}
                      onChange={(e) => handleThresholdChange(idx, 'warning_min', parseFloat(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={th.warning_max}
                      onChange={(e) => handleThresholdChange(idx, 'warning_max', parseFloat(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={th.danger_max}
                      onChange={(e) => handleThresholdChange(idx, 'danger_max', parseFloat(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Lập lịch trình tự động */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span>Lịch trình Vận hành Định kỳ (Tưới tiêu / Chiếu sáng)</span>
        </h2>

        {/* Form thêm lịch mới */}
        <form onSubmit={handleAddSchedule} className="flex flex-wrap items-end gap-3 p-4 bg-slate-800/40 border border-slate-800 rounded-xl mb-6">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Mã thiết bị</label>
            <input
              type="number"
              value={newDevId}
              onChange={(e) => setNewDevId(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-24"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Giờ bắt đầu</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Thời lượng (phút)</label>
            <input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-28"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lịch</span>
          </button>
        </form>

        {/* Danh sách lịch */}
        <div className="space-y-2">
          {schedules.map((sc) => (
            <div
              key={sc.id}
              className="flex items-center justify-between p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl text-xs"
            >
              <div>
                <span className="font-bold text-slate-200">{sc.device_name || `Thiết bị #${sc.device_id}`}</span>
                <span className="text-slate-400 ml-2">
                  lúc <strong className="text-emerald-400 font-mono">{sc.start_time}</strong> ({sc.duration_minutes} phút)
                </span>
                <span className="ml-3 text-[10px] text-slate-500">Mỗi ngày trong tuần</span>
              </div>
              <button
                onClick={() => handleDeleteSchedule(sc.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                title="Xóa lịch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
