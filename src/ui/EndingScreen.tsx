/**
 * 结局页。死亡是内容（CLAUDE.md 原则 7），不是失败惩罚——
 * 所以文案是「又一种结局」，按钮是「再来一局」。
 */

import type { Death } from '../core/types';

export interface EndingScreenProps {
  readonly death: Death;
  readonly turns: number;
  readonly onRestart: () => void;
}

export function EndingScreen({ death, turns, onRestart }: EndingScreenProps) {
  return (
    <div className="ending" role="dialog" aria-label="本局结束">
      <p className="ending__eyebrow">第 {turns} 回合 · 一种结局</p>
      <h2 className="ending__title">{death.title}</h2>
      <p className="ending__text">{death.text}</p>
      <button type="button" className="ending__again" onClick={onRestart}>
        再来一局
      </button>
    </div>
  );
}
