import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    const url = filterType ? `/audit-logs?event_type=${filterType}` : '/audit-logs';
    apiFetch<{ data: AuditLog[] }>(url)
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  }, [filterType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Nhật ký Hoạt động Ứng dụng (Audit Log)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bản ghi kiểm toán độc lập bất biến (Append-only) phục vụ thanh tra hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-200"
          >
            <option value="">Tất cả loại sự kiện</option>
            <option value="DEVICE_CONTROL">Điều khiển thiết bị</option>
            <option value="CONFIG_CHANGE">Thay đổi cấu hình</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="ALERT_ACK">Xác nhận cảnh báo</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Tác nhân</th>
                <th className="py-3 px-4">Sự kiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Chi tiết</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{log.user_name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">{log.role}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">{log.action}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
