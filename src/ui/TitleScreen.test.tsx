/**
 * TitleScreen 测试：标题渲染、主角头像槽接入、开始/图鉴回调。
 * 头像走 AssetFrame：char-spider-man 已登记 → 渲染真图（assert alt）。
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TitleScreen } from './TitleScreen';
import { freshSave } from '../save/migrate';

describe('TitleScreen', () => {
  it('渲染标题与主角头像槽', () => {
    render(<TitleScreen save={freshSave()} onStart={() => {}} />);
    expect(screen.getByText('蛛丝王权')).toBeInTheDocument();
    expect(screen.getByText('Spidey-Reigns · 滑卡治国')).toBeInTheDocument();
    // char-spider-man 已登记 → AssetFrame 渲染真图（alt 含主角身份）。
    expect(screen.getByAltText(/主角蜘蛛侠/)).toBeInTheDocument();
  });

  it('点击「开始游戏」触发 onStart', () => {
    const onStart = vi.fn();
    render(<TitleScreen save={freshSave()} onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('点击「图鉴」打开结局/成就图鉴覆盖层', async () => {
    render(<TitleScreen save={freshSave()} onStart={() => {}} />);
    // 未打开时图鉴对话框不存在。
    expect(screen.queryByRole('dialog', { name: '图鉴' })).not.toBeInTheDocument();
    // 标题屏的图鉴按钮 aria-label 为「打开图鉴」。
    fireEvent.click(screen.getByRole('button', { name: '打开图鉴' }));
    // 图鉴为懒加载（Suspense），对话框异步出现，需等待。
    expect(await screen.findByRole('dialog', { name: '图鉴' })).toBeInTheDocument();
  });
});
