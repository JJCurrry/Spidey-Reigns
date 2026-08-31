/**
 * 一局（Reign）的生命周期：创建 → 抽卡 → 应用选择 → 判定死亡。
 *
 * 一局只因「死亡」结束，没有回合上限。死亡是设计内容，不是失败惩罚
 * （CLAUDE.md 原则 7）—— 不得为了让玩家活得更久而在这里削弱判定。
 */

import { createRng, type Rng } from './rng';
import { applyEffect, findBreach, INITIAL_STATS } from './stats';
import { drawCard } from './deck';
import type { Card, Death, ReignState, Side } from './types';

/** 平衡模拟的保险丝。命中即为「卡死」缺陷，不是正常结束。 */
export const MAX_TURNS = 500;

export function createReign(seed: number): ReignState {
  if (!Number.isInteger(seed)) {
    throw new RangeError(`种子必须是整数，收到：${String(seed)}`);
  }
  return {
    seed,
    stats: { ...INITIAL_STATS },
    turn: 0,
    flags: [],
    seenCardIds: [],
    currentCardId: null,
  };
}

/** 应用一次选择，返回新的局状态。纯函数，不修改入参。 */
export function applyChoice(state: ReignState, card: Card, side: Side): ReignState {
  const choice = side === 'left' ? card.left : card.right;

  const withFlag =
    choice.flag !== undefined && !state.flags.includes(choice.flag)
      ? [...state.flags, choice.flag]
      : state.flags;

  return {
    ...state,
    stats: applyEffect(state.stats, choice.effect),
    turn: state.turn + 1,
    flags: withFlag,
    seenCardIds: state.seenCardIds.includes(card.id)
      ? state.seenCardIds
      : [...state.seenCardIds, card.id],
    currentCardId: card.id,
  };
}

/**
 * 判定本回合是否结束一局。
 * 选项自带的 death 优先于指标越界（那是作者设计的「特殊死法」）。
 *
 * 注：找不到结局 id 时抛错而非静默放行 —— 这是内容完整性缺陷，
 * 由 src/core/__tests__/content.test.ts 在 CI 中拦截，运行时不应发生。
 */
export function evaluateDeath(
  state: ReignState,
  pendingDeathId: string | undefined,
  deaths: readonly Death[],
): Death | null {
  if (pendingDeathId !== undefined) {
    const special = deaths.find((death) => death.id === pendingDeathId);
    if (special === undefined) {
      throw new Error(
        `选项引用了不存在的结局 id：${pendingDeathId}。请检查 src/content/deaths.ts（内容完整性缺陷）。`,
      );
    }
    return special;
  }

  const breach = findBreach(state.stats);
  if (breach === null) return null;

  const id = `death-${breach.key}-${breach.side}`;
  const found = deaths.find((death) => death.id === id);
  if (found === undefined) {
    throw new Error(
      `指标 ${breach.key} 触及 ${breach.side} 边界，但缺少对应结局 ${id}。` +
        '请补齐 src/content/deaths.ts —— 四指标 × 双向共需 8 个边界结局。',
    );
  }
  return found;
}

export interface ReignResult {
  readonly seed: number;
  readonly turns: number;
  readonly death: Death;
  readonly stats: ReignState['stats'];
}

/** 玩家/模拟器的决策函数。注入而非内置，让同一局可被不同策略重跑。 */
export type ChooseSide = (card: Card, state: ReignState, rng: Rng) => Side;

/**
 * 跑完整一局，用于端到端测试与批量平衡模拟。
 * 到达 MAX_TURNS 仍未死亡 = 存在「死不了也继续不下去」的卡死状态（违反 CLAUDE.md 原则 6），直接抛错。
 */
export function runReign(
  seed: number,
  cards: readonly Card[],
  deaths: readonly Death[],
  choose: ChooseSide,
  maxTurns: number = MAX_TURNS,
): ReignResult {
  const rng = createRng(seed);
  let state = createReign(seed);

  for (let turn = 0; turn < maxTurns; turn += 1) {
    const card = drawCard(cards, state, rng);
    const side = choose(card, state, rng);
    const choice = side === 'left' ? card.left : card.right;

    state = applyChoice(state, card, side);

    const death = evaluateDeath(state, choice.death, deaths);
    if (death !== null) {
      return { seed, turns: state.turn, death, stats: state.stats };
    }
  }

  throw new Error(
    `一局跑了 ${maxTurns} 回合仍未结束（seed=${seed}）：存在「既无法继续、也不会死亡」的卡死状态。` +
      '这违反 CLAUDE.md 原则 6，请检查卡牌效果是否长期互相抵消。',
  );
}
