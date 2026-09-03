/**
 * 玩法编排：指标条 + 滑动卡 + 结局页的组合。M1-d 的顶层组件。
 * 自己不写规则——只把 useReign 的状态铺到组件上。
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { useReign } from './useReign';
import { StatBars } from './StatBars';
import { SwipeArea } from './SwipeArea';
import { CardView } from './CardView';
import { EndingScreen } from './EndingScreen';
import { freshSave, type SaveData } from '../save/migrate';
import type { Card, Death } from '../core/types';
import { CARDS } from '../content/cards';
import { DEATHS } from '../content/deaths';
import { isMuted, playDeath, useMuted } from './audio';
import { vibrate } from './haptics';

// 图鉴仅在点开时拉取：从首屏 bundle 拆出独立 chunk（M4-B 首屏优化）。
const CodexScreen = lazy(() => import('./CodexScreen').then((m) => ({ default: m.CodexScreen })));

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
  const [muted, toggleMuted] = useMuted();

  // 死亡触发当帧，回调一次（记录存档/解锁）。依赖 death 而非 over，避免重复触发。
  useEffect(() => {
    if (death !== null) {
      onDeath?.(death, turn);
      if (!isMuted()) {
        playDeath();
        vibrate([18, 40, 18]);
      }
    }
    // 仅在死亡结算这一刻调用，故只依赖 death。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [death]);

  return (
    <main className="reign">
      <div className="reign__topbar">
        <button
          type="button"
          className="reign__mute-btn"
          onClick={toggleMuted}
          aria-label={muted ? '开启音效与震动' : '关闭音效与震动'}
          aria-pressed={muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>
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
          // 入场动画：把 key 放在内层 .card-enter 上（每张新卡重挂载触发 CSS 动画），
          // 滑动区 DOM 节点保持稳定，避免影响「按方向键循环抉择」类测试。
          // 飞出动画由 SwipeArea 在指针释放路径处理，互不冲突。
          <SwipeArea onChoose={reign.choose} disabled={over}>
            <div key={card.id} className="card-enter">
              <CardView card={card} outcome={outcome} />
            </div>
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

      {showCodex && (
        <Suspense fallback={<div className="overlay-loading">加载中…</div>}>
          <CodexScreen save={save} onClose={() => setShowCodex(false)} />
        </Suspense>
      )}
    </main>
  );
}
