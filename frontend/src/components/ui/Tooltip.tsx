import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  title?: string;
  description: string;
  placement?: Placement;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  placement = 'bottom',
  disabled = false,
  className = 'inline-flex',
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;

    const rect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 8;
    const pad = 12;

    let top = 0;
    let left = 0;

    if (placement === 'top') {
      top = rect.top - tipRect.height - gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
    } else if (placement === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
    } else if (placement === 'right') {
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.right + gap;
    } else {
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.left - tipRect.width - gap;
    }

    if (top < pad && placement === 'top') {
      top = rect.bottom + gap;
    } else if (top + tipRect.height > window.innerHeight - pad && placement === 'bottom') {
      top = rect.top - tipRect.height - gap;
    }

    left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - tipRect.height - pad));

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (visible && !disabled) {
      updatePosition();
    }
  }, [visible, disabled, title, description, placement]);

  useEffect(() => {
    if (!visible) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [visible]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      className={className}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          ref={tipRef}
          role="tooltip"
          style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
          className="sf-tooltip fixed z-[70] pointer-events-none max-w-[260px] w-max rounded-xl px-3 py-2.5 shadow-xl text-left"
        >
          {title && <div className="sf-tooltip-title text-xs font-bold leading-snug">{title}</div>}
          <div className={`sf-tooltip-desc text-[11px] leading-relaxed ${title ? 'mt-0.5' : ''}`}>
            {description}
          </div>
        </div>
      )}
    </div>
  );
};
