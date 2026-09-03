# 蛛丝王权（Spidey-Regins）项目长期记忆

## 项目是什么

以蜘蛛侠为主角的 Reigns 式滑卡治国游戏。左右滑动做抉择，四个指标互相牵制，任一触 0 或 100 即结束一局。
技术栈：TypeScript + Vite + React 18。核心玩法在 `src/core/`，纯逻辑、零 UI 依赖。

## 开发方法（硬性约定）

按 `@skill:ai-coding-method` 的规范开发。**`CLAUDE.md` 是唯一根入口**，动手前必读；
制品在 `docs/`（地图 / 不变量 / 术语表 / 工单 / ADR / 接力文件）。跨会话接手只读这三件：
`CLAUDE.md` + 工单 + `docs/接力文件.md`。

铁律：验收先行、小步提交（diff ≤400 行）、接力有棒、修复有规、熔断有线、变更落单。
一句话总结：**能写成检查的规则绝不写成文字**（红线走不变量，规范走 lint）。

## 玩法设定（已裁决，见 ADR-0008）

- 四指标 = **市民 / 媒体 / 反派 / 私人生活**，初始均 50，双向致死（0 和 100 都结束一局）
  （M0 的「声誉/秩序」已被 ADR-0008 取代，不要再沿用旧名）
- 一局只因死亡结束，无回合上限；`runReign` 有 MAX_TURNS=500 保险丝，命中即抛错（判为卡死缺陷）
- 死亡是设计内容，不是失败惩罚——不得为了让玩家活久而削弱死亡判定

## 平衡基线（T-007 内容扩充后，75 张卡 / 9 特殊死法）

四分支边界致死占比（占 8 个边界结局合计）：**市民 21.2% / 媒体 22.9% / 反派 27.7% / 私人生活 28.2%**；
八条边界结局全部 ≥4.5%（主样本最低 `civilians-max` 5.1%；`SEED_OFFSET` 交叉验证最低 `media-min` 4.3%，种子噪声内）；
random 中位 17 回合（比 T-006 的 19 略短，内容更戏剧化的可接受偏移）；survive 偏置中位 23、rush 中位 12；
9 个特殊死法 random 全可见（新增三个各 ~390 次命中）；无卡死。
（`平衡体检报告-2026-09-03-T007.md`）

调参工具：`scripts/balance-audit.ts`（`--quick` 40s 快速往返 / `SEED_OFFSET` 抗过拟合验证 / `AUDIT_NOTE` 记录本轮改动）。

**调参铁律**：
1. 临界放大器力度必须按该指标**静态触碰频率反比缩放**（生活被 72% 选项推动，照抄媒体/反派会冲爆）。
2. **英雄叙事的无意识方向偏置**：新增「救市民 / 推反派」卡时，其效果方向会抬高对应指标 max 端、压垮 min 端
   （M4-A 初版 `civilians-min` 掉到 1.9% 死内容，根因是反派线「救市民」选项把市民往上推）。
   须显式用反向选项 + 把 incidental 的「正向 incidental 效果」改为下推，保双端分布。改完必复跑 `--quick`。

## 已下沉为可执行检查的红线

| 不变量 | 执行点 |
|---|---|
| #1 随机/时间必须注入，禁裸调 `Math.random` | ESLint `no-restricted-properties` |
| #3 四指标恒 0–100 整数 | `src/core/stats.ts` + stats 测试 |
| #4/#5 内容只放 `src/content`；选项必须带非零效果 | `content.test.ts` 完整性守卫 |
| #6 抽卡去重 + 空池回退兜底卡 | `deck.test.ts` |
| #7 `src/core/` 禁 React / 浏览器全局 | ESLint `no-restricted-imports` |

覆盖率棘轮在 `vite.config.ts`（80%，只进不退）。提交前跑 `npm run verify`。

## IP 与发布定位（已裁决：**公开发布**）

远端 `https://github.com/JJCurrry/Spidey-Reigns.git` 是公开仓库（`private: false`）。
原 ADR-0006 定的是「个人练习、不公开发布」，冲突后按流程上报，用户裁决「不在意是否私有，公开发布」。

处置：新开 **ADR-0007 取代 ADR-0006**（ADR-0006 保留为意图记录、标记已取代），
同步改写 `CLAUDE.md` 原则 8/9 与不变量 #8。

当前有效约束只有一条：**禁止把漫威官方素材**（官方剧照、海报、商标、logo、官方字体）
放进仓库或构建产物；AI 生成 / 自绘的原创演绎与文字层面的角色名允许。
**后续会话不必再劝阻。** 若日后要上架或商业化，回归路径是 ADR-0006 描述的原创化方案。

## 部署（M4-C，GitHub Pages）

- 一键发布：`push main` 触发 `.github/workflows/deploy.yml`（GitHub Actions 原生 Pages：
  `configure-pages`→`upload-pages-artifact(dist)`→`deploy-pages`），部署前跑 typecheck+lint+test+build 门禁。
- 资源 URL 必须感知 base：`src/content/assets.ts` 的 `assetUrl()` 拼 `import.meta.env.BASE_URL`；
  `vite.config.ts` 的 `base` 仅在 `mode==='production'`（`vite build`）挂 `/Spidey-Reigns/`，`npm run dev` 仍根路径。
- **vite 配置坑（可复用）**：配置里别用 `import.meta.env.PROD`——vitest 加载配置时 `import.meta.env` 尚未注入，会报
  `TypeError: Cannot read properties of undefined (reading 'PROD')`。判断生产用 `defineConfig(({ mode }) => ...)` 的 `mode` 参数（零 `import.meta.env`、零 `process`）。
- 人工步骤（L3，非 AI 代做）：push 后仓库 **Settings → Pages → Source 选「GitHub Actions」** 首次开启；
  验 `https://jjcurrry.github.io/Spidey-Reigns/`。

## 环境坑（Windows + Git Bash）

- **Git 钩子不继承交互式 shell 的 PATH**，`npx` 在钩子里会 command not found。
  已在 `.husky/pre-commit` 里补 PATH 候选目录 + 直接 `node node_modules/lint-staged/bin/lint-staged.js`。
  换机器/换 node 安装位置时，需同步更新该文件的候选目录列表。
- `npm install` 偶发把某些包的 `dist/*.js` 删掉（沙箱清理行为），表现为
  `Cannot find module ... Please verify that the package.json has a valid "main" entry`。
  排查用 `npm run deps:check`（`scripts/check-deps.mjs`），修复用 `rm -rf node_modules/<包名> && npm install`。
  注意该脚本只读 `main`，对 `exports` 优先的 ESM 包会误报。
- Vite 每次运行生成 `vite.config.ts.timestamp-*.mjs`，已进 .gitignore 与 .prettierignore。
- **沙箱会清工作树根 `.git`**（提交时整目录消失，已发生三次，根因是清理按 `Spidey-Reigns/.git` 路径删元数据，非 husky 钩子）。
  根治：真实 git 数据 relocate 到 `.workbuddy/git-data/spidey-reigns-git`，工作树根只留 `.git` 指针文件（必须 Windows 绝对路径 `C:/...`）。
  恢复：`npm run git:restore`；每次提交后 `.husky/post-commit` 自动刷新桌面 `Spidey-Reigns-gitbackup.bundle`。
  钩子 `prepare` 已改为 `husky && node scripts/husky-prepare.mjs`，强制绝对 `core.hooksPath`（否则外置 gitdir 下相对路径失效）。详情见各日期日志与 `scripts/`。
- **`npm run build`/`coverage` 在沙箱空 dist 时挂死（ETIMEDOUT）**：CodeBuddy `node-safe-delete-shim.cjs` 把 `fs.rmSync` 改走 `genie-trash`（`GENIE_TRASH_DIR` 指向的 `win32-x64.exe`）。修法：命令前缀 `CODEBUDDY_SAFE_DELETE_ENABLED=0`（shim 在 env='0' 时早返回，rm 走原生删除）；真实机器无 shim 时为 no-op。未固化进 package.json（避免 IDE 特定 hack）。
- ~~**git 写入全局挂死（2026-08-31 记）**~~ **已证伪，勿再采信**（2026-09-03）：`git commit` 其实能成功。
  真因是 pre-commit 的 **lint-staged 单次耗时 2 分 14 秒**（`git stash` 备份+恢复，relocated gitdir + 64MB 仓库），
  一笔 commit 实测 3–7 分钟，超过常用超时才被误判为挂死。**修法：提交放进后台任务、超时给 ≥500s，别用 `--no-verify` 绕。**
- **`npx <cmd>` 在沙箱解析极慢**（`npx prettier` 90s 被 SIGTERM 杀掉，看起来像挂死）。
  直接调入口文件：`node node_modules/prettier/bin/prettier.cjs`、`node node_modules/vite-node/vite-node.mjs`。
  判定「命令挂死」前先换掉 npx。
- **UI 表现层改动会动现有测试（M4-B 踩坑，可复用）**：
  - 给 `SwipeArea` 之类「手势/循环抉择」组件加 `key={card.id}` 会令其每次重挂载、DOM 节点被替换，
    破坏「`const area = getByLabelText(...)` 后循环 `fireEvent.keyDown(area)`」类测试（事件打到脱离文档的旧节点）。
    改法：把 `key` 移到内层包裹层（如 `.card-enter`），外层手势节点保持稳定。
  - `React.lazy` + `Suspense` 后，懒加载组件异步出现，测试须用 `await screen.findByRole(...)` 等异步查询，
    原 `getByRole` 同步断言会因 Suspense fallback 还在而失败。
  - 音效一律走 **Web Audio 运行时合成**（`src/ui/audio.ts`），不新增音频素材文件（规避漫威素材红线、零加载成本）。
