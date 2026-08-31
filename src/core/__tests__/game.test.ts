/**
 * 一局的端到端行为。
 * 这里钉死两条最重要的性质：
 *   1. 同种子 + 同策略 = 完全相同的一局（不变量 #1 的端到端证明）
 *   2. 一局必然在有限回合内以死亡结束（CLAUDE.md 原则 6：不许出现卡死状态）
 */

import { describe, expect, it } from 'vitest';
import { CARDS } from '../../content/cards';
import { DEATHS } from '../../content/deaths';
import { applyChoice, createReign, MAX_TURNS, runReign } from '../game';
import { createRng } from '../rng';
import { drawCard } from '../deck';
import { findBreach, INITIAL_STATS, STAT_MAX, STAT_MIN } from '../stats';
import type { Card, ReignState, Side } from '../types';
import type { Rng } from '../rng';
import { STAT_KEYS } from '../types';

// 边界结局 = death-<指标>-<min|max>；其余都是内容设计的「特殊死法」，也属合法结束。
const BOUNDARY_DEATH_IDS = new Set(
  STAT_KEYS.flatMap((key) => [`death-${key}-min`, `death-${key}-max`]),
);
const SPECIAL_DEATH_IDS: Set<string> = new Set(
  DEATHS.filter((d) => !BOUNDARY_DEATH_IDS.has(d.id)).map((d) => d.id),
);

const SEED_COUNT = 200;

const alwaysLeft = (): Side => 'left';
const alternate = (_card: Card, state: ReignState): Side =>
  state.turn % 2 === 0 ? 'left' : 'right';
const coinFlip = (_card: Card, _state: ReignState, rng: Rng): Side =>
  rng.next() < 0.5 ? 'left' : 'right';

describe('createReign', () => {
  it('初始状态：四指标均为 50，无标记，无已见卡牌', () => {
    const state = createReign(123);
    expect(state.stats).toEqual(INITIAL_STATS);
    expect(state.turn).toBe(0);
    expect(state.flags).toEqual([]);
    expect(state.seenCardIds).toEqual([]);
    expect(state.currentCardId).toBeNull();
    expect(state.seed).toBe(123);
  });

  it('拒绝非整数种子', () => {
    expect(() => createReign(1.5)).toThrow(RangeError);
  });
});

describe('applyChoice', () => {
  it('应用效果、推进回合、记录标记与已见卡牌', () => {
    const state = createReign(1);
    const card = drawCard(CARDS, state, createRng(1));
    const next = applyChoice(state, card, 'left');

    expect(next.turn).toBe(1);
    expect(next.currentCardId).toBe(card.id);
    expect(next.seenCardIds).toContain(card.id);
    expect(next.flags).toEqual(card.left.flag === undefined ? [] : [card.left.flag]);
    // 原状态不可变
    expect(state.turn).toBe(0);
    expect(state.stats).toEqual(INITIAL_STATS);
  });
});

describe('runReign（端到端）', () => {
  it('同种子 + 同策略 = 完全相同的一局（不变量 #1 端到端）', () => {
    for (const seed of [1, 42, 20260831]) {
      const a = runReign(seed, CARDS, DEATHS, coinFlip);
      const b = runReign(seed, CARDS, DEATHS, coinFlip);
      expect(a).toEqual(b);
    }
  });

  it('不同种子会产生不同的一局（种子确实在起作用）', () => {
    const results = new Set<string>();
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = runReign(seed, CARDS, DEATHS, coinFlip);
      results.add(`${result.turns}:${result.death.id}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it(`${SEED_COUNT} 个种子全部在 ${MAX_TURNS} 回合内结束（CLAUDE.md 原则 6：不许卡死）`, () => {
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const result = runReign(seed, CARDS, DEATHS, alternate);
      expect(result.turns).toBeGreaterThan(0);
      expect(result.turns).toBeLessThanOrEqual(MAX_TURNS);
    }
  });

  it('一局结束时必然是指标越界或触发了特殊结局（没有「莫名结束」）', () => {
    for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
      const result = runReign(seed, CARDS, DEATHS, alternate);
      const breached = findBreach(result.stats) !== null;
      const special = SPECIAL_DEATH_IDS.has(result.death.id);
      expect(
        breached || special,
        `seed=${seed} 以 ${result.death.id} 结束但不满足任何结束条件`,
      ).toBe(true);
    }
  });

  it('全程四指标恒在 [0,100]（不变量 #3 在真实牌局中不失效）', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = runReign(seed, CARDS, DEATHS, alternate);
      for (const value of Object.values(result.stats)) {
        expect(value).toBeGreaterThanOrEqual(STAT_MIN);
        expect(value).toBeLessThanOrEqual(STAT_MAX);
      }
    }
  });

  it('极端策略也会结束一局（一直选左边 / 一直选右边）', () => {
    for (const strategy of [alwaysLeft, (): Side => 'right'] as const) {
      for (let seed = 1; seed <= 30; seed += 1) {
        expect(runReign(seed, CARDS, DEATHS, strategy).turns).toBeGreaterThan(0);
      }
    }
  });

  it('指标越界但缺少对应结局时抛错，而不是静默放过（内容缺陷必须当场暴露）', () => {
    const partialDeaths = DEATHS.filter((death) => death.id !== 'death-life-min');
    const drain: Card[] = [
      {
        id: 'card-drain-a',
        text: '抽干生活值',
        left: { text: '左', effect: { life: -60 } },
        right: { text: '右', effect: { life: 1 } },
      },
      {
        id: 'card-drain-b',
        text: '继续抽干',
        left: { text: '左', effect: { life: -60 } },
        right: { text: '右', effect: { life: 1 } },
      },
    ];
    expect(() => runReign(1, drain, partialDeaths, alwaysLeft)).toThrow(/缺少对应结局/);
  });

  it('到达回合上限仍未死亡时抛错（卡死状态必须被抓出来，而不是静默通过）', () => {
    const frozen: Card[] = [
      {
        id: 'card-frozen-a',
        text: '毫无影响 A',
        left: { text: '左', effect: {} },
        right: { text: '右', effect: {} },
      },
      {
        id: 'card-frozen-b',
        text: '毫无影响 B',
        left: { text: '左', effect: {} },
        right: { text: '右', effect: {} },
      },
    ];
    expect(() => runReign(1, frozen, DEATHS, alternate, 10)).toThrow(/卡死/);
  });

  it('引用不存在的结局 id 时抛错，而不是静默放过（内容缺陷必须当场暴露）', () => {
    const brokenCard: Card = {
      id: 'card-broken',
      text: '引用了不存在的结局',
      left: { text: '左', effect: { life: -1 }, death: 'death-does-not-exist' },
      right: { text: '右', effect: { life: 1 } },
    };
    expect(() => runReign(1, [brokenCard], DEATHS, alwaysLeft)).toThrow(/不存在的结局/);
  });
});
