/**
 * 内容完整性守卫 —— 不变量 #4（内容只放 src/content）与 #5（内容完整性）的 L1 执行点。
 *
 * 这里拦的是「内容配置缺陷」：空效果选项、重复 id、缺失的边界结局。
 * 这些错误在运行时只会表现为「玩家点了没反应」或「莫名其妙结束一局」，极难定位，
 * 所以必须前移到 CI 阶段。
 */

import { describe, expect, it } from 'vitest';
import { CARDS } from '../../content/cards';
import { DEATHS } from '../../content/deaths';
import { UNLOCK_TIERS } from '../../content/unlocks';
import { STAT_KEYS, type Card, type Choice, type StatKey } from '../types';

// 显式向上转型为 Card：CARDS 是 as const 字面量元组，未声明的可选字段（如 fallback）
// 在联合类型里根本不存在，直接点取值会编译失败。
const cards: readonly Card[] = CARDS;

const choicesOf = (card: Card): readonly Choice[] => [card.left, card.right];

const hasNonZeroEffect = (choice: Choice): boolean =>
  Object.values(choice.effect).some((delta) => delta !== undefined && delta !== 0);

const deathIds = new Set(DEATHS.map((death) => death.id));

describe('内容完整性守卫（不变量 #4 / #5）', () => {
  it('卡牌 id 唯一', () => {
    const ids = cards.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('卡牌 id 符合 kebab-case 命名约定', () => {
    for (const card of cards) {
      expect(card.id).toMatch(/^card-[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('每张卡的左右选项文案都非空', () => {
    for (const card of cards) {
      for (const choice of choicesOf(card)) {
        expect(choice.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('每个选项至少影响一个指标（delta 不全为 0 —— 否则玩家会空点一次）', () => {
    for (const card of cards) {
      for (const choice of choicesOf(card)) {
        expect(hasNonZeroEffect(choice), `${card.id} 的「${choice.text}」没有任何效果`).toBe(true);
      }
    }
  });

  it('效果字段只使用四个指标键（拼错字段名在这里被二次拦截）', () => {
    for (const card of cards) {
      for (const choice of choicesOf(card)) {
        for (const key of Object.keys(choice.effect)) {
          expect(STAT_KEYS).toContain(key as StatKey);
        }
      }
    }
  });

  it('至少存在一张兜底卡（不变量 #6 的前提）', () => {
    expect(cards.filter((card) => card.fallback === true).length).toBeGreaterThan(0);
  });

  it('选项引用的结局 id 必须真实存在', () => {
    for (const card of cards) {
      for (const choice of choicesOf(card)) {
        if (choice.death !== undefined) {
          expect(deathIds, `${card.id} 引用了不存在的结局 ${choice.death}`).toContain(choice.death);
        }
      }
    }
  });

  it('结局 id 唯一且文案非空', () => {
    expect(new Set(DEATHS.map((death) => death.id)).size).toBe(DEATHS.length);
    for (const death of DEATHS) {
      expect(death.title.trim().length).toBeGreaterThan(0);
      expect(death.text.trim().length).toBeGreaterThan(0);
    }
  });

  it('四指标 × 双向 = 8 个边界结局全部存在（否则运行时会抛错而非静默）', () => {
    for (const key of STAT_KEYS) {
      for (const side of ['min', 'max'] as const) {
        expect(deathIds, `缺少边界结局 death-${key}-${side}`).toContain(`death-${key}-${side}`);
      }
    }
  });

  it('解锁档位覆盖全部卡牌，且每张卡恰好属于一个档位（M1 解锁进度）', () => {
    const allCardIds = new Set(cards.map((card) => card.id));
    const seen = new Set<string>();
    for (const tier of UNLOCK_TIERS) {
      for (const id of tier.cardIds) {
        expect(seen.has(id), `卡牌 ${id} 出现在多个解锁档位`).toBe(false);
        seen.add(id);
      }
    }
    expect(seen, '解锁档位未覆盖全部卡牌').toEqual(allCardIds);
  });

  it('解锁档位单调：minDeaths 非递减，且 tier-0 必含兜底卡且非空', () => {
    const tiers = UNLOCK_TIERS;
    expect(tiers[0]?.minDeaths).toBe(0);
    expect(tiers[0]?.cardIds.length ?? 0).toBeGreaterThan(0);
    expect(tiers[0]?.cardIds ?? []).toContain('card-quiet-night');
    for (let i = 1; i < tiers.length; i += 1) {
      const prev = tiers[i - 1];
      const curr = tiers[i];
      expect(curr?.minDeaths ?? 0).toBeGreaterThanOrEqual(prev?.minDeaths ?? 0);
    }
  });

  it('每条特殊死法（非四指标边界结局）至少被一张卡引用（保证可达，不是死代码）', () => {
    const boundary = new Set<string>();
    for (const key of STAT_KEYS) {
      for (const side of ['min', 'max'] as const) {
        boundary.add(`death-${key}-${side}`);
      }
    }
    const specialDeaths = DEATHS.map((death) => death.id).filter((id) => !boundary.has(id));
    for (const deathId of specialDeaths) {
      const reachable = cards.some((card) =>
        [card.left, card.right].some((choice) => choice.death === deathId),
      );
      expect(reachable, `特殊死法 ${deathId} 没有任何卡引用，玩家永远触达不到`).toBe(true);
    }
  });
});
