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

## 玩法设定（待用户最终确认）

- 四指标 = 市民 / 声誉 / 秩序 / 生活，初始均 50，双向致死（0 和 100 都结束一局）
- 一局只因死亡结束，无回合上限；`runReign` 有 MAX_TURNS=500 保险丝，命中即抛错（判为卡死缺陷）
- 死亡是设计内容，不是失败惩罚——不得为了让玩家活久而削弱死亡判定

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
