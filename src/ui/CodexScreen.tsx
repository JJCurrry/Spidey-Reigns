/**
 * 图鉴页（覆盖层）。两栏：
 *  - 结局图鉴：列出全部 DEATHS；已发现显示标题 + 正文 + `AssetFrame(ending-${id})` 插画，
 *    未发现显示「？？？ 未发现」（走占位，不白屏不抛错）。
 *  - 成就：列出 `achievementsFor(save)`；已解锁显示描述、未解锁显示「未解锁」。
 *
 * 本组件只展示，不写规则（CLAUDE.md 原则 4/7）。数据来自入参 `save`，由外层（App）注入。
 */

import { AssetFrame } from './AssetFrame';
import { achievementsFor } from '../content/achievements';
import { DEATHS } from '../content/deaths';
import type { SaveData } from '../save/migrate';
import './codex.css';

export interface CodexScreenProps {
  readonly save: SaveData;
  readonly onClose: () => void;
}

export function CodexScreen({ save, onClose }: CodexScreenProps) {
  const achievements = achievementsFor(save);
  const seen = new Set(save.seenDeaths);

  return (
    <div className="codex" role="dialog" aria-label="图鉴" aria-modal="true">
      <header className="codex__bar">
        <h2 className="codex__title">图鉴</h2>
        <button type="button" className="codex__close" onClick={onClose} aria-label="关闭图鉴">
          ×
        </button>
      </header>

      <section className="codex__section" aria-labelledby="codex-deaths">
        <h3 id="codex-deaths" className="codex__heading">
          结局
        </h3>
        <ul className="codex__grid">
          {DEATHS.map((death) => {
            const discovered = seen.has(death.id);
            return (
              <li key={death.id} className={`codex__card${discovered ? '' : ' is-locked'}`}>
                {discovered ? (
                  <>
                    <AssetFrame
                      assetId={`ending-${death.id}`}
                      label={death.title}
                      alt={`${death.title} · 结局插画`}
                      className="codex__art"
                    />
                    <h4 className="codex__card-title">{death.title}</h4>
                    <p className="codex__card-text">{death.text}</p>
                  </>
                ) : (
                  <>
                    <div className="codex__art codex__art--locked" aria-hidden="true">
                      ？？？
                    </div>
                    <h4 className="codex__card-title">未发现</h4>
                    <p className="codex__card-text">继续游玩以解锁这条结局。</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="codex__section" aria-labelledby="codex-ach">
        <h3 id="codex-ach" className="codex__heading">
          成就
        </h3>
        <ul className="codex__list">
          {achievements.map((ach) => (
            <li key={ach.id} className={`codex__ach${ach.unlocked ? ' is-unlocked' : ''}`}>
              <span className="codex__ach-mark" aria-hidden="true">
                {ach.unlocked ? '★' : '☆'}
              </span>
              <span className="codex__ach-body">
                <span className="codex__ach-title">{ach.title}</span>
                <span className="codex__ach-desc">{ach.unlocked ? ach.description : '未解锁'}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
