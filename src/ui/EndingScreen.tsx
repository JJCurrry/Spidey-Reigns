/**
 * 结局页。死亡是内容（CLAUDE.md 原则 7），不是失败惩罚——
 * 所以文案是「又一种结局」，按钮是「再来一局」。
 */

import type { Death } from '../core/types';
import { AssetFrame } from './AssetFrame';

export interface EndingScreenProps {
  readonly death: Death;
  readonly turns: number;
  readonly onRestart: () => void;
  /** 可选：打开图鉴页（由外层提供入口）。 */
  readonly onShowCodex?: () => void;
  /** 可选：返回标题屏（由外层切换门控）；缺省不显示该入口。 */
  readonly onExit?: () => void;
}

export function EndingScreen({ death, turns, onRestart, onShowCodex, onExit }: EndingScreenProps) {
  return (
    <div className="ending" role="dialog" aria-label="本局结束">
      <p className="ending__eyebrow">第 {turns} 回合 · 一种结局</p>
      <AssetFrame
        assetId={`ending-${death.id}`}
        label={death.title}
        alt={`${death.title} · 结局插画`}
        className="ending__art"
      />
      <h2 className="ending__title">{death.title}</h2>
      <p className="ending__text">{death.text}</p>
      <div className="ending__actions">
        <button type="button" className="ending__again" onClick={onRestart}>
          再来一局
        </button>
        {onExit !== undefined && (
          <button type="button" className="ending__exit" onClick={onExit}>
            返回标题
          </button>
        )}
        {onShowCodex !== undefined && (
          <button type="button" className="ending__codex" onClick={onShowCodex}>
            查看图鉴
          </button>
        )}
      </div>
    </div>
  );
}
