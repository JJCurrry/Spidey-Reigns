/**
 * 音效层（UI 专属，不触碰 src/core）。
 *
 * 设计要点：
 * - 全部音效由 Web Audio API **运行时合成**（oscillator + 增益包络），不新增任何音频素材文件，
 *   规避 ADR-0007 的漫威素材红线、零加载成本、零 IP 风险。
 * - 浏览器自动播放策略要求 AudioContext 在用户手势后才能出声；本模块在每次 play* 时惰性创建/
 *   恢复 context，首次手势（开始游戏 / 第一次滑动）即解锁。
 * - 静音开关持久化到 localStorage['sr.muted']，默认未静音、即时生效；音效与震动共用此开关。
 */

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sr.muted';

function readMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function isMuted(): boolean {
  return readMuted();
}

export function setMuted(muted: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  }
}

export function toggleMuted(): boolean {
  const next = !readMuted();
  setMuted(next);
  return next;
}

/** 静音状态 + 切换函数，供组件订阅（持久化在模块层，不重复存）。 */
export function useMuted(): [boolean, () => void] {
  const [muted, setMutedState] = useState(isMuted);
  const toggle = useCallback(() => setMutedState(toggleMuted()), []);
  return [muted, toggle];
}

// ───────────────────────── Web Audio 合成 ─────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) return null;
  if (ctx === null) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  readonly freqStart: number;
  readonly freqEnd?: number;
  readonly duration: number;
  readonly type?: OscillatorType;
  readonly peak?: number;
  readonly delay?: number;
}

/** 单个包络音：频率从 freqStart 滑到 freqEnd，增益快速起音再衰减到静音。 */
function tone(opts: ToneOpts): void {
  const ac = getCtx();
  if (ac === null) return;
  const { freqStart, freqEnd = freqStart, duration, type = 'sine', peak = 0.12, delay = 0 } = opts;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, duration * 0.3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** 选卡「咻」：短促下滑扫频。 */
export function playSwipe(): void {
  if (isMuted()) return;
  tone({ freqStart: 620, freqEnd: 220, duration: 0.14, type: 'triangle', peak: 0.1 });
}

/** 死亡「咚」：低频闷响 + 一点锯齿铺底。 */
export function playDeath(): void {
  if (isMuted()) return;
  tone({ freqStart: 160, freqEnd: 55, duration: 0.55, type: 'sine', peak: 0.18 });
  tone({ freqStart: 90, freqEnd: 40, duration: 0.6, type: 'sawtooth', peak: 0.06, delay: 0.02 });
}

/** 指标进入临界（≤10 或 ≥90）轻提示音。 */
export function playDanger(): void {
  if (isMuted()) return;
  tone({ freqStart: 880, freqEnd: 880, duration: 0.09, type: 'sine', peak: 0.06 });
}
