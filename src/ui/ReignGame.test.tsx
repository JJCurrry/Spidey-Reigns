/**
 * UI 层冒烟 + 一局闭环。
 * 关键性质：滑/键触发抉择 → 指标变化 → 终会死于某个边界（原则 6/7）。
 * 死亡判定本身不在这里写，只验证 useReign 把 core 正确接出来。
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReignGame } from './ReignGame';
import { renderHook } from '@testing-library/react';
import { useReign } from './useReign';

const meterValues = (): number[] =>
  Array.from(document.querySelectorAll('[role="meter"]')).map((el) =>
    Number((el as HTMLElement).getAttribute('aria-valuenow')),
  );

describe('ReignGame（UI 冒烟）', () => {
  it('渲染当前事件卡与四指标条', () => {
    render(<ReignGame seed={1} onRestart={() => {}} />);
    expect(screen.getByLabelText('当前事件卡')).toBeInTheDocument();
    expect(screen.getAllByRole('meter')).toHaveLength(4);
  });

  it('按右方向键会触发一次抉择（至少一个指标随之变化）', () => {
    render(<ReignGame seed={1} onRestart={() => {}} />);
    const before = meterValues();
    const area = screen.getByLabelText('滑动或按左右方向键做抉择');
    fireEvent.keyDown(area, { key: 'ArrowRight' });
    const after = meterValues();
    expect(after).not.toEqual(before);
  });

  it('结局出现后展示「再来一局」按钮', () => {
    render(<ReignGame seed={1} onRestart={() => {}} />);
    const area = screen.getByLabelText('滑动或按左右方向键做抉择');
    // 一路向右，必然在有限回合内死亡（原则 6）。
    for (let i = 0; i < 600; i += 1) {
      if (screen.queryByRole('dialog') !== null) break;
      fireEvent.keyDown(area, { key: 'ArrowRight' });
    }
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('再来一局')).toBeInTheDocument();
  });
});

describe('useReign（接线正确性）', () => {
  it('初始抽到一张卡，四指标均 50', () => {
    const { result } = renderHook(() => useReign(7));
    expect(result.current.card).not.toBeNull();
    expect(Object.values(result.current.stats)).toEqual([50, 50, 50, 50]);
    expect(result.current.over).toBe(false);
  });

  it('反复抉择必然在有限步内以死亡结束，且死后再选无效', () => {
    const { result } = renderHook(() => useReign(7));
    // 每次抉择单独 act，让 React 刷新闭包（否则会一直用初始 game）。
    for (let i = 0; i < 600 && !result.current.over; i += 1) {
      act(() => {
        result.current.choose('left');
      });
    }
    expect(result.current.over).toBe(true);
    expect(result.current.death).not.toBeNull();

    const turnsAtDeath = result.current.turn;
    act(() => {
      result.current.choose('left');
    });
    // 结局后 choose 是 no-op：回合数不变、死法不变。
    expect(result.current.turn).toBe(turnsAtDeath);
    expect(result.current.death).not.toBeNull();
  });
});
