export {};

// Vitest 全局 setup。
// src/core/** 的测试跑在 node 环境（无 document），仅 DOM 环境才注册 jest-dom 匹配器与清理钩子。
if (typeof document !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  const { afterEach } = await import('vitest');
  await import('@testing-library/jest-dom/vitest');
  // 防止多渲染用例之间 DOM 累积（jsdom 无框架级 afterEach 时 RTL 不会自动清理）。
  afterEach(() => cleanup());
}
