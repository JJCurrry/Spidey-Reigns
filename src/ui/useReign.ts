/**
 * useReign —— UI 层与 core 玩法层之间的适配 hook。
 *
 * 铁律：本文件只是「接线」，不写任何玩法规则（CLAUDE.md 原则 4/7）。
 * 抽卡、结算、死亡判定全部来自 src/core；Rng 由 seed 注入并贯穿整局（不变量 #1）。
 * 本 hook 也不读 localStorage（存档在 src/save/，由外层接入），只负责内存中的一局状态。
 *
 * 确定性约定：同一种子必须还原同一局。因此「每个种子 = 一次挂载」由调用方用 key={seed}
 * 保证（见 ReignGame/App），本 hook 不在 useEffect 里重复抽卡——否则首张卡会被抽两次、
 * 序列与 runReign 脱节，破坏「同种子同局」。
 */

import { useCallback, useRef, useState } from 'react';
import { applyChoice, createReign, evaluateDeath } from '../core/game';
import { drawCard } from '../core/deck';
import { createRng, type Rng } from '../core/rng';
import { CARDS } from '../content/cards';
import { DEATHS } from '../content/deaths';
import type { Card, Death, ReignState, Side } from '../core/types';

/** 一局的内部快照：共用同一个 Rng（可变，原地推进），状态与当前卡随之更新。 */
interface GameSnapshot {
  readonly rng: Rng;
  readonly state: ReignState;
  readonly card: Card | null;
}

export interface ReignController {
  readonly seed: number;
  readonly stats: ReignState['stats'];
  readonly turn: number;
  /** 当前等待玩家抉择的卡；一局结束后为 null（UI 用结局页覆盖）。 */
  readonly card: Card | null;
  /** 上一次选择追加的叙事文本，无则为 null。 */
  readonly outcome: string | null;
  readonly over: boolean;
  readonly death: Death | null;
  /** 玩家选择左/右。结局已触发后调用无效。 */
  readonly choose: (side: Side) => void;
}

/**
 * 持有一局的内存状态。调用方必须保证不同 seed 走不同挂载（key={seed}），
 * 这样首次抽卡只发生一次，序列与 core 的 runReign 完全一致。
 *
 * @param cards 本局可用卡组（默认全量 CARDS；解锁系统会传入已解锁子集）。
 * @param deaths 结局集（默认全量 DEATHS）。
 */
export function useReign(
  seed: number,
  cards: readonly Card[] = CARDS,
  deaths: readonly Death[] = DEATHS,
): ReignController {
  const [game, setGame] = useState<GameSnapshot>(() => {
    const rng = createRng(seed);
    const fresh = createReign(seed);
    return { rng, state: fresh, card: drawCard(cards, fresh, rng) };
  });
  const [outcome, setOutcome] = useState<string | null>(null);
  const [death, setDeath] = useState<Death | null>(null);

  // 卡组/结局可能随解锁进度变化（seed 不变时不重挂载），用 ref 保证 choose 永远用最新值。
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const deathsRef = useRef(deaths);
  deathsRef.current = deaths;

  const choose = useCallback(
    (side: Side) => {
      if (game.card === null) return; // 已结束
      const card = game.card;
      const choice = side === 'left' ? card.left : card.right;
      const next = applyChoice(game.state, card, side);
      setOutcome(choice.outcome ?? null);
      const resolved = evaluateDeath(next, choice.death, deathsRef.current);
      if (resolved !== null) {
        setDeath(resolved);
        setGame({ ...game, state: next, card: null });
        return;
      }
      const nextCard = drawCard(cardsRef.current, next, game.rng);
      setGame({ rng: game.rng, state: next, card: nextCard });
    },
    [game],
  );

  return {
    seed,
    stats: game.state.stats,
    turn: game.state.turn,
    card: game.card,
    outcome,
    over: death !== null,
    death,
    choose,
  };
}
