/**
 * 图鉴页冒烟：已发现结局显标题、未发现显「未发现」、成就锁/解锁态正确、关闭按钮可用。
 * 不依赖真实 localStorage / 路由，纯展示逻辑。CSS 导入在 vitest 下为 no-op。
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CodexScreen } from './CodexScreen';
import type { SaveData } from '../save/migrate';

const saveWithOneDeath: SaveData = {
  version: 1,
  seenDeaths: ['death-unmasked'],
  reignsPlayed: 1,
  bestTurns: 5,
};

describe('CodexScreen（图鉴页）', () => {
  it('已发现的结局显示标题，未发现显示「未发现」且不泄露真实标题', () => {
    render(<CodexScreen save={saveWithOneDeath} onClose={() => {}} />);
    expect(screen.getByText('面具落地')).toBeInTheDocument(); // death-unmasked 标题
    expect(screen.getAllByText('未发现').length).toBeGreaterThan(0);
    // 未发现的结局（如 death-civilians-min「被驱逐」）不应出现真实标题
    expect(screen.queryByText('被驱逐')).not.toBeInTheDocument();
  });

  it('成就：已解锁显示描述，未解锁显示「未解锁」', () => {
    render(<CodexScreen save={saveWithOneDeath} onClose={() => {}} />);
    expect(screen.getByText('完成你的第一局游戏。')).toBeInTheDocument(); // 初尝终局描述
    expect(screen.getAllByText('未解锁').length).toBeGreaterThan(0);
  });

  it('关闭按钮触发 onClose', () => {
    const onClose = vi.fn();
    render(<CodexScreen save={saveWithOneDeath} onClose={onClose} />);
    screen.getByLabelText('关闭图鉴').click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
