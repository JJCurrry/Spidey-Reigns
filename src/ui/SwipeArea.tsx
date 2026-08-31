/**
 * 滑动手势层。把拖拽 / 键盘左右映射成一次抉择（choose）。
 * - 向左拖 → 选左；向右拖 → 选右（与卡面左/右选项一致）。
 * - 键盘 ← / → 同样可触发，兼顾可访问性与桌面端。
 * 拖拽中卡面实时倾斜，松手未过阈值则回弹（不触发抉择）。
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Side } from '../core/types';

export interface SwipeAreaProps {
  readonly onChoose: (side: Side) => void;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

const THRESHOLD = 80;

export function SwipeArea({ onChoose, disabled = false, children }: SwipeAreaProps) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const endDrag = useCallback(
    (finalDx: number) => {
      setDx(0);
      startX.current = null;
      dragging.current = false;
      if (disabled) return;
      if (finalDx <= -THRESHOLD) onChoose('left');
      else if (finalDx >= THRESHOLD) onChoose('right');
    },
    [disabled, onChoose],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    endDrag(dx);
  };
  const onPointerCancel = () => {
    if (!dragging.current) return;
    endDrag(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChoose('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChoose('right');
    }
  };

  // 拖拽越界时给一点回弹（pointer 丢失 up 事件的兜底）。
  useEffect(() => {
    if (!dragging.current && dx !== 0) setDx(0);
  }, [dx]);

  const tilt = Math.max(-12, Math.min(12, dx / 12));

  return (
    <div
      className="swipe-area"
      tabIndex={disabled ? -1 : 0}
      role="group"
      aria-label="滑动或按左右方向键做抉择"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      <div
        className="swipe-area__card"
        style={{ transform: `translateX(${dx}px) rotate(${tilt}deg)` }}
      >
        {children}
      </div>
    </div>
  );
}
