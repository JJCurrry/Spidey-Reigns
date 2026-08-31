import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9 flat config。
 * 除了代码规范，本文件还承担「不变量下沉为 L1 自动检查」的职责：
 *   - 不变量 #1（随机/时间源必须注入）
 *   - 不变量 #7（src/core 必须是纯逻辑层）
 * 撞上这里 = 撞红线，不是风格问题。改动本文件需走工单。
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.husky/_/**', 'public/**'],
  },

  // ---- 配置类 JS 文件 ----
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // ---- 所有 TS / TSX ----
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // ---- 不变量 #1：随机源与时间源必须注入（全 src 生效）----
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            '不变量 #1：禁止裸调 Math.random()。随机必须来自注入的 Rng（createRng），否则一局无法重现、BUG 无法复现。见 docs/adr/ADR-0004-随机与时间注入.md',
        },
        {
          object: 'Date',
          property: 'now',
          message: '不变量 #1：时间源必须注入，禁止裸调 Date.now()。',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message: '不变量 #1：时间源必须注入，禁止裸调 Date。',
        },
      ],
    },
  },

  // ---- 不变量 #7：src/core 必须是纯逻辑层 ----
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: '不变量 #7：src/core 禁止依赖 React。' },
            { name: 'react-dom', message: '不变量 #7：src/core 禁止依赖 react-dom。' },
          ],
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-dom/*',
                'react/*',
                '@/ui/*',
                '../ui/*',
                './ui/*',
              ],
              message: '不变量 #7：src/core 必须保持纯逻辑，禁止依赖 UI 层。',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: '不变量 #7：src/core 禁止依赖浏览器全局对象 window。' },
        { name: 'document', message: '不变量 #7：src/core 禁止依赖浏览器全局对象 document。' },
        {
          name: 'localStorage',
          message: '不变量 #7：src/core 禁止直接读写 localStorage（存档由外层注入）。',
        },
        { name: 'navigator', message: '不变量 #7：src/core 禁止依赖浏览器全局对象 navigator。' },
        { name: 'Date', message: '不变量 #1：时间源必须注入，禁止裸调 Date。' },
      ],
    },
  },

  // ---- 测试文件：放宽 react-refresh（组件测试常与组件同文件导出）----
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
