/**
 * 卡面视图（纯展示）。说话者头像走 AssetFrame 占位（M1-c），
 * 选项只列出文案与「左/右」提示，真实抉择由 SwipeArea 的手势/键盘触发。
 */

import { AssetFrame } from './AssetFrame';
import type { Card } from '../core/types';

export interface CardViewProps {
  readonly card: Card;
  readonly outcome: string | null;
}

export function CardView({ card, outcome }: CardViewProps) {
  return (
    <article className="card-view" aria-label="当前事件卡">
      {card.speaker !== undefined && (
        <header className="card-view__speaker">
          <AssetFrame assetId={`char-${card.speaker}`} label={card.speaker.slice(0, 1)} alt={card.speaker} className="card-view__avatar" />
          <span className="card-view__speaker-name">{card.speaker}</span>
        </header>
      )}

      <p className="card-view__text">{card.text}</p>

      {outcome !== null && <p className="card-view__outcome">{outcome}</p>}

      <footer className="card-view__choices">
        <span className="card-view__choice card-view__choice--left">
          <span className="card-view__choice-hint" aria-hidden="true">←</span>
          {card.left.text}
        </span>
        <span className="card-view__choice card-view__choice--right">
          {card.right.text}
          <span className="card-view__choice-hint" aria-hidden="true">→</span>
        </span>
      </footer>
    </article>
  );
}
