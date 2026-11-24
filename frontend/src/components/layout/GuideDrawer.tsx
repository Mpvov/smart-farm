import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Search, X } from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { GUIDE_SECTIONS } from '../../config/guide';
import { canAccessScreen } from '../../config/navigation';
import { Tooltip } from '../ui/Tooltip';

interface GuideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const GuideDrawer: React.FC<GuideDrawerProps> = ({ open, onClose }) => {
  const { activeScreen, setActiveScreen, user } = useFarmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const roleSections = GUIDE_SECTIONS.filter((sec) => !sec.adminOnly || isAdmin);

  useEffect(() => {
    if (!open) return;
    const matched = roleSections.find((sec) => sec.screenIds.includes(activeScreen));
    setExpandedId(matched?.id ?? roleSections[0]?.id ?? null);
  }, [open, activeScreen, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const q = searchQuery.trim().toLowerCase();
  const filteredSections = q
    ? roleSections.filter(
        (sec) =>
          sec.title.toLowerCase().includes(q) ||
          sec.summary.toLowerCase().includes(q) ||
          sec.steps.some((st) => st.toLowerCase().includes(q)) ||
          (sec.tip && sec.tip.toLowerCase().includes(q))
      )
    : roleSections;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn vận hành Smart Farm"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate">
                Sổ tay Hướng dẫn Sử dụng
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Tài liệu bàn giao thao tác theo vai trò ({user?.role || 'OPERATOR'})
              </p>
            </div>
          </div>

          <Tooltip
            title="Đóng hướng dẫn"
            description="Đóng ngăn sổ tay để quay lại màn hình làm việc."
            placement="left"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng sổ tay hướng dẫn"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-800/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm trong hướng dẫn"
              placeholder="Tìm: Hardware UID, MQTT, ngưỡng, tưới..."
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredSections.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/30 border border-slate-800 rounded-2xl">
              Không tìm thấy mục hướng dẫn khớp với từ khóa "{searchQuery}".
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isCurrent = sec.screenIds.includes(activeScreen);
              const isExpanded = Boolean(q) || expandedId === sec.id;
              const canJump = canAccessScreen(sec.targetScreen, user?.role);

              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isCurrent
                      ? 'bg-slate-800/50 border-emerald-500/40'
                      : 'bg-slate-800/30 border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded && !q ? null : sec.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-4 text-left flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-100">
                          {sec.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Đang xem màn này
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{sec.summary}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform ${
                        isExpanded ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800 space-y-3">
                      <ol className="space-y-2 text-xs text-slate-200 leading-relaxed">
                        {sec.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>

                      {sec.tip && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 leading-relaxed">
                          Lưu ý: {sec.tip}
                        </div>
                      )}

                      {canJump && sec.targetScreen !== activeScreen && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveScreen(sec.targetScreen);
                            onClose();
                          }}
                          className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                        >
                          <span>Đi tới màn hình này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
