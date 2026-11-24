import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { ActuatorItem, Schedule, Threshold } from '../../types';
import { METRIC_META, MetricKey } from '../../config/dashboard';
import { Sliders, Calendar, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Select } from '../ui/Select';
import { Tooltip } from '../ui/Tooltip';

const DAYS_OF_WEEK = [
  { id: 1, label: 'T2' },
  { id: 2, label: 'T3' },
  { id: 3, label: 'T4' },
  { id: 4, label: 'T5' },
  { id: 5, label: 'T6' },
  { id: 6, label: 'T7' },
  { id: 7, label: 'CN' },
] as const;

const TRIGGER_OPTIONS = [
  { value: 'NONE', label: 'Chỉ cảnh báo' },
  { value: 'BELOW_DANGER_MIN', label: '< Nguy hiểm Min → Bật' },
  { value: 'ABOVE_DANGER_MAX', label: '> Nguy hiểm Max → Bật' },
] as const;

function formatDaysOfWeek(days: number[]): string {
  const valid = Array.from(new Set(days)).filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (valid.length === 7) return 'Hằng ngày';
  if (valid.length === 5 && valid.every((d, i) => d === i + 1)) return 'Thứ 2 – Thứ 6';
  if (valid.length === 0) return 'Chưa chọn ngày';
  return valid
    .map((d) => DAYS_OF_WEEK.find((item) => item.id === d)?.label ?? `T${d + 1}`)
    .join(', ');
}

export const ThresholdScheduleScreen: React.FC = () => {
  const { activeZoneId } = useFarmStore();
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [actuators, setActuators] = useState<ActuatorItem[]>([]);
  const [saving, setSaving] = useState(false);

  // New schedule form state
  const [newDevId, setNewDevId] = useState<number>(0);
  const [newTime, setNewTime] = useState('07:00');
  const [newDuration, setNewDuration] = useState<number>(15);
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const loadData = async () => {
    if (!activeZoneId) return;
    try {
      const [thRes, scRes, actRes] = await Promise.all([
        apiFetch<{ data: Threshold[] }>(`/zones/${activeZoneId}/thresholds`),
        apiFetch<{ data: Schedule[] }>(`/zones/${activeZoneId}/schedules`),
        apiFetch<{ data: ActuatorItem[] }>(`/zones/${activeZoneId}/actuators`),
      ]);
      setThresholds(thRes.data);
      setSchedules(scRes.data);
      setActuators(actRes.data);
      if (actRes.data.length > 0) {
        setNewDevId((prev) =>
          actRes.data.some((a) => a.device_id === prev) ? prev : actRes.data[0].device_id
        );
      } else {
        setNewDevId(0);
      }
    } catch {
      toast.error('Lỗi tải cấu hình ngưỡng & lịch trình');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeZoneId]);

  const handleThresholdChange = (
    index: number,
    field: 'danger_min' | 'warning_min' | 'warning_max' | 'danger_max',
    rawValue: string
  ) => {
    const parsed = rawValue === '' ? Number.NaN : parseFloat(rawValue);
    setThresholds((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: parsed };
      return next;
    });
  };

  const updateRowAutoAction = (index: number, trigger: string, targetDeviceId?: number) => {
    setThresholds((prev) => {
      const next = [...prev];
      const row = next[index];
      if (trigger === 'NONE') {
        next[index] = { ...row, auto_actions: [] };
        return next;
      }
      const existing = row.auto_actions?.[0];
      const target =
        actuators.find((a) => a.device_id === targetDeviceId) ??
        actuators.find(
          (a) =>
            (existing?.target_device_id && a.device_id === existing.target_device_id) ||
            (existing?.target_metric && a.metric === existing.target_metric)
        ) ??
        actuators[0];

      next[index] = {
        ...row,
        auto_actions: target
          ? [
              {
                trigger,
                target_device_id: target.device_id,
                target_metric: target.metric,
                action: 'ON',
              },
            ]
          : [],
      };
      return next;
    });
  };

  const handleApplyThresholds = async () => {
    for (const th of thresholds) {
      const label = METRIC_META[th.metric as MetricKey]?.shortLabel ?? th.metric;
      const values = [th.danger_min, th.warning_min, th.warning_max, th.danger_max];
      if (values.some((v) => !Number.isFinite(v))) {
        toast.error(`Ngưỡng ${label} phải là số hợp lệ`);
        return;
      }
      if (!(th.danger_min < th.warning_min && th.warning_min < th.warning_max && th.warning_max < th.danger_max)) {
        toast.error(
          `Ngưỡng ${label} không hợp lệ: cần Nguy hiểm Min < Cảnh báo Min < Cảnh báo Max < Nguy hiểm Max`
        );
        return;
      }
    }

    setSaving(true);
    try {
      await apiFetch(`/zones/${activeZoneId}/thresholds`, {
        method: 'PUT',
        body: JSON.stringify({ thresholds }),
      });
      toast.success('Đã đồng bộ ngưỡng an toàn mới xuống thiết bị (Realtime Sync)');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi áp dụng cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setNewDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayId);
      }
      return [...prev, dayId].sort((a, b) => a - b);
    });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevId) {
      toast.error('Chưa chọn thiết bị chấp hành');
      return;
    }
    try {
      await apiFetch(`/zones/${activeZoneId}/schedules`, {
        method: 'POST',
        body: JSON.stringify({
          device_id: Number(newDevId),
          start_time: newTime,
          duration_minutes: Number(newDuration),
          days_of_week: [...newDays].sort((a, b) => a - b),
          is_active: true,
        }),
      });
      toast.success('Thêm lịch trình thành công');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo lịch');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await apiFetch(`/schedules/${id}`, { method: 'DELETE' });
      toast.success('Đã xóa lịch trình');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa lịch');
    }
  };

  const actuatorOptions = actuators.map((a) => ({
    value: a.device_id,
    label: a.name,
    sublabel: a.device_code,
  }));

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
              Quy tắc: Nguy hiểm Min &lt; Cảnh báo Min &lt; Cảnh báo Max &lt; Nguy hiểm Max · Gán tự bật thiết bị khi vượt ngưỡng
            </p>
          </div>

          <button
            type="button"
            onClick={handleApplyThresholds}
            disabled={saving || thresholds.length === 0}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Đang đồng bộ...' : 'ÁP DỤNG CẤU HÌNH (APPLY)'}</span>
          </button>
        </div>

        {thresholds.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/30 rounded-xl border border-slate-800">
            Phân khu này chưa có cấu hình ngưỡng.
          </div>
        ) : (
          <div className="space-y-3">
            {thresholds.map((th, idx) => {
              const meta = METRIC_META[th.metric as MetricKey];
              const currentAct = th.auto_actions?.[0];
              const triggerVal = currentAct?.trigger || 'NONE';
              const matchedActuator = actuators.find(
                (a) =>
                  (currentAct?.target_device_id && a.device_id === currentAct.target_device_id) ||
                  (currentAct?.target_metric && a.metric === currentAct.target_metric)
              );
              const selectedActId = matchedActuator?.device_id ?? actuators[0]?.device_id ?? 0;

              return (
                <div
                  key={th.id}
                  className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-400">
                        {meta ? meta.title : th.metric}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {th.metric} {meta ? `(${meta.unit})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-rose-400 font-semibold mb-1">
                        Nguy hiểm Min
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={Number.isFinite(th.danger_min) ? th.danger_min : ''}
                        onChange={(e) => handleThresholdChange(idx, 'danger_min', e.target.value)}
                        className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-amber-400 font-semibold mb-1">
                        Cảnh báo Min
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={Number.isFinite(th.warning_min) ? th.warning_min : ''}
                        onChange={(e) => handleThresholdChange(idx, 'warning_min', e.target.value)}
                        className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-amber-400 font-semibold mb-1">
                        Cảnh báo Max
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={Number.isFinite(th.warning_max) ? th.warning_max : ''}
                        onChange={(e) => handleThresholdChange(idx, 'warning_max', e.target.value)}
                        className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-rose-400 font-semibold mb-1">
                        Nguy hiểm Max
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={Number.isFinite(th.danger_max) ? th.danger_max : ''}
                        onChange={(e) => handleThresholdChange(idx, 'danger_max', e.target.value)}
                        className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Hành động tự động</label>
                        <Select<string>
                          value={triggerVal}
                          onChange={(val) => updateRowAutoAction(idx, val)}
                          ariaLabel={`Điều kiện tự động cho ${th.metric}`}
                          buttonClassName="min-h-[40px] rounded-lg text-xs py-1.5"
                          options={TRIGGER_OPTIONS}
                        />
                      </div>

                      {triggerVal !== 'NONE' && actuators.length > 0 && (
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Thiết bị bật kèm</label>
                          <Select<number>
                            value={selectedActId}
                            onChange={(val) => updateRowAutoAction(idx, triggerVal, Number(val))}
                            ariaLabel={`Thiết bị kích hoạt cho ${th.metric}`}
                            buttonClassName="min-h-[40px] rounded-lg text-xs py-1.5"
                            options={actuatorOptions}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Lập lịch trình tự động */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span>Lịch trình Vận hành Định kỳ (Tưới tiêu / Chiếu sáng)</span>
        </h2>

        {/* Form thêm lịch mới */}
        <form
          onSubmit={handleAddSchedule}
          className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[11px] text-slate-400 mb-1">Thiết bị chấp hành</label>
              <Select<number>
                value={newDevId}
                onChange={(val) => setNewDevId(Number(val))}
                placeholder="Chọn máy bơm / đèn / quạt"
                ariaLabel="Chọn thiết bị lập lịch"
                buttonClassName="min-h-[40px] rounded-lg text-xs py-1.5"
                options={actuatorOptions}
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Thời lượng (phút)</label>
              <input
                type="number"
                required
                min={1}
                max={480}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={actuators.length === 0 || !newDevId}
                className="w-full min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Lịch</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 mr-1">Ngày lặp lại:</span>
            {DAYS_OF_WEEK.map((d) => {
              const selected = newDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  aria-pressed={selected}
                  className={`min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-xs font-bold border transition ${
                    selected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {actuators.length === 0 && (
            <div className="text-[11px] text-amber-400">
              Phân khu này chưa có thiết bị chấp hành để lập lịch.
            </div>
          )}
        </form>

        {/* Danh sách lịch */}
        {schedules.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/30 rounded-xl border border-slate-800">
            Phân khu này chưa có lịch trình tự động nào.
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between gap-3 p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl text-xs"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold text-slate-200">
                    {sc.device_name || `Thiết bị #${sc.device_id}`}
                  </span>
                  <span className="text-slate-400">
                    lúc <strong className="text-emerald-400 font-mono">{sc.start_time}</strong> ({sc.duration_minutes}{' '}
                    phút)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300">
                    {formatDaysOfWeek(sc.days_of_week)}
                  </span>
                </div>
                <Tooltip
                  title="Xóa lịch trình"
                  description="Hủy lịch bật/tắt tự động này khỏi phân khu."
                  placement="left"
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(sc.id)}
                    aria-label="Xóa lịch trình"
                    className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
