# M2 美术实装完成概览

> 蛛丝王权（Spidey-Reigns）· M2 里程碑 · 2026-08-31

## 做了什么

- **生成 31 张 AI 原创图**（Reigns 式羊皮纸手绘风，原创演绎、无漫威官方素材）：
  - 15 张具名说话者立绘 → `public/assets/character/`
  - 4 张指标图标（市民 / 媒体 / 反派 / 私人生活）→ `public/assets/icon/`
  - 11 张死亡结局插画 → `public/assets/ending/`
  - +1 张 `char-spider-man`（荷兰弟 / MCU 式主角战衣半身像，预留标题/头像槽，**当前 UI 未引用**）
- **`src/content/assets.ts`**：登记 31 条资源（id / path / kind / note），note 含 AI 生成日期与原创声明。UI 只经 `getAsset(id)` 取路径，零硬编码（ADR-0005）。
- **`src/ui/EndingScreen.tsx`**：接入 `AssetFrame` 展示 `ending-${death.id}` 插画（保留标题/正文/再来一局）。
- **`src/ui/AssetFrame.test.tsx`**：更新断言——已登记资源渲染真图 `<img>`，未登记 id（含 5 个抽象说话者）仍走程序化占位降级。
- **`src/styles/global.css`**：新增 `.ending__art` 样式。

## 关键决策：IP 边界放宽（ADR-0009）

用户明确要求「蜘蛛侠要荷兰弟版本、可用漫威官方素材」。按 `CLAUDE.md` 原则 2（红线冲突不自裁），**未直接违反不变量 #8**，而是落单为 **ADR-0009**：

- ✅ 允许 **MCU / 荷兰弟式原创演绎**（含主角蜘蛛侠按 Tom Holland 时代气质设计）
- ❌ 漫威**官方宣传物料**（官方剧照 / 海报 / 商标 / logo / 官方字体）仍禁止入库公开仓库（不可逆变 takedown 风险）
- 已同步改写：不变量 #8、`CLAUDE.md` 原则 8/9、`docs/接力文件.md`、`docs/地图.md`

## 验收（四门全绿）

| 门禁 | 结果 |
|---|---|
| `npm run verify`（typecheck + lint `--max-warnings 0` + test） | ✅ 67 测试通过 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ core ≥98%（棘轮 80%） |
| `npm run format:check` | ✅ 通过（补齐 5 个既存文件的 prettier 格式） |

## 提交（本地，待你 push）

- `95beccb` — M2-b: 美术实装——31 张原创图入库 + assets 登记 + EndingScreen 接入 + 占位测试
- `06c18f8` — M2: ADR-0009 IP 放宽 + T-003 工单 + 接力/地图/不变量/CLAUDE 同步
- 分支已对齐为 `main`（与上游一致）。
- 离线保险：桌面 `Spidey-Regins-M2-backup.bundle`（含完整历史，已校验）。

## 待你操作

1. **`git push -u origin main`** —— 公开仓库 L3，仅由人执行；HTTPS GCM 无 TTY，需你本地终端推送。
2. 可选：`npm install` 重装 husky 钩子（沙箱会清 `.git`，本次恢复后未重装，已用 `npm run verify` 等价门禁替代）。

## 备注 / 踩坑

- ⚠️ **`.git` 在 M2 提交时再次凭空消失**（同 M1 灾难），husky pre-commit 报 `e4ffa874... is not a valid object` 后整个 `.git` 消失。已用桌面 bundle 恢复，源码零丢失。
- 5 个抽象说话者（警用频段 / 广场标语 / 医院来电 / 手写信 / 涂鸦）按 `T-003` 约定保留程序化占位，未生成图。
- 生成时并行调用 ImageGen 曾触发同名文件互相覆盖，已改为单图单目录生成规避。
