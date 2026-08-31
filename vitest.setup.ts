export {};

// Vitest 全局 setup。
// src/core/** 的测试跑在 node 环境（无 document），仅 DOM 环境才注册 jest-dom 匹配器。
if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest');
}
