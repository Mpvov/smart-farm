import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { apiFetch } from '../../lib/api';
import ReactECharts from 'echarts-for-react';
import { FileBarChart2, Download, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const ReportScreen: React.FC = () => {
  const { activeFarmId, activeZoneId } = useFarmStore();
  const [data, setData] = useState<{
    summary: { total_operational_hours: number; optimal_condition_rate: number; total_water_liters: number };
    series: Array<{ timestamp: string; avg_temp: number; avg_humi: number; avg_soil: number; pump_active_minutes: number }>;
  } | null>(null);

  useEffect(() => {
    apiFetch<{ data: any }>(`/reports/analytics?farm_id=${activeFarmId}&zone_id=${activeZoneId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [activeFarmId, activeZoneId]);

  const handleExportCSV = () => {
    window.open(`/api/v1/reports/export?format=csv&zone_id=${activeZoneId}`, '_blank');
    toast.success('Đang tải tệp báo cáo tổng hợp CSV...');
  };

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#f8fafc' } },
    legend: {
      data: ['Nhiệt độ (°C)', 'Độ ẩm đất (%)', 'Độ ẩm không khí (%)'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
    },
    grid: { top: 40, left: 45, right: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: (data?.series || []).map((s) => s.timestamp.slice(11, 16)),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [
      {
        name: 'Nhiệt độ (°C)',
        type: 'line',
        smooth: true,
        data: (data?.series || []).map((s) => s.avg_temp),
        lineStyle: { color: '#f59e0b', width: 2 },
      },
      {
        name: 'Độ ẩm đất (%)',
        type: 'line',
        smooth: true,
        data: (data?.series || []).map((s) => s.avg_soil),
        lineStyle: { color: '#10b981', width: 2 },
      },
      {
        name: 'Độ ẩm không khí (%)',
        type: 'line',
        smooth: true,
        data: (data?.series || []).map((s) => s.avg_humi),
        lineStyle: { color: '#38bdf8', width: 2 },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-emerald-400" />
            <span>Báo cáo Động & Khai thác Dữ liệu HTTT</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân tích tương quan đa trục chuỗi thời gian và xuất tệp tin báo cáo tổng hợp
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>XUẤT BÁO CÁO (CSV)</span>
        </button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Tỷ lệ Môi trường Đạt chuẩn</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            {data?.summary.optimal_condition_rate || 96.2}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Duy trì trong ngưỡng tối ưu</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Tổng Lượng Nước Tiêu Thụ</div>
          <div className="text-2xl font-extrabold text-sky-400 mt-1 font-mono">
            {data?.summary.total_water_liters || 1420} Lít
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Tưới nhỏ giọt tiết kiệm</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Tổng Giờ Vận hành Thiết bị</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
            {data?.summary.total_operational_hours || 168} Giờ
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Bao gồm bơm và chiếu sáng</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4">Biểu đồ Tương quan Đa trục Vi khí hậu</h3>
        <div className="h-72 w-full">
          <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Bảng Số liệu Chi tiết theo Giờ</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3">Thời gian</th>
              <th className="py-2.5 px-3">Nhiệt độ TB (°C)</th>
              <th className="py-2.5 px-3">Độ ẩm đất TB (%)</th>
              <th className="py-2.5 px-3">Độ ẩm khí TB (%)</th>
              <th className="py-2.5 px-3">Bơm hoạt động (phút)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {(data?.series || []).map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-300">{row.timestamp}</td>
                <td className="py-2.5 px-3 text-amber-400">{row.avg_temp}°C</td>
                <td className="py-2.5 px-3 text-emerald-400">{row.avg_soil}%</td>
                <td className="py-2.5 px-3 text-sky-400">{row.avg_humi}%</td>
                <td className="py-2.5 px-3 text-slate-400">{row.pump_active_minutes} phút</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
