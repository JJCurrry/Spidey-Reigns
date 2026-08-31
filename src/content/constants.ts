/**
 * 存档契约与展示用元数据。
 *
 * 不变量 #2：存档必须带 version；读取时版本不匹配 SAVE_VERSION 必须走迁移或安全降级，
 * 禁止直接按新结构解析 —— 进度丢失是本项目最严重且不可挽回的事故。
 */

import type { StatKey } from '../core/types';

/** 存档格式版本。结构变更时必须 +1，并同步实现迁移（M2 存档落地时）。 */
export const SAVE_VERSION = 1;

/** 四指标的中文展示名。顺序与 STAT_KEYS 一致。 */
export const STAT_LABELS: Record<StatKey, string> = {
  civilians: '市民',
  reputation: '声誉',
  order: '秩序',
  life: '生活',
};
