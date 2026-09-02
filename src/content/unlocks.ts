/**
 * 解锁档位（内容层）。M1 带解锁进度（用户裁决）：死亡累积到一定局数，解锁更多卡。
 *
 * 设计取舍（见 T-002 / ADR-0008 相关）：解锁按「累积死亡局数」分档，不做逐卡解锁——
 * 实现成本可控，且「每张卡恰好属于一个档位」可被 content.test.ts 机器校验。
 * 卡牌数据本身仍在 cards.ts；这里只描述「哪些卡属于哪一档」，避免动 types.ts（CLAUDE.md 地图约定）。
 *
 * 关键不变量：UNLOCK_TIERS 必须覆盖全部 CARDS id 且每个 id 只出现一次；
 * tier 0 的 minDeaths 必须为 0 且非空（否则首局无卡可抽）。由 content.test.ts 守卫。
 */

import { CARDS } from './cards';
import type { Card } from '../core/types';

export interface UnlockTier {
  readonly id: string;
  /** 累积死亡局数达到该值即解锁本档全部卡。 */
  readonly minDeaths: number;
  readonly cardIds: readonly string[];
}

export const UNLOCK_TIERS = [
  {
    id: 'tier-0-base',
    minDeaths: 0,
    cardIds: [
      'card-jjj-headline',
      'card-bank-robbery',
      'card-aunt-may',
      'card-webshooter-repair',
      'card-goblin-threat',
      'card-exhausted-vow',
      'card-quiet-night',
      'card-daily-bugle-scoop',
      'card-live-stream-duel',
      'card-protest-crowd',
      'card-save-cat',
      'card-tenant-eviction',
      'card-school-visit',
      'card-midtown-exam',
      'card-ned-friendship',
      'card-may-hospital',
      'card-birthday-alone',
      'card-rooftop-lunch',
      'card-fan-letter',
      'card-broken-grapple',
      'card-bodega-dog',
      'card-rain-patrol',
      'card-graffiti-tribute',
      'card-night-shift-nurse',
      'card-skateboard-kid',
      'card-old-photo',
    ],
  },
  {
    id: 'tier-1-first-blood',
    minDeaths: 1,
    cardIds: [
      'card-media-frenzy',
      'card-unmask-trap',
      'card-street-dealer',
      'card-villain-territory',
      'card-blackout',
      'card-ferry-crisis',
      'card-mayor-speech',
      'card-goblin-return',
      'card-civilians-worship',
      'card-media-invisible',
      'card-villains-cleared',
      'card-life-erased',
      'card-mj-rooftop',
      'card-traded-hero',
      'card-last-swing',
      'card-media-stardom',
      'card-media-silence',
      'card-villain-overlord',
      'card-villain-vacuum',
      'card-civilians-exodus',
    ],
  },
  {
    id: 'tier-2-villains',
    minDeaths: 2,
    cardIds: [
      'card-doc-ock-breakout',
      'card-kingpin-deal',
      'card-venom-symbiote',
      'card-venom-control',
      'card-goblin-finale',
      'card-mj-choice',
      'card-venom-legacy',
    ],
  },
  {
    id: 'tier-3-loose-ends',
    minDeaths: 3,
    cardIds: ['card-kingpin-betrayal', 'card-goblin-echo'],
  },
] as const satisfies readonly UnlockTier[];

/** 按「已死局数」算出当前应解锁的卡 id 集合。 */
export function unlockedCardIds(deathsSeen: number): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const tier of UNLOCK_TIERS) {
    if (deathsSeen >= tier.minDeaths) {
      for (const id of tier.cardIds) ids.add(id);
    }
  }
  return ids;
}

/** 当前可用卡组（已解锁且含兜底卡）。 */
export function availableCards(deathsSeen: number): readonly Card[] {
  const ids = unlockedCardIds(deathsSeen);
  return CARDS.filter((card) => ids.has(card.id));
}
