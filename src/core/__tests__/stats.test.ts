import { describe, expect, it } from 'vitest';
import { applyEffect, clampStat, findBreach, INITIAL_STATS, STAT_MAX, STAT_MIN } from '../stats';
import { STAT_KEYS } from '../types';

describe('指标结算（不变量 #3：四指标恒为 0–100 整数）', () => {
  it('clampStat 把越界值钳回 [0,100]', () => {
    expect(clampStat(-999)).toBe(STAT_MIN);
    expect(clampStat(9999)).toBe(STAT_MAX);
    expect(clampStat(42)).toBe(42);
  });

  it('clampStat 拒绝非有限数（NaN 会静默毒死整局，必须当场炸出来）', () => {
    expect(() => clampStat(Number.NaN)).toThrow(RangeError);
    expect(() => clampStat(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('applyEffect 后四指标恒在 [0,100] —— 极端效果也不越界', () => {
    const after = applyEffect(INITIAL_STATS, {
      civilians: -9999,
      media: 9999,
      villains: 49,
      life: 0,
    });
    expect(after.civilians).toBe(STAT_MIN);
    expect(after.media).toBe(STAT_MAX);
    expect(after.villains).toBe(99);
    expect(after.life).toBe(50);
  });

  it('applyEffect 不修改入参（纯函数，避免隐藏的共享可变状态）', () => {
    const before = { ...INITIAL_STATS };
    applyEffect(before, { civilians: -50 });
    expect(before).toEqual(INITIAL_STATS);
  });

  it('findBreach 在触及 0 或 100 时返回对应边界', () => {
    expect(findBreach({ ...INITIAL_STATS, life: 0 })).toEqual({ key: 'life', side: 'min' });
    expect(findBreach({ ...INITIAL_STATS, villains: 100 })).toEqual({
      key: 'villains',
      side: 'max',
    });
  });

  it('findBreach 在安全区间返回 null', () => {
    expect(findBreach(INITIAL_STATS)).toBeNull();
    expect(findBreach({ ...INITIAL_STATS, civilians: 1, media: 99 })).toBeNull();
  });

  it('初始值四指标均为 50，键集合与 STAT_KEYS 完全一致', () => {
    for (const key of STAT_KEYS) {
      expect(INITIAL_STATS[key]).toBe(50);
    }
    expect(Object.keys(INITIAL_STATS).sort()).toEqual([...STAT_KEYS].sort());
  });
});
