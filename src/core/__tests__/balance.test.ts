/**
 * 批量平衡模拟守卫（原则 6：一局必须始终可完结，不得卡死）。
 *
 * 用随机策略跑大量种子，断言没有任何一局会命中 MAX_TURNS 抛错——
 * 那意味着出现了「既无法继续、也不会死亡」的卡死状态。
 * 这是对内容扩充（新增卡 / 新死法）最便宜的回归保护：任何让牌池长期互相抵消的配置都会在这里炸出来。
 */

import { describe, expect, it } from 'vitest';
import { runReign, type ChooseSide } from '../game';
import { CARDS } from '../../content/cards';
import { DEATHS } from '../../content/deaths';
import type { Card } from '../types';

const randomChoose: ChooseSide = (_card: Card, _state, rng) =>
  rng.int(2) === 0 ? 'left' : 'right';

describe('批量模拟：一局必然在有限回合内以死亡结束（不卡死）', () => {
  it('300 个随机种子全部能跑完一局，无一命中 MAX_TURNS', () => {
    const seeds = Array.from({ length: 300 }, (_, i) => i + 1);
    for (const seed of seeds) {
      // 不传 maxTurns，使用默认值；命中上限会抛错，这里预期不抛。
      expect(() => runReign(seed, CARDS, DEATHS, randomChoose)).not.toThrow();
    }
  });
});
