/**
 * 成就派生单测（纯函数，无 React / 浏览器依赖）。
 * 验证：空存档全锁、满存档全解锁、局部存档部分解锁。
 */

import { describe, expect, it } from 'vitest';
import { achievementsFor } from '../achievements';
import { freshSave, type SaveData } from '../../save/migrate';
import { DEATHS } from '../deaths';

const allDeathIds = DEATHS.map((death) => death.id);

describe('achievementsFor（成就派生）', () => {
  it('空存档：所有成就未解锁（尚未完成第一局）', () => {
    const result = achievementsFor(freshSave());
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((achievement) => achievement.unlocked === false)).toBe(true);
  });

  it('满目击 + 百局 + 久活(bestTurns=100)：对应成就全部解锁（速死除外）', () => {
    const full: SaveData = {
      version: 1,
      seenDeaths: allDeathIds,
      reignsPlayed: 100,
      bestTurns: 100,
    };
    const byId = Object.fromEntries(achievementsFor(full).map((a) => [a.id, a.unlocked]));
    // 集齐 + 久活 + 百局 + 全部特殊死法可见
    expect(byId['ach-first-reign']).toBe(true);
    expect(byId['ach-eight']).toBe(true);
    expect(byId['ach-codex']).toBe(true);
    expect(byId['ach-marathon']).toBe(true);
    expect(byId['ach-veteran']).toBe(true);
    expect(byId['ach-unmasked']).toBe(true);
    expect(byId['ach-hero-falls']).toBe(true);
    expect(byId['ach-exhausted']).toBe(true);
    expect(byId['ach-traded']).toBe(true);
    expect(byId['ach-last-swing']).toBe(true);
    expect(byId['ach-public-shame']).toBe(true);
    // 速死与久活互斥（bestTurns 不能既 ≤12 又 ≥80）
    expect(byId['ach-speed']).toBe(false);
  });

  it('速死成就：bestTurns ≤ 12 时解锁，≥ 80 时锁定', () => {
    const fast: SaveData = { version: 1, seenDeaths: [], reignsPlayed: 1, bestTurns: 10 };
    expect(achievementsFor(fast).find((a) => a.id === 'ach-speed')?.unlocked).toBe(true);
    const slow: SaveData = { version: 1, seenDeaths: [], reignsPlayed: 1, bestTurns: 100 };
    expect(achievementsFor(slow).find((a) => a.id === 'ach-speed')?.unlocked).toBe(false);
  });

  it('局部存档：对应成就解锁，其余仍锁', () => {
    const save: SaveData = {
      version: 1,
      seenDeaths: ['death-unmasked'],
      reignsPlayed: 1,
      bestTurns: 5,
    };
    const byId = Object.fromEntries(achievementsFor(save).map((a) => [a.id, a.unlocked]));
    expect(byId['ach-unmasked']).toBe(true); // 见过该死法
    expect(byId['ach-first-reign']).toBe(true); // 已玩过至少一局
    expect(byId['ach-speed']).toBe(true); // bestTurns 5 ≤ 12
    expect(byId['ach-codex']).toBe(false); // 未集齐全部结局
    expect(byId['ach-traded']).toBe(false); // 未触发「交换」
  });
});
