/**
 * 抽卡行为 —— 不变量 #6（抽卡防重复 + 空池兜底）的 L1 执行点。
 */

import { describe, expect, it } from 'vitest';
import { drawCard, pickWeighted, selectCandidates } from '../deck';
import { createRng } from '../rng';
import { INITIAL_STATS } from '../stats';
import type { Card, ReignState } from '../types';

const makeCard = (id: string, overrides: Partial<Card> = {}): Card => ({
  id,
  text: `${id} 的正文`,
  left: { text: '左', effect: { life: 1 } },
  right: { text: '右', effect: { life: -1 } },
  ...overrides,
});

const makeState = (overrides: Partial<ReignState> = {}): ReignState => ({
  seed: 1,
  stats: { ...INITIAL_STATS },
  turn: 0,
  flags: [],
  seenCardIds: [],
  currentCardId: null,
  ...overrides,
});

describe('pickWeighted（权重抽取）', () => {
  it('权重为 0 的卡永不被抽中', () => {
    const pool = [
      makeCard('a', { weight: 0 }),
      makeCard('b', { weight: 1 }),
      makeCard('c', { weight: 3 }),
    ];
    const rng = createRng(42);
    const counts = new Map<string, number>();
    for (let i = 0; i < 3000; i += 1) {
      const picked = pickWeighted(pool, rng);
      counts.set(picked?.id ?? 'none', (counts.get(picked?.id ?? 'none') ?? 0) + 1);
    }
    expect(counts.get('a') ?? 0).toBe(0);
    expect(counts.get('c') ?? 0).toBeGreaterThan((counts.get('b') ?? 0) * 2);
  });

  it('候选为空返回 null（由 drawCard 兜底，不在此抛错）', () => {
    expect(pickWeighted([], createRng(1))).toBeNull();
  });

  it('所有权重都是 0 时退化为等概率，保证游戏能继续', () => {
    const pool = [makeCard('a', { weight: 0 }), makeCard('b', { weight: 0 })];
    const rng = createRng(5);
    const ids = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      ids.add(pickWeighted(pool, rng)?.id ?? 'none');
    }
    expect(ids).toEqual(new Set(['a', 'b']));
  });
});

describe('selectCandidates（条件过滤）', () => {
  it('排除条件不满足的卡', () => {
    const pool = [
      makeCard('low-life-only', { condition: { stats: { life: { max: 25 } } } }),
      makeCard('always'),
    ];
    const ids = selectCandidates(pool, makeState()).map((card) => card.id);
    expect(ids).toEqual(['always']);
  });

  it('条件满足时纳入候选（指标区间为闭区间）', () => {
    const pool = [makeCard('low-life-only', { condition: { stats: { life: { max: 50 } } } })];
    const ids = selectCandidates(pool, makeState({ stats: { ...INITIAL_STATS, life: 50 } })).map(
      (card) => card.id,
    );
    expect(ids).toEqual(['low-life-only']);
  });

  it('排除用过的 once 卡、刚出现过的卡、兜底卡', () => {
    const pool = [
      makeCard('used-once', { once: true }),
      makeCard('just-shown'),
      makeCard('fallback', { fallback: true }),
      makeCard('available'),
    ];
    const state = makeState({ seenCardIds: ['used-once'], currentCardId: 'just-shown' });
    expect(selectCandidates(pool, state).map((card) => card.id)).toEqual(['available']);
  });

  it('flags / withoutFlags / minTurn 三个门禁都生效', () => {
    const pool = [
      makeCard('needs-flag', { condition: { flags: ['x'] } }),
      makeCard('hates-flag', { condition: { withoutFlags: ['x'] } }),
      makeCard('late-only', { condition: { minTurn: 10 } }),
    ];
    // 有 x 标记、第 0 回合：只有「需要 x」的卡能进
    const withFlag = selectCandidates(pool, makeState({ flags: ['x'], turn: 0 }));
    expect(withFlag.map((card) => card.id)).toEqual(['needs-flag']);

    // 无标记、第 20 回合：「需要 x」被排除，另两张都进
    const lateNoFlag = selectCandidates(pool, makeState({ turn: 20 }));
    expect(lateNoFlag.map((card) => card.id)).toEqual(['hates-flag', 'late-only']);
  });
});

describe('drawCard（不变量 #6：不许抛错，不许空白卡）', () => {
  it('候选池为空时回退到兜底卡', () => {
    const pool = [makeCard('used-once', { once: true }), makeCard('fallback', { fallback: true })];
    const state = makeState({ seenCardIds: ['used-once'], currentCardId: 'used-once' });
    expect(drawCard(pool, state, createRng(1)).id).toBe('fallback');
  });

  it('once 卡一局内最多出现一次', () => {
    const pool = [makeCard('once', { once: true }), makeCard('fallback', { fallback: true })];
    const rng = createRng(3);
    const seen: string[] = [];
    let state = makeState();
    for (let i = 0; i < 50; i += 1) {
      const card = drawCard(pool, state, rng);
      seen.push(card.id);
      state = {
        ...state,
        turn: state.turn + 1,
        seenCardIds: state.seenCardIds.includes(card.id)
          ? state.seenCardIds
          : [...state.seenCardIds, card.id],
        currentCardId: card.id,
      };
    }
    expect(seen.filter((id) => id === 'once').length).toBe(1);
  });

  it('不会连续抽到同一张卡（避免玩家看到重复画面）', () => {
    const pool = [
      makeCard('a'),
      makeCard('b'),
      makeCard('c'),
      makeCard('fallback', { fallback: true }),
    ];
    const rng = createRng(11);
    let state = makeState();
    let previous = '';
    for (let i = 0; i < 100; i += 1) {
      const card = drawCard(pool, state, rng);
      expect(card.id).not.toBe(previous);
      previous = card.id;
      state = { ...state, turn: state.turn + 1, currentCardId: card.id };
    }
  });

  it('同种子的抽卡序列完全一致', () => {
    const pool = [makeCard('a'), makeCard('b'), makeCard('c'), makeCard('d')];
    const run = (): string[] => {
      const rng = createRng(777);
      let state = makeState();
      const ids: string[] = [];
      for (let i = 0; i < 30; i += 1) {
        const card = drawCard(pool, state, rng);
        ids.push(card.id);
        state = { ...state, turn: state.turn + 1, currentCardId: card.id };
      }
      return ids;
    };
    expect(run()).toEqual(run());
  });

  it('无兜底卡且候选池为空时抛出明确错误（配置缺陷必须当场暴露）', () => {
    const pool = [makeCard('used-once', { once: true })];
    const state = makeState({ seenCardIds: ['used-once'] });
    expect(() => drawCard(pool, state, createRng(1))).toThrow(/兜底卡/);
    expect(() => drawCard([], makeState(), createRng(1))).toThrow(/兜底卡/);
  });
});
