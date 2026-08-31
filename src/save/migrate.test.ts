/**
 * 存档迁移守卫（不变量 #2 升 L1）。
 * 不变量 #2：版本不匹配或结构损坏 → 安全降级为新档，禁止按新结构解析。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { freshSave, migrateSave, recordDeath, type SaveData } from './migrate';
import { SAVE_VERSION } from '../content/constants';
import { loadSave, writeSave, recordAndPersist } from './storage';

const KEY = 'spidey-regins:save';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('migrateSave（不变量 #2）', () => {
  it('版本缺失 / 版本不匹配 → 安全降级为新档', () => {
    expect(migrateSave(null).version).toBe(SAVE_VERSION);
    expect(migrateSave('这不是 JSON').version).toBe(SAVE_VERSION);
    expect(migrateSave({ version: 999 }).version).toBe(SAVE_VERSION);
    expect(migrateSave({}).version).toBe(SAVE_VERSION);
  });

  it('结构损坏（seenDeaths 非数组）不崩溃，seenDeaths 取空', () => {
    const result = migrateSave({ version: SAVE_VERSION, seenDeaths: 'oops' });
    expect(result.seenDeaths).toEqual([]);
    expect(result.version).toBe(SAVE_VERSION);
  });

  it('合法 v1 存档被原样保留（含 seenDeaths 与统计）', () => {
    const valid: SaveData = {
      version: SAVE_VERSION,
      seenDeaths: ['death-life-min', 'death-media-max'],
      reignsPlayed: 4,
      bestTurns: 17,
    };
    expect(migrateSave(valid)).toEqual(valid);
  });

  it('seenDeaths 里的非字符串项被过滤（防脏数据毒死解锁计算）', () => {
    const result = migrateSave({
      version: SAVE_VERSION,
      seenDeaths: ['death-life-min', 42, null, 'death-media-max'],
    });
    expect(result.seenDeaths).toEqual(['death-life-min', 'death-media-max']);
  });
});

describe('recordDeath（幂等与统计）', () => {
  it('重复死亡不重复计入 seenDeaths，但局数照加', () => {
    const base = freshSave();
    const once = recordDeath(base, 'death-life-min', 20);
    const twice = recordDeath(once, 'death-life-min', 12);
    expect(twice.seenDeaths).toEqual(['death-life-min']);
    expect(twice.reignsPlayed).toBe(2);
    expect(twice.bestTurns).toBe(12);
  });

  it('bestTurns 取最短一局', () => {
    const a = recordDeath(freshSave(), 'death-civilians-min', 30);
    const b = recordDeath(a, 'death-villains-max', 10);
    expect(b.bestTurns).toBe(10);
  });
});

describe('storage 往返（浏览器侧 IO）', () => {
  it('写后读回一致', () => {
    const data: SaveData = {
      version: SAVE_VERSION,
      seenDeaths: ['death-life-min'],
      reignsPlayed: 1,
      bestTurns: 9,
    };
    writeSave(data);
    expect(loadSave()).toEqual(data);
  });

  it('损坏的本地存储不抛错，降级为新档', () => {
    localStorage.setItem(KEY, '{这个 JSON 坏了');
    expect(loadSave().version).toBe(SAVE_VERSION);
  });

  it('记录死亡后存盘可在下次加载时读到（跨会话图鉴）', () => {
    const updated = recordAndPersist(freshSave(), 'death-civilians-min', 25);
    expect(updated.seenDeaths).toContain('death-civilians-min');
    expect(loadSave().seenDeaths).toContain('death-civilians-min');
  });
});
