import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 默认 jsdom（UI 层用）；src/core/** 强制 node 环境 —— 这是不变量 #7（纯逻辑层）的执行点。
    environment: 'jsdom',
    environmentMatchGlobs: [['src/core/**', 'node']],
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      // 覆盖率棘轮：只进不退。想降低阈值必须新开 ADR 说明理由。
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
