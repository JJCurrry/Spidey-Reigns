/**
 * 滑动手势层。把拖拽 / 键盘左右映射成一次抉择（choose）。
 * - 向左拖 → 选左；向右拖 → 选右（与卡面左/右选项一致）。
 * - 键盘 ← / → 同样可触发，兼顾可访问性与桌面端。**键盘路径同步调用 onChoose**，
 *   不引入任何延迟（保证 ReignGame 测试「按右方向键后指标立即变化」成立）。
 * - 拖拽中卡面实时倾斜 + 过阈值；松手未过阈值则回弹。
 * - 过阈值松手（指针路径）：旧卡沿抉择方向「飞出」动画，动画结束后才提交 onChoose，
 *   新卡由外层以 card.id 为 key 重新挂载，触发入场动画。
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Side } from '../core/types';
import { isMuted, playSwipe } from './audio';
import { vibrate } from './haptics';

export interface SwipeAreaProps {
  readonly onChoose: (side: Side) => void;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

const THRESHOLD = 80;
/** 飞出位移（px，足够清出 card 宽度；配合 opacity 淡出，宽屏也不可见）。 */
const FLY_PX = 620;
/** 飞出动画时长，需与 CSS .swipe-area__card 的 transform/opacity 过渡一致。 */
const FLY_MS = 220;

export function SwipeArea({ onChoose, disabled = false, children }: SwipeAreaProps) {
  const [dx, setDx] = useState(0);
  const [flying, setFlying] = useState<null | 'left' | 'right'>(null);
  const [flyDx, setFlyDx] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const timerRef = useRef<number | null>(null);

  const fireFeedback = useCallback(() => {
    if (!isMuted()) {
      playSwipe();
      vibrate(8);
    }
  }, []);

  const commit = useCallback(
    (side: Side) => {
      setFlying(side);
      setFlyDx(side === 'left' ? -FLY_PX : FLY_PX);
      fireFeedback();
      timerRef.current = window.setTimeout(() => {
        onChoose(side);
        setFlying(null);
        setFlyDx(0);
        setDx(0);
      }, FLY_MS);
    },
    [onChoose, fireFeedback],
  );

  const endDrag = useCallback(
    (finalDx: number) => {
      const wasDragging = dragging.current;
      setDx(0);
      startX.current = null;
      dragging.current = false;
      if (disabled || !wasDragging) return;
      if (finalDx <= -THRESHOLD) commit('left');
      else if (finalDx >= THRESHOLD) commit('right');
      // 否则回弹（dx 已归零，transition 处理）。
    },
    [disabled, commit],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || flying !== null) return;
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
      fireFeedback();
      onChoose('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      fireFeedback();
      onChoose('right');
    }
  };

  // 拖拽越界时给一点回弹（pointer 丢失 up 事件的兜底）。
  useEffect(() => {
    if (!dragging.current && dx !== 0) setDx(0);
  }, [dx]);

  // 卸载时清理飞出计时器，避免对已卸载组件调用 onChoose。
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const tilt = Math.max(-12, Math.min(12, dx / 12));
  const committedX = flying !== null ? flyDx : dx;
  const committedTilt = flying === 'left' ? -18 : flying === 'right' ? 18 : tilt;

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
        style={{
          transform: `translateX(${committedX}px) rotate(${committedTilt}deg)`,
          opacity: flying !== null ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
