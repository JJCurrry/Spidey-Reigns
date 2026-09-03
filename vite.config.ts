import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // 部署 base：GitHub Pages 项目站挂在子路径 /Spidey-Reigns/ 下，生产产物必须带此前缀，
  // 否则 public/assets 下的图片与入口脚本会 404。开发期（dev / preview 本地）保持根路径，
  // 让 `npm run dev` 访问地址不变。资源 URL 经 src/content/assets.ts 的 assetUrl() 拼接本值。
  // 用配置函数式的 mode 区分生产/开发（构建期 mode='production'、开发期='development'、测试期='test'），
  // 不依赖 import.meta.env（vitest 加载配置时该值尚未注入）也不依赖 node 全局类型。
  base: mode === 'production' ? '/Spidey-Reigns/' : '/',
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
}));
