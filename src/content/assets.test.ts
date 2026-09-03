import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetUrl } from './assets';

describe('assetUrl（base 感知，GitHub Pages 子路径正确性）', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('本地 dev / Vercel 根域名：base 为 / 时路径不变', () => {
    vi.stubEnv('BASE_URL', '/');
    expect(assetUrl('/assets/character/aunt-may.png')).toBe('/assets/character/aunt-may.png');
  });

  it('GitHub Pages 子路径：拼接到 /Spidey-Reigns/', () => {
    vi.stubEnv('BASE_URL', '/Spidey-Reigns/');
    expect(assetUrl('/assets/character/aunt-may.png')).toBe(
      '/Spidey-Reigns/assets/character/aunt-may.png',
    );
  });

  it('不带结尾斜杠的 base 也能正确拼接', () => {
    vi.stubEnv('BASE_URL', '/Spidey-Reigns');
    expect(assetUrl('/assets/icon/icon-civilians.png')).toBe(
      '/Spidey-Reigns/assets/icon/icon-civilians.png',
    );
  });
});
