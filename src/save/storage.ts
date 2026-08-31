/**
 * localStorage 读写（浏览器侧）。纯逻辑都在 migrate.ts，这里只做 IO 与异常兜底。
 * 任何读取异常都降级为 freshSave（不变量 #2）；任何写入异常静默吞掉，
 * 不阻断游戏——存档是加分项，绝不是让一局玩不下去的理由。
 */

import { migrateSave, recordDeath, freshSave, type SaveData } from './migrate';

const STORAGE_KEY = 'spidey-regins:save';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return migrateSave(raw === null ? null : JSON.parse(raw));
  } catch {
    return freshSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 隐私模式 / 配额满：忽略，本局照常进行。
  }
}

/** 记录一次死亡并存盘，返回最新存档。 */
export function recordAndPersist(prev: SaveData, deathId: string, turns: number): SaveData {
  const next = recordDeath(prev, deathId, turns);
  writeSave(next);
  return next;
}
