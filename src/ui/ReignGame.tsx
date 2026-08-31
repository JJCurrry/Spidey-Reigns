/**
 * 玩法编排：指标条 + 滑动卡 + 结局页的组合。M1-d 的顶层组件。
 * 自己不写规则——只把 useReign 的状态铺到组件上。
 */

import { useEffect, useState } from 'react';
import { useReign } from './useReign';
import { StatBars } from './StatBars';
import { SwipeArea } from './SwipeArea';
import { CardView } from './CardView';
import { EndingScreen } from './EndingScreen';
import { CodexScreen } from './CodexScreen';
import { freshSave, type SaveData } from '../save/migrate';
import type { Card, Death } from '../core/types';
import { CARDS } from '../content/cards';
import { DEATHS } from '../content/deaths';

export interface ReignGameProps {
  readonly seed: number;
  readonly onRestart: () => void;
  /** 死亡发生时回调（由外层记录存档）。仅在触发当帧调用一次。 */
  readonly onDeath?: (death: Death, turns: number) => void;
  /** 本局卡组（解锁系统会传入子集）；缺省用全量。 */
  readonly cards?: readonly Card[];
  /** 跨会话存档（用于图鉴展示）；缺省用空档。 */
  readonly save?: SaveData;
  /** 返回标题屏（由外层切换started门控）；缺省无「返回标题」入口。 */
  readonly onExit?: () => void;
}

export function ReignGame({
  seed,
  onRestart,
  onDeath,
  cards = CARDS,
  save = freshSave(),
  onExit,
}: ReignGameProps) {
  const reign = useReign(seed, cards, DEATHS);
  const { card, stats, outcome, turn, over, death } = reign;
  const [showCodex, setShowCodex] = useState(false);

  // 死亡触发当帧，回调一次（记录存档/解锁）。依赖 death 而非 over，避免重复触发。
  useEffect(() => {
    if (death !== null) onDeath?.(death, turn);
    // 仅在死亡结算这一刻调用，故只依赖 death。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [death]);

  return (
    <main className="reign">
      <div className="reign__topbar">
        <button
          type="button"
          className="reign__codex-btn"
          onClick={() => setShowCodex(true)}
          aria-label="打开图鉴"
        >
          图鉴
        </button>
      </div>

      <StatBars stats={stats} />

      <div className="reign__stage">
        {card !== null && (
          <SwipeArea onChoose={reign.choose} disabled={over}>
            <CardView card={card} outcome={outcome} />
          </SwipeArea>
        )}

        {over && death !== null && (
          <EndingScreen
            death={death}
            turns={turn}
            onRestart={onRestart}
            onShowCodex={() => setShowCodex(true)}
            {...(onExit !== undefined ? { onExit } : {})}
          />
        )}
      </div>

      {showCodex && <CodexScreen save={save} onClose={() => setShowCodex(false)} />}
    </main>
  );
}
