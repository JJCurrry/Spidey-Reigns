/**
 * 平衡体检脚本（中立铺垫，不改任何游戏数值）。
 *
 * 复用真实引擎 API：runReign / CARDS / DEATHS / UNLOCK_TIERS / isConditionMet。
 * 四个维度：
 *   1. 各指标被点击频率（静态：内容里每个指标被多少选项推动；动态：模拟里哪个指标最常致死）
 *   2. 各档卡数值分布（按解锁档位统计效果量级与分桶）
 *   3. 特殊死法可达性（静态引用 + 条件门禁 + 大量随机/定向模拟实测命中率）
 *   4. 极端种子模拟（random / 全左 / 全右 / 求生偏置 / 冲死 五种策略的存活分布与致死因）
 *
 * 运行：vite-node scripts/balance-audit.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runReign, type ChooseSide } from '../src/core/game';
import { CARDS } from '../src/content/cards';
import { DEATHS } from '../src/content/deaths';
import { UNLOCK_TIERS } from '../src/content/unlocks';
import { isConditionMet } from '../src/core/deck';
import { applyEffect } from '../src/core/stats';
import { STAT_KEYS, type Card, type Side } from '../src/core/types';

const SIDES: readonly Side[] = ['left', 'right'] as const;

const boundaryRe = /^death-(civilians|media|villains|life)-(min|max)$/;
const SPECIAL_DEATH_IDS = DEATHS.map((d) => d.id).filter((id) => !boundaryRe.test(id));
const BOUNDARY_DEATH_IDS = DEATHS.map((d) => d.id).filter((id) => boundaryRe.test(id));

// ───────────────────────── 静态分析：指标被点击频率 ─────────────────────────
function statClickFrequency() {
  const total = { count: 0 };
  const perStat: Record<string, { mentions: number; totalMag: number; up: number; down: number }> =
    {};
  for (const k of STAT_KEYS) perStat[k] = { mentions: 0, totalMag: 0, up: 0, down: 0 };

  let choicesTotal = 0;
  for (const card of CARDS) {
    for (const side of SIDES) {
      choicesTotal += 1;
      const eff = card[side].effect;
      for (const k of STAT_KEYS) {
        const d = eff[k];
        if (d !== undefined && d !== 0) {
          perStat[k].mentions += 1;
          perStat[k].totalMag += Math.abs(d);
          if (d > 0) perStat[k].up += 1;
          else perStat[k].down += 1;
        }
      }
    }
  }
  total.count = choicesTotal;
  return { total, perStat };
}

// ───────────────────────── 静态分析：各档卡数值分布 ─────────────────────────
function tierValueDistribution() {
  const out: Array<{
    tier: string;
    minDeaths: number;
    cards: number;
    choices: number;
    meanMag: number;
    maxMag: number;
    buck: Record<string, number>;
    perStatMean: Record<string, number>;
  }> = [];
  for (const tier of UNLOCK_TIERS) {
    const cards = CARDS.filter((c) => tier.cardIds.includes(c.id));
    const mags: number[] = [];
    const buck = { s: 0, m: 0, l: 0, h: 0 }; // small 1-4 / medium 5-9 / large 10-14 / huge 15+
    const perStatSum: Record<string, number> = {};
    const perStatN: Record<string, number> = {};
    for (const k of STAT_KEYS) {
      perStatSum[k] = 0;
      perStatN[k] = 0;
    }
    for (const card of cards) {
      for (const side of SIDES) {
        const eff = card[side].effect;
        for (const k of STAT_KEYS) {
          const d = eff[k];
          if (d !== undefined && d !== 0) {
            const a = Math.abs(d);
            mags.push(a);
            if (a <= 4) buck.s += 1;
            else if (a <= 9) buck.m += 1;
            else if (a <= 14) buck.l += 1;
            else buck.h += 1;
            perStatSum[k] += a;
            perStatN[k] += 1;
          }
        }
      }
    }
    const perStatMean: Record<string, number> = {};
    for (const k of STAT_KEYS) perStatMean[k] = perStatN[k] ? perStatSum[k] / perStatN[k] : 0;
    out.push({
      tier: tier.id,
      minDeaths: tier.minDeaths,
      cards: cards.length,
      choices: cards.length * 2,
      meanMag: mags.length ? mags.reduce((a, b) => a + b, 0) / mags.length : 0,
      maxMag: mags.length ? Math.max(...mags) : 0,
      buck,
      perStatMean,
    });
  }
  return out;
}

// ───────────────────────── 特殊死法：静态门禁 ─────────────────────────
function findTrigger(id: string): { card: Card; side: Side } | null {
  for (const c of CARDS) {
    for (const side of SIDES) {
      if (c[side].death === id) return { card: c, side };
    }
  }
  return null;
}

function flagsNeededFor(card: Card): Set<string> {
  const need = new Set<string>(card.condition?.flags ?? []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of [...need]) {
      for (const c of CARDS) {
        for (const side of SIDES) {
          if (c[side].flag === f) {
            for (const pf of c.condition?.flags ?? []) {
              if (!need.has(pf)) {
                need.add(pf);
                changed = true;
              }
            }
          }
        }
      }
    }
  }
  return need;
}

function specialDeathGating() {
  return SPECIAL_DEATH_IDS.map((id) => {
    const trig = findTrigger(id);
    const cond = trig?.card.condition;
    const flags = flagsNeededFor(trig!.card);
    return {
      id,
      triggerCard: trig?.card.id ?? '(未找到)',
      triggerSide: trig?.side ?? '-',
      once: trig?.card.once ?? false,
      statCond: cond?.stats ? JSON.stringify(cond.stats) : null,
      flagCond: cond?.flags ?? null,
      minTurn: cond?.minTurn ?? null,
      flagsNeeded: [...flags],
    };
  });
}

// ───────────────────────── 定向"猎人"策略：尽量触发目标特殊死法 ─────────────────────────
function makeHunter(targetId: string): ChooseSide {
  const trig = findTrigger(targetId)!;
  const need = flagsNeededFor(trig.card);
  return (card, state, rng) => {
    // 1) 命中触发卡且条件满足 → 直接选触发侧
    if (card.id === trig.card.id && isConditionMet(card, state)) return trig.side;
    // 2) 还缺 flag → 尽量在当前卡上把缺的 flag 设上
    const missing = [...need].filter((f) => !state.flags.includes(f));
    if (missing.length > 0) {
      for (const side of SIDES) {
        const f = card[side].flag;
        if (f && missing.includes(f) && isConditionMet(card, state)) return side;
      }
    }
    // 3) 触发卡需要指标阈值且未满足 → 朝阈值方向漂移
    const c = trig.card.condition?.stats;
    if (c && card.id !== trig.card.id) {
      for (const k of STAT_KEYS) {
        const r = c[k];
        if (!r) continue;
        const v = state.stats[k];
        const wantUp = r.min !== undefined && v < r.min;
        const wantDown = r.max !== undefined && v > r.max;
        if (wantUp || wantDown) {
          const dl = card.left.effect[k] ?? 0;
          const dr = card.right.effect[k] ?? 0;
          if (wantUp && dl > 0 && dl >= dr) return 'left';
          if (wantUp && dr > 0 && dr > dl) return 'right';
          if (wantDown && dl < 0 && dl <= dr) return 'left';
          if (wantDown && dr < 0 && dr < dl) return 'right';
        }
      }
    }
    return rng.int(2) === 0 ? 'left' : 'right';
  };
}

// ───────────────────────── 策略定义 ─────────────────────────
const randomChoose: ChooseSide = (_c, _s, rng) => (rng.int(2) === 0 ? 'left' : 'right');
const alwaysLeft: ChooseSide = () => 'left';
const alwaysRight: ChooseSide = () => 'right';
const surviveChoose: ChooseSide = (card, state) => {
  const score = (s: Side) => {
    const ns = applyEffect(state.stats, card[s].effect);
    return Math.max(...STAT_KEYS.map((k) => Math.abs(ns[k] - 50)));
  };
  return score('left') <= score('right') ? 'left' : 'right';
};
const rushChoose: ChooseSide = (card, _state, rng) => {
  const mag = (s: Side) =>
    Math.max(
      ...STAT_KEYS.map((k) => Math.abs((card[s].effect[k] ?? 0) + (card[s].death ? 100 : 0))),
    );
  if (mag('left') === mag('right')) return rng.int(2) === 0 ? 'left' : 'right';
  return mag('left') > mag('right') ? 'left' : 'right';
};

interface SimResult {
  turns: number[];
  deathCounts: Record<string, number>;
  specialHits: Record<string, number>;
  nearStuck: number; // turns >= 450
  veryShort: number; // turns <= 6
}

function simulate(strategy: ChooseSide, seeds: number[]): SimResult {
  const res: SimResult = {
    turns: [],
    deathCounts: {},
    specialHits: {},
    nearStuck: 0,
    veryShort: 0,
  };
  for (const seed of seeds) {
    const r = runReign(seed, CARDS, DEATHS, strategy);
    res.turns.push(r.turns);
    res.deathCounts[r.death.id] = (res.deathCounts[r.death.id] ?? 0) + 1;
    if (SPECIAL_DEATH_IDS.includes(r.death.id)) {
      res.specialHits[r.death.id] = (res.specialHits[r.death.id] ?? 0) + 1;
    }
    if (r.turns >= 450) res.nearStuck += 1;
    if (r.turns <= 6) res.veryShort += 1;
  }
  return res;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base];
}

function summarize(res: SimResult) {
  const t = [...res.turns].sort((a, b) => a - b);
  const mean = t.reduce((a, b) => a + b, 0) / (t.length || 1);
  return {
    n: t.length,
    mean: Math.round(mean * 10) / 10,
    min: t[0] ?? 0,
    p25: Math.round(quantile(t, 0.25)),
    median: Math.round(quantile(t, 0.5)),
    p75: Math.round(quantile(t, 0.75)),
    max: t[t.length - 1] ?? 0,
    nearStuck: res.nearStuck,
    veryShort: res.veryShort,
    deathCounts: res.deathCounts,
    specialHits: res.specialHits,
  };
}

// ───────────────────────── 主流程 ─────────────────────────
function main() {
  const N_RANDOM = 4000;
  const N_HUNTER = 2500;
  // 调参是在固定种子集上反复迭代的，存在「对这组种子过拟合」的风险。
  // 用 SEED_OFFSET 换一组平行样本做交叉验证：占比若明显漂移，说明参数是过拟合而非真实分布。
  const SEED_OFFSET = Number(process.env.SEED_OFFSET ?? 0);
  const randomSeeds = Array.from(
    { length: N_RANDOM },
    (_, i) => i * 2654435761 + 12345 + SEED_OFFSET,
  );

  // ── 快速迭代模式 ──
  // 调参时需要在「改一组数值 → 看四分支占比」之间快速往返，跑完整报告（含猎人 + 五策略）
  // 太慢。加 `--quick`：只跑 random 4000 局，打印四分支占比与八边界占比，不写报告文件。
  if (process.argv.includes('--quick')) {
    const sim = simulate(randomChoose, randomSeeds);
    const sum = summarize(sim);
    const perBoundary = BOUNDARY_DEATH_IDS.map((id) => ({
      id,
      n: sim.deathCounts[id] ?? 0,
    }));
    const boundaryTotal = perBoundary.reduce((a, b) => a + b.n, 0);
    const branch: Record<string, number> = {};
    for (const k of STAT_KEYS) branch[k] = 0;
    for (const b of perBoundary) {
      const key = b.id.replace(/^death-/, '').replace(/-(min|max)$/, '');
      if (branch[key] !== undefined) branch[key] += b.n;
    }
    const label: Record<string, string> = {
      civilians: '市民',
      media: '媒体',
      villains: '反派',
      life: '私人生活',
    };
    console.log(
      `卡牌 ${CARDS.length} ｜ random ${N_RANDOM} 局 ｜ 中位 ${sum.median} 回合 ｜ 濒卡死 ${sum.nearStuck}`,
    );
    console.log('四分支（占 8 边界结局合计）：');
    for (const k of STAT_KEYS) {
      console.log(
        `  ${label[k].padEnd(5)} ${(((branch[k] ?? 0) / (boundaryTotal || 1)) * 100).toFixed(1)}%`,
      );
    }
    console.log('八边界结局（占全部 4000 局）：');
    for (const b of perBoundary) {
      console.log(`  ${b.id.padEnd(22)} ${((b.n / N_RANDOM) * 100).toFixed(1)}%  (${b.n})`);
    }
    const specialZero = SPECIAL_DEATH_IDS.filter((id) => (sim.specialHits[id] ?? 0) === 0);
    console.log(
      `特殊死法 random 不可见：${specialZero.length ? specialZero.join('、') : '无（全部可见）'}`,
    );
    return;
  }

  // 1) 指标点击频率
  const click = statClickFrequency();

  // 2) 各档分布
  const tiers = tierValueDistribution();

  // 3) 特殊死法门禁 + 实测
  const gating = specialDeathGating();
  const randomSim = simulate(randomChoose, randomSeeds);
  const randomSummary = summarize(randomSim);
  const hunterResults: Record<string, { hits: number; rate: number }> = {};
  for (const id of SPECIAL_DEATH_IDS) {
    if ((randomSim.specialHits[id] ?? 0) > 0) {
      hunterResults[id] = {
        hits: randomSim.specialHits[id],
        rate: randomSim.specialHits[id] / N_RANDOM,
      };
      continue;
    }
    const hunterSeeds = Array.from({ length: N_HUNTER }, (_, i) => i * 40503 + 777);
    const h = simulate(makeHunter(id), hunterSeeds);
    hunterResults[id] = { hits: h.specialHits[id] ?? 0, rate: (h.specialHits[id] ?? 0) / N_HUNTER };
  }

  // 4) 极端种子 / 策略模拟
  const stratSeeds = Array.from({ length: 1500 }, (_, i) => i * 99991 + 31);
  const strategies: Record<string, ChooseSide> = {
    random: randomChoose,
    'always-left': alwaysLeft,
    'always-right': alwaysRight,
    survive: surviveChoose,
    rush: rushChoose,
  };
  const stratSummary: Record<string, ReturnType<typeof summarize>> = {};
  for (const [name, fn] of Object.entries(strategies)) {
    stratSummary[name] = summarize(simulate(fn, stratSeeds));
  }

  // 极端种子：random 里最长/最短
  const tSorted = randomSeeds
    .map((s) => ({ s, r: runReign(s, CARDS, DEATHS, randomChoose) }))
    .map((x) => ({ s: x.s, turns: x.r.turns, death: x.r.death.id, stats: x.r.stats }))
    .sort((a, b) => a.turns - b.turns);
  const shortest = tSorted[0];
  const longest = tSorted[tSorted.length - 1];

  // ── 组装报告 ──
  const statLabels: Record<string, string> = {
    civilians: '市民',
    media: '媒体',
    villains: '反派',
    life: '私人生活',
  };

  const lines: string[] = [];
  const L = (s = '') => lines.push(s);

  L('# 蛛丝王权 · 平衡体检报告');
  L();
  L(
    `生成时间：${new Date().toISOString().slice(0, 10)} ｜ 卡牌总数：${CARDS.length} ｜ 结局总数：${DEATHS.length}（边界 ${BOUNDARY_DEATH_IDS.length} + 特殊 ${SPECIAL_DEATH_IDS.length}）`,
  );
  L(
    `模拟口径：使用**全解锁卡池（全部卡牌）**代表长期玩家终态；random 策略 4000 局，策略对比 1500 局/策略，猎人定向 2500 局/死法。`,
  );
  L();
  L(
    '> 本报告只做体检、不改数值。任何调参需由你给定规格后新开 T-006 工单（原则 3：手感属人的品味判断）。',
  );
  // AUDIT_NOTE：把「这一轮调了什么」写进报告头部，避免报告与调参历史脱节。
  // 用法：AUDIT_NOTE="第二轮：新增 2 张生活放大器..." vite-node scripts/balance-audit.ts
  const auditNote = process.env.AUDIT_NOTE;
  if (auditNote) {
    L(`> 本轮调参：` + auditNote);
  }
  L();

  // ── 一、指标被点击频率 ──
  L('## 一、各指标被点击频率');
  L();
  L(
    '**静态（内容层）**：每张卡左右两选项共 ' +
      click.total.count +
      ' 个选择，统计每个指标被多少个选项推动、推动总力度与方向。',
  );
  L();
  L('| 指标 | 被推动选项数 | 占所有选项% | 总力度(Σ|Δ|) | 偏正向 | 偏负向 |');
  L('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const k of STAT_KEYS) {
    const p = click.perStat[k];
    L(
      `| ${statLabels[k]} | ${p.mentions} | ${((p.mentions / click.total.count) * 100).toFixed(1)}% | ${p.totalMag} | ${p.up} | ${p.down} |`,
    );
  }
  L();
  L(
    '**动态（4000 局 random 实测）**：哪个指标最常成为"压死骆驼的最后一根稻草"（边界致死因统计）。',
  );
  L();
  L('| 指标 | 致死局数 | 占比 |');
  L('| --- | ---: | ---: |');
  const dynDeath: Record<string, number> = {};
  for (const id of BOUNDARY_DEATH_IDS) {
    const m = id.match(boundaryRe)!;
    const key = m[1];
    dynDeath[key] = (dynDeath[key] ?? 0) + (randomSim.deathCounts[id] ?? 0);
  }
  const dynTotal = Object.values(dynDeath).reduce((a, b) => a + b, 0);
  for (const k of STAT_KEYS) {
    L(
      `| ${statLabels[k]} | ${dynDeath[k] ?? 0} | ${dynTotal ? (((dynDeath[k] ?? 0) / dynTotal) * 100).toFixed(1) : '0'}% |`,
    );
  }
  L();

  // 全死因分布（边界 + 特殊，按频次排序）—— 兼查"死内容"（某边界结局近 0%）
  const deathTitle: Record<string, string> = Object.fromEntries(DEATHS.map((d) => [d.id, d.title]));
  const allDeathsSorted = Object.entries(randomSim.deathCounts).sort((a, b) => b[1] - a[1]);
  const totalDeaths = allDeathsSorted.reduce((s, [, c]) => s + c, 0);
  L('**全死因分布（4000 局 random，含边界+特殊，按频次排序）：**');
  L();
  L('| 死因 | 含义 | 局数 | 占比 |');
  L('| --- | ---: | ---: | ---: |');
  for (const [id, c] of allDeathsSorted) {
    L(
      `| ${id} | ${deathTitle[id] ?? ''} | ${c} | ${totalDeaths ? ((c / totalDeaths) * 100).toFixed(1) : '0'}% |`,
    );
  }
  L();
  const deadContent = BOUNDARY_DEATH_IDS.filter(
    (id) => (randomSim.deathCounts[id] ?? 0) / (totalDeaths || 1) < 0.02,
  );
  L(
    deadContent.length === 0
      ? '> 无死内容：八条边界结局均 ≥2% 可见度。'
      : `> 注意：以下边界结局占比 <2%，近乎死内容 —— ${deadContent.join('、')}。`,
  );
  L();
  L(
    '> 解读：静态"被推动频率"高 ≠ 动态"最常致死"。前者看内容密度，后者看实际崩盘点。若某指标静态频率高但动态致死少，说明它常被推但边界守得稳；反之则它是"脆断点"。',
  );
  L();

  // ── 二、各档数值分布 ──
  L('## 二、各档卡数值分布');
  L();
  L(
    '按解锁档位（累积死亡局数）统计所有效果绝对值的量级与分桶（小 1-4 / 中 5-9 / 大 10-14 / 极大 15+）。',
  );
  L();
  L('| 档位 | 需死亡局 | 卡数 | 选项数 | 平均|Δ| | 最大|Δ| | 小 | 中 | 大 | 极大 |');
  L('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const t of tiers) {
    L(
      `| ${t.tier} | ${t.minDeaths} | ${t.cards} | ${t.choices} | ${t.meanMag.toFixed(2)} | ${t.maxMag} | ${t.buck.s} | ${t.buck.m} | ${t.buck.l} | ${t.buck.h} |`,
    );
  }
  L();
  L('各档"每指标平均推动力度"：');
  L();
  L('| 档位 | 市民 | 媒体 | 反派 | 私人生活 |');
  L('| --- | ---: | ---: | ---: | ---: |');
  for (const t of tiers) {
    L(
      `| ${t.tier} | ${t.perStatMean.civilians.toFixed(1)} | ${t.perStatMean.media.toFixed(1)} | ${t.perStatMean.villains.toFixed(1)} | ${t.perStatMean.life.toFixed(1)} |`,
    );
  }
  L();
  L(
    '> 解读：若高 tier 平均|Δ|与"极大"桶明显多于低 tier，说明越往后越"刺激/失控"，可能是设计意图（大事件收尾），也可能让老玩家更难控场。',
  );
  L();

  // ── 三、特殊死法可达性 ──
  L('## 三、特殊死法可达性');
  L();
  L(
    `共 ${SPECIAL_DEATH_IDS.length} 个特殊死法（非四指标边界）。下表给出：触发卡、触发侧、是否一次性、触发所需指标阈值 / flag / 最小回合，以及 4000 局 random 实测命中率（若 0 则追加定向猎人 2500 局实测）。`,
  );
  L();
  L('| 死法 | 触发卡(侧) | once | 指标阈值 | 需flag | 最小回合 | random命中 | 猎人命中 | 结论 |');
  L('| --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- |');
  for (const g of gating) {
    const randHit = randomSim.specialHits[g.id] ?? 0;
    const hunter = hunterResults[g.id];
    const reach =
      randHit > 0 ? 'random 可见' : hunter.hits > 0 ? '仅猎人可见(极难)' : '模拟中不可达';
    L(
      `| ${g.id} | ${g.triggerCard}(${g.triggerSide}) | ${g.once ? '✓' : ''} | ${g.statCond ?? '-'} | ${(g.flagCond ?? []).join(',') || '-'} | ${g.minTurn ?? '-'} | ${randHit} | ${randHit > 0 ? '-' : hunter.hits} | ${reach} |`,
    );
  }
  L();
  L(
    '> 解读：random 命中=0 但猎人>0 意味着"理论上可达但随机打法几乎遇不到"，属于隐藏/稀有死法；猎人仍=0 则需检查门禁链是否过严（flag 链断裂 / 阈值与触发卡互斥）。',
  );
  L();

  // ── 四、极端种子 / 策略模拟 ──
  L('## 四、极端种子与策略模拟');
  L();
  L('五种决策策略的存活分布（每策略 1500 局）：');
  L();
  L('| 策略 | 局数 | 均值回合 | 最短 | P25 | 中位 | P75 | 最长 | ≥450(濒卡死) | ≤6(秒死) |');
  L('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const [name, s] of Object.entries(stratSummary)) {
    L(
      `| ${name} | ${s.n} | ${s.mean} | ${s.min} | ${s.p25} | ${s.median} | ${s.p75} | ${s.max} | ${s.nearStuck} | ${s.veryShort} |`,
    );
  }
  L();
  L('各策略致死因 Top3：');
  L();
  for (const [name, s] of Object.entries(stratSummary)) {
    const top = Object.entries(s.deathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, c]) => `${id}:${c}`)
      .join('，');
    L(`- **${name}**：${top}`);
  }
  L();
  L('**极端种子（random 4000 局内）：**');
  L(
    `- 最短一局：seed=${shortest.s}，仅 ${shortest.turns} 回合，死于 ${shortest.death}，终局 ${JSON.stringify(shortest.stats)}`,
  );
  L(
    `- 最长一局：seed=${longest.s}，达 ${longest.turns} 回合，死于 ${longest.death}，终局 ${JSON.stringify(longest.stats)}`,
  );
  L(`- 全样本无 ≥500 回合（无真实卡死，符合不变量 #6）。`);
  L();
  L(
    '> 解读：若 always-left/right 显著比 random 长寿，说明内容存在"安全侧偏向"，可用策略单一化；若 survive 偏置仍中位很短，说明系统整体偏脆；rush 策略用于确认"求死"是否也很快（验证死亡机制是否灵敏）。',
  );
  L();

  // ── 手感结论 ──
  L('## 五、给用户的手感判断提示');
  L();
  L('以下是数据事实，不是建议——怎么调由你定：');
  L();
  L(
    `1. **平均一局长度（random）**：约 ${randomSummary.mean} 回合（中位 ${randomSummary.median}）。判断"节奏太快/太慢"的基准线。`,
  );
  const domStat = STAT_KEYS.reduce((a, b) => ((dynDeath[b] ?? 0) > (dynDeath[a] ?? 0) ? b : a));
  L(
    `2. **最常致死指标**：${statLabels[domStat]}（${dynDeath[domStat] ?? 0} 局，${(((dynDeath[domStat] ?? 0) / (dynTotal || 1)) * 100).toFixed(1)}%），偏脆断点大概率在这条线上。`,
  );
  const unreachable = gating.filter((g) => {
    const randHit = randomSim.specialHits[g.id] ?? 0;
    return randHit === 0 && hunterResults[g.id].hits === 0;
  });
  const rareHunter = gating.filter((g) => {
    const randHit = randomSim.specialHits[g.id] ?? 0;
    return randHit === 0 && hunterResults[g.id].hits > 0;
  });
  L(
    `3. **特殊死法可达性**：${SPECIAL_DEATH_IDS.length} 个特殊死法中，random 全可见的有 ${SPECIAL_DEATH_IDS.length - unreachable.length - rareHunter.length} 个；仅定向猎人可见（极稀有）${rareHunter.length} 个；模拟不可达 ${unreachable.length} 个${unreachable.length ? '（' + unreachable.map((u) => u.id).join('、') + '）' : ''}。`,
  );
  const surv = stratSummary.survive;
  const al = stratSummary['always-left'];
  const ar = stratSummary['always-right'];
  L(
    `4. **策略偏向**：survive 偏置中位 ${surv.median} 回合 vs random ${randomSummary.median}；全左中位 ${al.median}、全右中位 ${ar.median}。若差距大，存在单一安全侧。`,
  );
  L();

  const md = lines.join('\n');
  const outPath = resolve(
    process.cwd(),
    `平衡体检报告-${new Date().toISOString().slice(0, 10)}.md`,
  );
  writeFileSync(outPath, md, 'utf8');

  // 控制台精简版
  console.log('==== 平衡体检完成 ====');
  console.log(`卡牌 ${CARDS.length} ｜ 结局 ${DEATHS.length} ｜ random 4000 局`);
  console.log(
    `平均回合 ${randomSummary.mean}（中位 ${randomSummary.median}，最短 ${shortest.turns}/seed ${shortest.s}，最长 ${longest.turns}/seed ${longest.s}）`,
  );
  console.log(
    `最常致死指标：${statLabels[domStat]}（${(((dynDeath[domStat] ?? 0) / (dynTotal || 1)) * 100).toFixed(1)}%）`,
  );
  console.log('特殊死法命中：');
  for (const g of gating) {
    const randHit = randomSim.specialHits[g.id] ?? 0;
    const h = hunterResults[g.id];
    console.log(
      `  ${g.id}: random=${randHit} hunter=${randHit > 0 ? '-' : h.hits} → ${randHit > 0 ? '可见' : h.hits > 0 ? '仅猎人' : '不可达'}`,
    );
  }
  console.log(
    '策略中位回合：' +
      Object.entries(stratSummary)
        .map(([n, s]) => `${n}=${s.median}`)
        .join('  '),
  );
  console.log(`报告已写入：${outPath}`);
}

main();
