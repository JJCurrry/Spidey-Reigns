import { useMemo, useState } from 'react';
import { ReignGame } from './ui/ReignGame';
import { TitleScreen } from './ui/TitleScreen';
import { makeSeed } from './ui/seed';
import { availableCards } from './content/unlocks';
import { loadSave, recordAndPersist } from './save/storage';
import type { SaveData } from './save/migrate';
import './styles/global.css';

/**
 * 顶层装配：持有「当前局的种子」「跨会话存档」「是否已进入对局」。
 * - 种子由最外层注入（src/ui/seed.ts，用 crypto，不触发不变量 #1）。
 * - 解锁进度来自存档：已死局数 → 可用卡组（availableCards），换种子即重挂载用新卡组。
 * - 死亡时记录存档（含结局图鉴），下次开局的卡组随之扩大。
 * - 标题屏为入口枢纽；「开始游戏」/「返回标题」切换 started 门控。每次进入对局都重新抽种子。
 */
export default function App() {
  const [seed, setSeed] = useState<number>(() => makeSeed());
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [started, setStarted] = useState(false);

  const deck = useMemo(() => availableCards(save.seenDeaths.length), [save.seenDeaths.length]);

  if (!started) {
    return (
      <TitleScreen
        save={save}
        onStart={() => {
          // 每次进入对局都换种子（makeSeed 经 crypto 注入，不触发不变量 #1）。
          setSeed(makeSeed());
          setStarted(true);
        }}
      />
    );
  }

  return (
    // key={seed}：不同种子 = 不同挂载，保证 useReign 首抽只发生一次（同种子同局）。
    <ReignGame
      key={seed}
      seed={seed}
      cards={deck}
      save={save}
      onDeath={(death, turns) => setSave((prev) => recordAndPersist(prev, death.id, turns))}
      onRestart={() => setSeed(makeSeed())}
      onExit={() => setStarted(false)}
    />
  );
}
