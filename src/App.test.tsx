/**
 * UI 层冒烟测试。
 * 存在意义：证明 jsdom 环境、React 渲染与 jest-dom 匹配器这条测试链路是通的
 * （四道门之一 —— 测试体系）。M1 写真实界面时，组件测试照此结构扩展。
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App（UI 冒烟）', () => {
  it('渲染标题与四指标初始值', () => {
    render(<App />);
    expect(screen.getByText('蛛丝王权')).toBeInTheDocument();
    expect(screen.getByText('市民')).toBeInTheDocument();
    expect(screen.getAllByText('50')).toHaveLength(4);
  });
});
