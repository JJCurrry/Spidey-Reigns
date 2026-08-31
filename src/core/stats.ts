/**
 * 指标结算。四指标恒为 0–100 整数（不变量 #3）。
 * 若允许越界，死亡判定会漏触发，玩家会卡在「死不了也赢不了」的局里。
 */

import { STAT_KEYS, type Effect, type StatKey, type Stats } from './types';

export const STAT_MIN = 0;
export const STAT_MAX = 100;

/** 一局起始值。四个指标都是 50 —— 中点出发，两边都是悬崖。语义见 ADR-0008。 */
export const INITIAL_STATS: Stats = {
  civilians: 50,
  media: 50,
  villains: 50,
  life: 50,
};

export function clampStat(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`指标值必须是有限数，收到：${String(value)}`);
  }
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

/** 应用一次效果并返回新的 Stats。不修改入参（纯函数）。 */
export function applyEffect(stats: Stats, effect: Effect): Stats {
  const next = {} as Record<StatKey, number>;
  for (const key of STAT_KEYS) {
    next[key] = clampStat(stats[key] + (effect[key] ?? 0));
  }
  return next;
}

export interface Breach {
  readonly key: StatKey;
  readonly side: 'min' | 'max';
}

/** 找出第一个触及 0 或 100 的指标；没有则返回 null。 */
export function findBreach(stats: Stats): Breach | null {
  for (const key of STAT_KEYS) {
    const value = stats[key];
    if (value <= STAT_MIN) return { key, side: 'min' };
    if (value >= STAT_MAX) return { key, side: 'max' };
  }
  return null;
}
