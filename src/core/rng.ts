/**
 * 可注入、可重现的伪随机源（mulberry32）。
 *
 * 不变量 #1：全项目禁止裸调 Math.random() / Date，随机与时间源必须注入。
 * 理由：同种子必须重现同一局，否则卡牌平衡模拟、BUG 复现、回归测试全部失效。
 * 见 docs/adr/ADR-0004-随机与时间注入.md
 */

export interface Rng {
  /** [0, 1) 区间浮点数 */
  readonly next: () => number;
  /** [0, maxExclusive) 区间整数 */
  readonly int: (maxExclusive: number) => number;
}

const MULBERRY32_OFFSET = 0x6d2b79f5;
const UINT32 = 4294967296;

export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed)) {
    throw new RangeError(`种子必须是整数，收到：${String(seed)}`);
  }

  let state = seed >>> 0;

  const next = (): number => {
    state = (state + MULBERRY32_OFFSET) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };

  const int = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError(`int() 需要正整数上界，收到：${String(maxExclusive)}`);
    }
    return Math.floor(next() * maxExclusive);
  };

  return { next, int };
}
