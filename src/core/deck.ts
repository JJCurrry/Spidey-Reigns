/**
 * 抽卡：条件过滤 → 权重抽取 → 去重 → 兜底回退。
 *
 * 【黄金路径】本文件是全仓 src/core 的参考实现样板，新增 core 模块前请先读它：
 *   1. 纯函数，依赖（Rng）全部由入参注入，不用模块级可变状态
 *   2. 边界情况（空候选池、once 去重）显式处理，不抛错、不返回 undefined
 *   3. 每个分支都有对应用例（见 __tests__/deck.test.ts）
 *
 * 不变量 #6：抽卡必须防重复；候选池为空时必须回退到兜底卡，禁止抛错或渲染空白卡。
 */

import type { Rng } from './rng';
import { STAT_KEYS, type Card, type ReignState } from './types';

export const DEFAULT_WEIGHT = 1;

export function isConditionMet(card: Card, state: ReignState): boolean {
  const { condition } = card;
  if (condition === undefined) return true;

  const { stats, flags, withoutFlags, minTurn } = condition;

  if (stats !== undefined) {
    for (const key of STAT_KEYS) {
      const range = stats[key];
      if (range === undefined) continue;
      const value = state.stats[key];
      if (range.min !== undefined && value < range.min) return false;
      if (range.max !== undefined && value > range.max) return false;
    }
  }

  if (flags !== undefined && flags.some((flag) => !state.flags.includes(flag))) return false;
  if (withoutFlags !== undefined && withoutFlags.some((flag) => state.flags.includes(flag))) {
    return false;
  }
  if (minTurn !== undefined && state.turn < minTurn) return false;

  return true;
}

/**
 * 当前可抽取的候选卡。排除：已用过的 once 卡、刚出现过的卡、兜底卡、条件不满足的卡。
 */
export function selectCandidates(cards: readonly Card[], state: ReignState): readonly Card[] {
  return cards.filter((card) => {
    if (card.fallback === true) return false;
    if (card.id === state.currentCardId) return false;
    if (card.once === true && state.seenCardIds.includes(card.id)) return false;
    return isConditionMet(card, state);
  });
}

/** 按相对权重抽一张；候选为空返回 null（由 drawCard 决定如何兜底）。 */
export function pickWeighted(cards: readonly Card[], rng: Rng): Card | null {
  if (cards.length === 0) return null;

  const weights = cards.map((card) => Math.max(0, card.weight ?? DEFAULT_WEIGHT));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    // 所有候选权重都是 0（内容配置异常）：退化为等概率，保证游戏能继续
    return cards[rng.int(cards.length)] ?? null;
  }

  let roll = rng.next() * total;
  for (let i = 0; i < cards.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return cards[i] ?? null;
  }

  return cards[cards.length - 1] ?? null;
}

/**
 * 抽下一张卡。候选池为空时回退到兜底卡。
 * 抛错的唯一情况：连兜底卡都没有 —— 这是内容配置缺失，必须在启动时就炸出来。
 */
export function drawCard(cards: readonly Card[], state: ReignState, rng: Rng): Card {
  const picked = pickWeighted(selectCandidates(cards, state), rng);
  if (picked !== null) return picked;

  const fallbacks = cards.filter((card) => card.fallback === true);
  const fallback = fallbacks.length > 0 ? (fallbacks[rng.int(fallbacks.length)] ?? null) : null;
  if (fallback !== null) return fallback;

  throw new Error(
    '牌库中没有可抽取的卡，也没有兜底卡（fallback: true）。' +
      '请至少提供一张兜底卡 —— 不变量 #6：牌池抽空不允许抛错或渲染空白卡。',
  );
}
