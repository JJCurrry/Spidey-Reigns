import { useMemo, useState } from 'react';
import { ReignGame } from './ui/ReignGame';
import { makeSeed } from './ui/seed';
import { availableCards } from './content/unlocks';
import { loadSave, recordAndPersist } from './save/storage';
import type { SaveData } from './save/migrate';
import './styles/global.css';

/**
 * 顶层装配：持有「当前局的种子」与「跨会话存档」。
 * - 种子由最外层注入（src/ui/seed.ts，用 crypto，不触发不变量 #1）。
 * - 解锁进度来自存档：已死局数 → 可用卡组（availableCards），换种子即重挂载用新卡组。
 * - 死亡时记录存档（含结局图鉴），下次开局的卡组随之扩大。
 */
export default function App() {
  const [seed, setSeed] = useState<number>(() => makeSeed());
  const [save, setSave] = useState<SaveData>(() => loadSave());

  const deck = useMemo(() => availableCards(save.seenDeaths.length), [save.seenDeaths.length]);

  return (
    // key={seed}：不同种子 = 不同挂载，保证 useReign 首抽只发生一次（同种子同局）。
    <ReignGame
      key={seed}
      seed={seed}
      cards={deck}
      onDeath={(death, turns) => setSave((prev) => recordAndPersist(prev, death.id, turns))}
      onRestart={() => setSeed(makeSeed())}
    />
  );
}
