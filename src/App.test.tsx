/**
 * App 冒烟测试：证明顶层装配把标题屏→对局链路跑通。
 * 链路：App 标题门控 → 点「开始游戏」→ ReignGame → useReign（core）→ StatBars / CardView。
 * M3-C 引入标题屏门控，故需先点击「开始游戏」再断言玩法界面。
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App（UI 冒烟）', () => {
  it('标题屏 → 开始 → 渲染四指标条与当前事件卡', () => {
    render(<App />);
    // 初始为标题屏。
    expect(screen.getByText('蛛丝王权')).toBeInTheDocument();
    // 进入对局。
    fireEvent.click(screen.getByRole('button', { name: '开始游戏' }));
    // 玩法界面渲染：四指标条 + 当前事件卡 + 滑动区。
    expect(screen.getAllByRole('meter')).toHaveLength(4);
    expect(screen.getByLabelText('当前事件卡')).toBeInTheDocument();
    expect(screen.getByLabelText('滑动或按左右方向键做抉择')).toBeInTheDocument();
  });
});
