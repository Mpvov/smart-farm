import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { AuditLog } from '../../types';
import { ShieldCheck, Filter, Search } from 'lucide-react';
import { Select } from '../ui/Select';

export const AuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const url = filterType ? `/audit-logs?event_type=${filterType}` : '/audit-logs';
    apiFetch<{ data: AuditLog[] }>(url)
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  }, [filterType]);

  const keyword = searchQuery.trim().toLowerCase();
  const filteredLogs = keyword
    ? logs.filter((log) =>
        [
          log.user_name,
          log.action,
          log.details,
          log.farm_name,
          log.zone_name,
          log.device_name,
          log.event_type,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(keyword))
      )
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Nhật ký Hoạt động Ứng dụng (Audit Log)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bản ghi kiểm toán độc lập bất biến (Append-only) phục vụ thanh tra hệ thống
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm nhật ký hoạt động"
              placeholder="Tìm tác nhân, hành động, thiết bị..."
              className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <Select
            value={filterType}
            onChange={(val) => setFilterType(val)}
            ariaLabel="Lọc theo loại sự kiện"
            icon={<Filter className="w-4 h-4 text-emerald-400" />}
            className="min-w-[210px]"
            options={[
              { value: '', label: 'Tất cả loại sự kiện' },
              { value: 'DEVICE_CONTROL', label: 'Điều khiển thiết bị' },
              { value: 'CONFIG_CHANGE', label: 'Thay đổi cấu hình' },
              { value: 'LOGIN', label: 'Đăng nhập' },
              { value: 'ALERT_ACK', label: 'Xác nhận cảnh báo' },
            ]}
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-800/30">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Tác nhân</th>
                <th className="py-3 px-4">Sự kiện</th>
                <th className="py-3 px-4">Khu vực / Thiết bị</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Chi tiết</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-xs text-slate-400">
                    Không tìm thấy bản ghi nhật ký phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const targetScope =
                    [log.farm_name, log.zone_name, log.device_name].filter(Boolean).join(' · ') ||
                    'Toàn hệ thống';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
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
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                        {targetScope}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{log.action}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
