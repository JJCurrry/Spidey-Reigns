/**
 * 四指标条。Reigns 传统：只给趋势不给具体数字（ASSUMPTION-NO-NUMBER），
 * 越靠边界颜色越「危险」。指标键顺序 = STAT_KEYS，永远与 UI 同步。
 */

import { STAT_LABELS } from '../content/constants';
import { STAT_KEYS } from '../core/types';
import { STAT_MAX, STAT_MIN } from '../core/stats';
import { AssetFrame } from './AssetFrame';
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

export function StatBars({ stats }: StatBarsProps) {
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
            <span className="stat-bars__track" role="meter" aria-valuenow={value} aria-label={STAT_LABELS[key]}>
              <span className="stat-bars__fill" style={{ width: `${value}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
