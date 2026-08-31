/**
 * 成就派生（纯函数，内容层）。
 *
 * 设计取舍（见 docs/工单/T-004-机制延伸.md 的 ASSUMPTION-ACHIEVE-PURE）：
 * 成就不持久化、纯由 `SaveData` 派生，因此**不 bump `SAVE_VERSION`**、不碰 localStorage。
 * 现有 `seenDeaths` / `reignsPlayed` / `bestTurns` 已足以表达全部成就；若日后要新增
 * 「需跨局累计的成就维度」，再开新工单升版本（见 不变量 #2 / docs/地图.md 的 migrate 入口）。
 *
 * 本文件不依赖 React / 浏览器全局，可被单测与未来的平衡工具直接复用。
 */

import { DEATHS } from './deaths';
import type { SaveData } from '../save/migrate';

export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly unlocked: boolean;
}

/** 四指标 × 双向 = 8 个边界结局。集齐它们是一个独立成就。 */
const BOUNDARY_IDS = [
  'death-civilians-min',
  'death-civilians-max',
  'death-media-min',
  'death-media-max',
  'death-villains-min',
  'death-villains-max',
  'death-life-min',
  'death-life-max',
] as const;

/** 从存档派生全部成就（已解锁 / 未解锁）。纯函数，无副作用。 */
export function achievementsFor(save: SaveData): readonly Achievement[] {
  const seen = new Set(save.seenDeaths);
  const has = (id: string): boolean => seen.has(id);
  const allBoundary = BOUNDARY_IDS.every(has);
  const fullCodex = DEATHS.every((death) => has(death.id));

  return [
    {
      id: 'ach-first-reign',
      title: '初尝终局',
      description: '完成你的第一局游戏。',
      unlocked: save.reignsPlayed >= 1,
    },
    {
      id: 'ach-eight',
      title: '八荒归一',
      description: '集齐全部八种边界结局。',
      unlocked: allBoundary,
    },
    {
      id: 'ach-codex',
      title: '图鉴大成',
      description: '发现所有已知结局。',
      unlocked: fullCodex,
    },
    {
      id: 'ach-speed',
      title: '速死',
      description: `最短一局不超过 12 回合（当前最佳 ${save.bestTurns}）。`,
      unlocked: save.bestTurns > 0 && save.bestTurns <= 12,
    },
    {
      id: 'ach-marathon',
      title: '长治久安',
      description: '最短一局至少 80 回合。',
      unlocked: save.bestTurns >= 80,
    },
    {
      id: 'ach-veteran',
      title: '百战老兵',
      description: '累计游玩 100 局。',
      unlocked: save.reignsPlayed >= 100,
    },
    {
      id: 'ach-unmasked',
      title: '面具之下',
      description: '触发「面具落地」。',
      unlocked: has('death-unmasked'),
    },
    {
      id: 'ach-hero-falls',
      title: '坠落',
      description: '触发「坠落的英雄」。',
      unlocked: has('death-hero-falls'),
    },
    {
      id: 'ach-exhausted',
      title: '力竭',
      description: '触发「力竭」。',
      unlocked: has('death-exhausted-vow'),
    },
    {
      id: 'ach-traded',
      title: '交换',
      description: '触发「交换」。',
      unlocked: has('death-traded-places'),
    },
    {
      id: 'ach-last-swing',
      title: '最后一荡',
      description: '触发「最后一荡」。',
      unlocked: has('death-last-swing'),
    },
    {
      id: 'ach-public-shame',
      title: '全民围观',
      description: '触发「全民围观」。',
      unlocked: has('death-public-shame'),
    },
  ];
}
