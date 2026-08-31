import { STAT_LABELS } from './content/constants';
import { INITIAL_STATS } from './core/stats';
import { STAT_KEYS } from './core/types';
import './styles/global.css';

/**
 * M0 占位界面。
 * 玩法 UI（卡牌、滑动手势、指标条、结局页）属于 M1，见 docs/接力文件.md 的「下一步指令」。
 * 本组件存在的唯一目的是让构建与 UI 测试链路可跑通（四道门之一）。
 */
export default function App() {
  return (
    <main className="app">
      <h1 className="app__title">蛛丝王权</h1>
      <p className="app__hint">M0 初始化占位 · 玩法界面属于 M1</p>
      <ul className="app__stats">
        {STAT_KEYS.map((key) => (
          <li key={key} className="app__stat">
            <span className="app__stat-label">{STAT_LABELS[key]}</span>
            <span className="app__stat-value">{INITIAL_STATS[key]}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
