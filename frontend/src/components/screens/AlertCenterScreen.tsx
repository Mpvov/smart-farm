import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Alert } from '../../types';
import { AlertTriangle, CheckCircle, Clock, OctagonAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from '../ui/Tooltip';

type StatusFilter = 'ALL' | 'UNACKNOWLEDGED' | 'ACKNOWLEDGED';
type SeverityFilter = 'ALL' | 'CRITICAL' | 'WARNING';

export const AlertCenterScreen: React.FC = () => {
  const { activeFarmId, setUnreadAlertsCount, setActiveZoneId, setActiveScreen } = useFarmStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [ackNote, setAckNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch<{ data: Alert[] }>(`/alerts?farm_id=${activeFarmId}`);
      setAlerts(res.data);
      setUnreadAlertsCount(res.data.filter((a) => a.status === 'UNACKNOWLEDGED').length);
    } catch {
      toast.error('Lỗi tải danh sách cảnh báo');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeFarmId]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setLoading(true);
    try {
      await apiFetch(`/alerts/${selectedAlert.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ note: ackNote }),
      });
      toast.success(`Đã xác nhận sự cố #${selectedAlert.id}`);
      setSelectedAlert(null);
      setAckNote('');
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const unackCount = alerts.filter((a) => a.status === 'UNACKNOWLEDGED').length;
  const ackCount = alerts.filter((a) => a.status !== 'UNACKNOWLEDGED').length;

  const filteredAlerts = alerts.filter((al) => {
    if (statusFilter === 'UNACKNOWLEDGED' && al.status !== 'UNACKNOWLEDGED') return false;
    if (statusFilter === 'ACKNOWLEDGED' && al.status === 'UNACKNOWLEDGED') return false;
    if (severityFilter !== 'ALL' && al.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span>Trung tâm Cảnh báo & Sự cố Môi trường</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tiếp nhận vi phạm ngưỡng an toàn tức thời và phân công xử lý tại hiện trường
        </p>
      </div>

      {/* Bộ lọc trạng thái & mức độ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL' as StatusFilter, label: `Tất cả (${alerts.length})` },
            { id: 'UNACKNOWLEDGED' as StatusFilter, label: `Chưa xử lý (${unackCount})` },
            { id: 'ACKNOWLEDGED' as StatusFilter, label: `Đã xử lý (${ackCount})` },
          ].map((item) => {
            const active = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL' as SeverityFilter, label: 'Mọi mức' },
            { id: 'CRITICAL' as SeverityFilter, label: 'Nguy hiểm' },
            { id: 'WARNING' as SeverityFilter, label: 'Cảnh báo' },
          ].map((item) => {
            const active = severityFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeverityFilter(item.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-1.5">
          <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-200">Không có cảnh báo phù hợp</div>
          <div className="text-xs text-slate-400">
            Mọi phân khu đang nằm trong ngưỡng theo bộ lọc hiện tại.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((al) => {
            const isCritical = al.severity === 'CRITICAL';
            const isUnack = al.status === 'UNACKNOWLEDGED';

            return (
              <div
                key={al.id}
                className={`p-4 bg-slate-900 border rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical ? 'border-rose-500/30 shadow-sm' : 'border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-400 border-2 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-400 border-2 border-amber-500/40'
                      }`}
                    >
                      {isCritical ? (
                        <OctagonAlert className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{isCritical ? 'NGUY HIỂM' : 'CẢNH BÁO'}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {al.zone_name || `Khu vực #${al.zone_id}`}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {al.created_at.slice(11, 19)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-100">{al.message}</div>
                  {al.note && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono bg-emerald-500/5 px-2 py-1 rounded">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Ghi chú xử lý: {al.note}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Tooltip
                    title="Kiểm tra phân khu"
                    description="Mở Tổng quan tại phân khu xảy ra cảnh báo để xem số đo trực tiếp."
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveZoneId(al.zone_id);
                        setActiveScreen('SCR-02');
                      }}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                    >
                      <span>Xem khu vực</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </Tooltip>

                  {isUnack ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAlert(al);
                        setAckNote('');
                      }}
                      className="min-h-[48px] w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm active:scale-[0.98]"
                    >
                      Xác nhận Xử lý (ACK)
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 text-slate-400 text-xs font-medium rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Đã xử lý
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Acknowledge */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-2">
              Xác nhận Tiếp nhận Sự cố #{selectedAlert.id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedAlert.message}</p>

            <form onSubmit={handleAcknowledge} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Biện pháp khắc phục / Ghi chú hiện trường:
                </label>
                <textarea
                  required
                  rows={3}
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra vòi tưới, bật bơm bù ẩm thành công..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="min-h-[48px] px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[48px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl active:scale-[0.98]"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
