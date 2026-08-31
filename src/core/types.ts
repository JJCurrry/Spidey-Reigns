/**
 * 全仓类型契约的单一事实源。改这里等于改全仓，需走 ADR。
 * 术语以 docs/术语表.md 为准（尤其注意「指标」是双向倒计时，不是血条）。
 */

/**
 * 四指标键。**数组顺序即 UI 展示顺序，勿随意调整**。
 * 语义见 ADR-0008：市民 / 媒体 / 反派 / 私人生活，四者都是「外部势力 + 一个私人自我」。
 */
export const STAT_KEYS = ['civilians', 'media', 'villains', 'life'] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/**
 * 四指标。取值恒为 0–100 的整数（不变量 #3）。
 * 任一指标触及 0 或 100 都立即结束一局——满值和空值同样致命。
 */
export type Stats = Record<StatKey, number>;

/** 指标区间，闭区间；两端都可省略。 */
export interface StatRange {
  readonly min?: number;
  readonly max?: number;
}

/** 对四指标的一次性整数增减。不是 Buff/Debuff，无持续时间。 */
export type Effect = Partial<Record<StatKey, number>>;

/** 卡牌的一个分支。effect 必须至少影响一个指标（不变量 #5）。 */
export interface Choice {
  readonly text: string;
  readonly effect: Effect;
  /** 选择后追加的叙事文本 */
  readonly outcome?: string;
  /** 写入局内状态的标记，供后续 Condition 判定 */
  readonly flag?: string;
  /** 立即触发的结局 id，优先于指标越界判定 */
  readonly death?: string;
}

/**
 * 卡牌的出现条件——**布尔门禁，不是概率**。
 * 与「权重」是两回事：先过条件，再按权重抽（见 docs/术语表.md）。
 */
export interface Condition {
  readonly stats?: Partial<Record<StatKey, StatRange>>;
  /** 必须全部已存在 */
  readonly flags?: readonly string[];
  /** 必须全部不存在 */
  readonly withoutFlags?: readonly string[];
  /** 至少已进行的回合数 */
  readonly minTurn?: number;
}

/** 一次性事件卡：抽完即弃，不构成手牌。 */
export interface Card {
  readonly id: string;
  /** 说话者 / 场景标签 */
  readonly speaker?: string;
  readonly text: string;
  /** 相对抽取权重，默认 1。0 表示永不自然出现 */
  readonly weight?: number;
  /** true 表示同一局内最多出现一次 */
  readonly once?: boolean;
  /** 兜底卡：候选池为空时才使用，不参与常规抽取。全库至少一张 */
  readonly fallback?: boolean;
  readonly condition?: Condition;
  readonly left: Choice;
  readonly right: Choice;
}

export type Side = 'left' | 'right';

export interface Death {
  readonly id: string;
  readonly title: string;
  readonly text: string;
}

/** 一局的完整状态。不可变——所有变更返回新对象。 */
export interface ReignState {
  /** 随机种子。同种子 + 同操作序列 = 完全相同的一局（不变量 #1） */
  readonly seed: number;
  readonly stats: Stats;
  readonly turn: number;
  /** 局内标记，局终即清空 */
  readonly flags: readonly string[];
  readonly seenCardIds: readonly string[];
  readonly currentCardId: string | null;
}
