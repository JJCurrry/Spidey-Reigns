import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';

const take = (seed: number, count: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createRng（不变量 #1：随机必须可重现）', () => {
  it('同种子产生完全相同的序列', () => {
    expect(take(20260831, 32)).toEqual(take(20260831, 32));
  });

  it('不同种子产生不同序列', () => {
    expect(take(1, 32)).not.toEqual(take(2, 32));
  });

  it('next() 始终落在 [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int(n) 产生 [0, n) 内的整数', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng.int(5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
    }
  });

  it('int() 拒绝非正整数上界（否则会静默产生越界值）', () => {
    const rng = createRng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(-3)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
  });

  it('拒绝非整数种子', () => {
    expect(() => createRng(1.5)).toThrow(RangeError);
  });
});
