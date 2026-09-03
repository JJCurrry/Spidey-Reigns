/**
 * 标题屏（M3-C 收尾/上架）。游戏入口枢纽：
 * - 展示预留的主角头像槽 `char-spider-man`（M2 已入库的真图，走 AssetFrame 优雅降级）
 * - 「开始游戏」进入对局；「图鉴」直接查看当前已发现内容（不进入对局）
 * 图鉴覆盖层自管理（与 ReignGame 内的图鉴互不干扰，都是纯组件）。
 */

import { lazy, Suspense, useState } from 'react';
import { AssetFrame } from './AssetFrame';
import { freshSave, type SaveData } from '../save/migrate';
import { useMuted } from './audio';
import './title.css';

// 图鉴仅在点开时拉取：从首屏 bundle 拆出独立 chunk（M4-B 首屏优化）。
const CodexScreen = lazy(() => import('./CodexScreen').then((m) => ({ default: m.CodexScreen })));

export interface TitleScreenProps {
  /** 跨会话存档（用于图鉴展示已发现内容）；缺省用空档。 */
  readonly save?: SaveData;
  /** 点击「开始游戏」。 */
  readonly onStart: () => void;
}

export function TitleScreen({ save = freshSave(), onStart }: TitleScreenProps) {
  const [showCodex, setShowCodex] = useState(false);
  const [muted, toggleMuted] = useMuted();

  return (
    <main className="title" role="dialog" aria-label="标题屏">
      <div className="title__topbar">
        <button
          type="button"
          className="title__mute-btn"
          onClick={toggleMuted}
          aria-label={muted ? '开启音效与震动' : '关闭音效与震动'}
          aria-pressed={muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="title__portrait">
        <AssetFrame
          assetId="char-spider-man"
          label="蜘蛛侠"
          alt="主角蜘蛛侠（AI 原创演绎，荷兰弟 / MCU 式）"
          className="title__avatar"
        />
      </div>

      <h1 className="title__name">蛛丝王权</h1>
      <p className="title__subtitle">Spidey-Reigns · 滑卡治国</p>

      <div className="title__actions">
        <button type="button" className="title__start" onClick={onStart}>
          开始游戏
        </button>
        <button
          type="button"
          className="title__codex"
          onClick={() => setShowCodex(true)}
          aria-label="打开图鉴"
        >
          图鉴
        </button>
      </div>

      {showCodex && (
        <Suspense fallback={<div className="overlay-loading">加载中…</div>}>
          <CodexScreen save={save} onClose={() => setShowCodex(false)} />
        </Suspense>
      )}
    </main>
  );
}
