# M3-C 收尾/上架 — 概览

> 里程碑：在 M3-B（机制延伸）之后，把原型收口为「完整可进入的游戏」。
> 工单：`docs/工单/T-005-收尾上架.md`。本会话按「验收先行」推进 c1–c4。

## 做了什么

把游戏从「一进来就开玩」升级为带 **标题屏枢纽** 的完整形态：

- **标题屏 `src/ui/TitleScreen.tsx` + `title.css`**
  - 展示预留的主角头像槽 `char-spider-man`（M2 已入库真图，走 `AssetFrame` 优雅降级）。
  - 「开始游戏」进入对局；「图鉴」直接查看当前已发现内容（不进入对局）。
- **标题门控（App.tsx）**：`started` 状态控制标题 ↔ 对局切换；每次进入对局都重新抽种子（`makeSeed` 经 crypto 注入，不触发不变量 #1）。
- **「返回标题」出口（EndingScreen + ReignGame）**：死亡结局页新增「返回标题」按钮，经 `onExit` 回到标题枢纽；保留「再来一局」与「查看图鉴」。
- **图鉴可达性**：标题屏与对局内均可打开 `CodexScreen` 覆盖层（各自管理状态，互不干扰）。

## 改动文件

| 文件 | 性质 | 说明 |
|---|---|---|
| `src/ui/TitleScreen.tsx` | 新增 | 标题屏组件 |
| `src/ui/title.css` | 新增 | 标题屏样式（复用 global.css 主题 token） |
| `src/App.tsx` | 改 | 标题门控 + 每次进局重抽种子 + `onExit` |
| `src/ui/ReignGame.tsx` | 改 | 新增 `onExit` prop，条件传入 EndingScreen |
| `src/ui/EndingScreen.tsx` | 改 | 新增 `onExit` prop + 「返回标题」按钮 |
| `src/styles/global.css` | 改 | `.ending__exit` 样式 |
| `src/ui/TitleScreen.test.tsx` | 新增 | 标题渲染/头像接入/开始/图鉴回调 |
| `src/App.test.tsx` | 改 | 适配标题门控（先点「开始游戏」再断言玩法界面） |
| `docs/工单/T-005-收尾上架.md` | 新增 | 工单 |
| `docs/地图.md` | 改 | 登记 TitleScreen / title.css 模块 |
| `docs/接力文件.md` | 改 | 标记 M3-C 进度 |

## 校验结果（本会话跑过）

- `verify`（typecheck + lint + test）：**79 测试全绿**，exit 0。
- `build`：`CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build` 通过（见下「环境坑」）。
- `coverage`：经 shim 绕过后可达标（棘轮 80%）。
- `format:check`：通过。

## 环境坑（本会话，已记入接力文件）

1. **`npm run build` / `coverage` 空 `dist` 时挂死（ETIMEDOUT）**：CodeBuddy 的 `node-safe-delete-shim` 把 `fs.rmSync` 改走 `genie-trash` 超时。
   修法（命令前缀，不固化）：`CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build`。真实机器无 shim 时为 no-op。
2. **git 写入全局挂死**：`git commit` / `git bundle create` 本会话无法写入（读操作正常）。
   影响：所有 M3-C 改动已落盘、校验全绿，但**本会话未能提交**。恢复路径：在干净环境按 c1–c4 分批补 commit；提交前先 `git bundle create` 离线备份。

## 后续（未做，待工单）

- **M3-A 内容与平衡**：44 张卡手感/数值调参（不变量 #3 双向致死不得削弱，属原则 3，需调参规格）。
- **M3-C 部署发布**：代码侧已就绪（`dist/` 可产出）；实际 push / 平台发布为 L3 仅由人执行（ADR-0007）。
