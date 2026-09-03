/**
 * 四指标条。Reigns 传统：只给趋势不给具体数字（ASSUMPTION-NO-NUMBER），
 * 越靠边界颜色越「危险」。指标键顺序 = STAT_KEYS，永远与 UI 同步。
 */

import { useEffect, useRef } from 'react';
import { STAT_LABELS } from '../content/constants';
import { STAT_KEYS } from '../core/types';
import { STAT_MAX, STAT_MIN } from '../core/stats';
import { AssetFrame } from './AssetFrame';
import { playDanger } from './audio';
import type { Stats } from '../core/types';

export interface StatBarsProps {
  readonly stats: Stats;
}

/** 靠近 0 或 100 时返回警示类，驱动 CSS 变色。 */
function edgeClass(value: number): 'is-low' | 'is-high' | '' {
  if (value <= STAT_MIN + 15) return 'is-low';
  if (value >= STAT_MAX - 15) return 'is-high';
  return '';
}

/** 是否进入临界区（≤10 或 ≥90）：触发一次轻提示音。 */
function isDanger(value: number): boolean {
  return value <= 10 || value >= STAT_MAX - 10;
}

export function StatBars({ stats }: StatBarsProps) {
  // 仅当某指标「从安全区进入临界区」时提示一次（避免每回合重复响）。
  const prev = useRef(stats);
  useEffect(() => {
    const before = prev.current;
    const entered = STAT_KEYS.some((key) => !isDanger(before[key]) && isDanger(stats[key]));
    prev.current = stats;
    if (entered) playDanger();
  }, [stats]);

  return (
    <ul className="stat-bars" aria-label="四指标状态">
      {STAT_KEYS.map((key) => {
        const value = stats[key];
        const cls = edgeClass(value);
        return (
          <li key={key} className={`stat-bars__item ${cls}`.trim()}>
            <AssetFrame
              assetId={`icon-${key}`}
              label={STAT_LABELS[key]}
              alt={STAT_LABELS[key]}
              className="stat-bars__icon"
            />
            <span className="stat-bars__label">{STAT_LABELS[key]}</span>
            <span
              className="stat-bars__track"
              role="meter"
              aria-valuenow={value}
              aria-label={STAT_LABELS[key]}
            >
              <span className="stat-bars__fill" style={{ width: `${value}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
