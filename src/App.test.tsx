/**
 * App 冒烟测试：证明顶层装配把玩法界面渲染出来（四指标条 + 当前事件卡）。
 * 链路：App → ReignGame → useReign（core）→ StatBars / CardView，全部可跑通。
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App（UI 冒烟）', () => {
  it('渲染四指标条与当前事件卡', () => {
    render(<App />);
    expect(screen.getAllByRole('meter')).toHaveLength(4);
    expect(screen.getByLabelText('当前事件卡')).toBeInTheDocument();
    expect(screen.getByLabelText('滑动或按左右方向键做抉择')).toBeInTheDocument();
  });
});
