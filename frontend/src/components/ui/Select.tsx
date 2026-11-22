import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: ReadonlyArray<SelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Chọn...',
  ariaLabel,
  icon,
  className = '',
  buttonClassName = '',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightedIdx(idx >= 0 ? idx : 0);

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIdx((prev) => (options.length ? (prev + 1) % options.length : -1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx((prev) => (options.length ? (prev - 1 + options.length) % options.length : -1));
      } else if (e.key === 'Enter' && highlightedIdx >= 0 && options[highlightedIdx]) {
        e.preventDefault();
        onChange(options[highlightedIdx].value);
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, options, value, highlightedIdx, onChange]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full min-h-[44px] rounded-xl border bg-slate-800 px-3 py-2 text-xs sm:text-sm font-medium text-slate-200 flex items-center justify-between gap-2 transition focus:outline-none ${
          open
            ? 'border-emerald-500 ring-1 ring-emerald-500/30'
            : 'border-slate-700 hover:border-emerald-500/50'
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 mt-1.5 min-w-[210px] max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 space-y-0.5"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-400">Không có dữ liệu</li>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIdx;
              return (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer flex items-center justify-between gap-2 transition ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                      : isHighlighted
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-slate-400 truncate">{opt.sublabel}</div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
