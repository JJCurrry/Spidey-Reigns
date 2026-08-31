/**
 * 存档迁移（纯函数，可测，不碰 localStorage）。
 *
 * 不变量 #2：存档必须带 version；读取时版本不匹配当前 SAVE_VERSION，
 * 必须走迁移或安全降级为新档，**禁止直接按新结构解析**。
 * 玩家进度丢失是不可挽回的最严重事故——所以「读坏 = 新档」而非「读坏 = 崩溃」。
 *
 * 当前只有 v1。未来加字段时：在 migrateSave 里按 version 分支补默认值，
 * 不要改 freshSave 的结构契约。
 */

import { SAVE_VERSION } from '../content/constants';

export interface SaveData {
  /** 当前存档格式版本。 */
  readonly version: number;
  /** 已触发过的结局 id（去重）。用于解锁进度与结局图鉴。 */
  readonly seenDeaths: readonly string[];
  /** 已进行的局数。 */
  readonly reignsPlayed: number;
  /** 最短一局回合数（0 表示尚无记录）。 */
  readonly bestTurns: number;
}

export function freshSave(): SaveData {
  return { version: SAVE_VERSION, seenDeaths: [], reignsPlayed: 0, bestTurns: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asStringArray(value: unknown): string[] {
  // 只保留字符串：非字符串项（number/null/object）一律丢弃，避免脏数据污染解锁计数。
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * 把任意来源（localStorage / 旧版本 / 损坏 JSON）的原始数据，规整成当前版本的存档。
 * 任何不满足「版本匹配 + 结构基本健全」的输入，一律安全降级为全新存档。
 */
export function migrateSave(raw: unknown): SaveData {
  if (!isRecord(raw) || raw.version !== SAVE_VERSION) {
    return freshSave();
  }
  return {
    version: SAVE_VERSION,
    seenDeaths: asStringArray(raw.seenDeaths),
    reignsPlayed:
      typeof raw.reignsPlayed === 'number' && Number.isFinite(raw.reignsPlayed)
        ? raw.reignsPlayed
        : 0,
    bestTurns:
      typeof raw.bestTurns === 'number' && Number.isFinite(raw.bestTurns) ? raw.bestTurns : 0,
  };
}

/** 记录一次死亡，返回更新后的存档（幂等于「seenDeaths 去重」）。 */
export function recordDeath(prev: SaveData, deathId: string, turns: number): SaveData {
  const seenDeaths = prev.seenDeaths.includes(deathId)
    ? prev.seenDeaths
    : [...prev.seenDeaths, deathId];
  const bestTurns = prev.bestTurns === 0 ? turns : Math.min(prev.bestTurns, turns);
  return {
    ...prev,
    seenDeaths,
    reignsPlayed: prev.reignsPlayed + 1,
    bestTurns,
  };
}
