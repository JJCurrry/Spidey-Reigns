/**
 * 种子来源（最外层注入点）。
 *
 * 不变量 #1：随机/时间源必须注入，禁止裸调 Math.random / Date.now。
 * UI 是「最外层」，这里用浏览器原生 crypto 产出种子，再一路注入到 core 的 Rng；
 * 不写进任何可追溯逻辑，core 依旧按种子重现（runReign 同种子同局）。
 */

/** 产出一个 32 位无符号整数种子。不使用 Math.random（ESLint 拦截）。 */
export function makeSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] ?? 0;
}
