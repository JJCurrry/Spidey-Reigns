/**
 * 震动层（UI 专属）。封装 navigator.vibrate，特性探测 + 异常吞掉，
 * 在不支持或非用户手势上下文里静默失败，不影响主流程。
 *
 * 与音效共用静音开关（在调用方用 isMuted() 判定），单一开关同时管音效与震动。
 */

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== 'function') return;
  try {
    nav.vibrate(pattern);
  } catch {
    // 不支持或非用户手势上下文，忽略。
  }
}
