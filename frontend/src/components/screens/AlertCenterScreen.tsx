import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import { Alert } from '../../types';
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export const AlertCenterScreen: React.FC = () => {
  const { activeFarmId } = useFarmStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [ackNote, setAckNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch<{ data: Alert[] }>(`/alerts?farm_id=${activeFarmId}`);
      setAlerts(res.data);
    } catch (err: any) {
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

      <div className="space-y-3">
        {alerts.map((al) => {
          const isCritical = al.severity === 'CRITICAL';
          const isUnack = al.status === 'UNACKNOWLEDGED';

          return (
            <div
              key={al.id}
              className={`p-4 bg-slate-900 border rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isCritical ? 'border-rose-500/30 shadow-sm shadow-rose-950/20' : 'border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {al.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">{al.zone_name || 'Khu vực'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {al.created_at.slice(11, 19)}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-100">{al.message}</div>
                {al.note && (
                  <div className="text-xs text-emerald-400/90 flex items-center gap-1 mt-1 font-mono bg-emerald-500/5 px-2 py-1 rounded">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Ghi chú xử lý: {al.note}</span>
                  </div>
                )}
              </div>

              <div>
                {isUnack ? (
                  <button
                    onClick={() => {
                      setSelectedAlert(al);
                      setAckNote('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    Xác nhận Xử lý (ACK)
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Đã xử lý
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Acknowledge */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-2">Xác nhận Tiếp nhận Sự cố #{selectedAlert.id}</h3>
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
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
