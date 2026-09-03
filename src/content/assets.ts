/**
 * 美术资源清单（单一事实源）。见 docs/adr/ADR-0005-美术资源策略.md。
 *
 * 约定：
 * - 代码**不**直接 import 图片路径；一律通过本清单的 id → 路径映射取资源。
 * - `getAsset(id)` 返回 null = 该资源尚未产出 → 调用方必须回退到程序化占位（AssetFrame），
 *   禁止白屏或抛错（ADR-0005 的降级条款）。
 * - 新产出图片时，在下方 ASSETS 登记：id / 文件路径（统一放 public/assets/）/
 *   用途 / 授权与来源备注（AI 生成需记录生成方式与日期）。
 *
 * M2 状态：30 张计划内资源（15 立绘 + 4 图标 + 11 结局）已全部产出并登记；
 * 另 +1 张 `char-spider-man`（荷兰弟式主角战衣半身像，预留给未来的标题/头像槽，
 * 当前 UI 未引用），详见 docs/工单/T-003-美术实装.md 的 ASSUMPTION-HERO-PORTRAIT。
 * 5 个抽象说话者（警用频段 / 广场标语 / 医院来电 / 手写信 / 涂鸦）按约定保留程序化占位。
 */

export type AssetKind = 'character' | 'card' | 'icon' | 'ending';

export interface AssetRef {
  readonly id: string;
  /** 统一放 public/assets/ 下，路径以 / 开头。 */
  readonly path: string;
  readonly kind: AssetKind;
  /** 用途说明 + 授权/来源备注（AI 生成需标注生成方式与日期）。 */
  readonly note: string;
}

const GEN_NOTE =
  'AI 生成原创演绎（Reigns 式羊皮纸手绘风，2026-08-31）；非漫威官方素材，无剧照/海报/商标/logo。';

/**
 * 资源登记表（M2 美术实装）。任何 id 此刻都返回真实条目；
 * 未登记 id（含 5 个抽象说话者）仍走 AssetFrame 的程序化占位，保证「资源缺失也绝不白屏」。
 */
export const ASSETS: readonly AssetRef[] = [
  // ── 角色立绘：15 个具名说话者（id = `char-${card.speaker}`） ──
  {
    id: 'char-J·乔纳·詹姆森',
    path: '/assets/character/jj-jameson.png',
    kind: 'character',
    note: `号角日报主编 J·乔纳·詹姆森。${GEN_NOTE}`,
  },
  {
    id: 'char-梅·帕克',
    path: '/assets/character/aunt-may.png',
    kind: 'character',
    note: `梅·帕克（梅姨）。${GEN_NOTE}`,
  },
  {
    id: 'char-绿魔',
    path: '/assets/character/green-goblin.png',
    kind: 'character',
    note: `反派：绿魔。${GEN_NOTE}`,
  },
  {
    id: 'char-章鱼博士',
    path: '/assets/character/dr-octopus.png',
    kind: 'character',
    note: `反派：章鱼博士。${GEN_NOTE}`,
  },
  {
    id: 'char-金并',
    path: '/assets/character/kingpin.png',
    kind: 'character',
    note: `反派：金并。${GEN_NOTE}`,
  },
  {
    id: 'char-毒液',
    path: '/assets/character/venom.png',
    kind: 'character',
    note: `反派/共生体：毒液。${GEN_NOTE}`,
  },
  {
    id: 'char-神秘客',
    path: '/assets/character/mysterio.png',
    kind: 'character',
    note: `反派：神秘客。${GEN_NOTE}`,
  },
  {
    id: 'char-内德',
    path: '/assets/character/ned.png',
    kind: 'character',
    note: `好友内德。${GEN_NOTE}`,
  },
  {
    id: 'char-市长',
    path: '/assets/character/mayor.png',
    kind: 'character',
    note: `市长。${GEN_NOTE}`,
  },
  {
    id: 'char-网红主播',
    path: '/assets/character/streamer.png',
    kind: 'character',
    note: `网红主播。${GEN_NOTE}`,
  },
  {
    id: 'char-号角日报实习生',
    path: '/assets/character/bugle-intern.png',
    kind: 'character',
    note: `号角日报实习生。${GEN_NOTE}`,
  },
  {
    id: 'char-母校老师',
    path: '/assets/character/alma-mater-teacher.png',
    kind: 'character',
    note: `母校老师。${GEN_NOTE}`,
  },
  {
    id: 'char-班主任',
    path: '/assets/character/homeroom-teacher.png',
    kind: 'character',
    note: `班主任。${GEN_NOTE}`,
  },
  {
    id: 'char-夜班护士',
    path: '/assets/character/night-nurse.png',
    kind: 'character',
    note: `夜班护士。${GEN_NOTE}`,
  },
  {
    id: 'char-隔壁邻居',
    path: '/assets/character/neighbor.png',
    kind: 'character',
    note: `隔壁邻居。${GEN_NOTE}`,
  },

  // ── 角色立绘（额外 +1，当前 UI 未引用，预留标题/头像槽） ──
  {
    id: 'char-spider-man',
    path: '/assets/character/spider-man.png',
    kind: 'character',
    note: '主角蜘蛛侠（荷兰弟 / MCU 式原创演绎，非官方剧照），见 ADR-0009。预留槽位，当前 UI 未引用。',
  },

  // ── 指标图标：4 张（id = `icon-${key}`，key ∈ civilians/media/villains/life） ──
  {
    id: 'icon-civilians',
    path: '/assets/icon/icon-civilians.png',
    kind: 'icon',
    note: `指标图标·市民。${GEN_NOTE}`,
  },
  {
    id: 'icon-media',
    path: '/assets/icon/icon-media.png',
    kind: 'icon',
    note: `指标图标·媒体/声誉。${GEN_NOTE}`,
  },
  {
    id: 'icon-villains',
    path: '/assets/icon/icon-villains.png',
    kind: 'icon',
    note: `指标图标·反派/秩序。${GEN_NOTE}`,
  },
  {
    id: 'icon-life',
    path: '/assets/icon/icon-life.png',
    kind: 'icon',
    note: `指标图标·私人生活。${GEN_NOTE}`,
  },

  // ── 结局插画：11 张（id = `ending-${death.id}`） ──
  {
    id: 'ending-death-civilians-min',
    path: '/assets/ending/ending-death-civilians-min.png',
    kind: 'ending',
    note: `结局·被驱逐（市民触底）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-civilians-max',
    path: '/assets/ending/ending-death-civilians-max.png',
    kind: 'ending',
    note: `结局·被供上神坛（市民触顶）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-media-min',
    path: '/assets/ending/ending-death-media-min.png',
    kind: 'ending',
    note: `结局·被抹去（媒体触底）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-media-max',
    path: '/assets/ending/ending-death-media-max.png',
    kind: 'ending',
    note: `结局·真人秀主角（媒体触顶）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-villains-min',
    path: '/assets/ending/ending-death-villains-min.png',
    kind: 'ending',
    note: `结局·下一个威胁（反派触底）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-villains-max',
    path: '/assets/ending/ending-death-villains-max.png',
    kind: 'ending',
    note: `结局·无主之城（反派触顶）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-life-min',
    path: '/assets/ending/ending-death-life-min.png',
    kind: 'ending',
    note: `结局·彼得·帕克消失了（生活触底）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-life-max',
    path: '/assets/ending/ending-death-life-max.png',
    kind: 'ending',
    note: `结局·战衣挂在衣柜里（生活触顶）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-exhausted-vow',
    path: '/assets/ending/ending-death-exhausted-vow.png',
    kind: 'ending',
    note: `结局·力竭。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-unmasked',
    path: '/assets/ending/ending-death-unmasked.png',
    kind: 'ending',
    note: `结局·面具落地（身份暴露）。${GEN_NOTE}`,
  },
  {
    id: 'ending-death-hero-falls',
    path: '/assets/ending/ending-death-hero-falls.png',
    kind: 'ending',
    note: `结局·坠落的英雄。${GEN_NOTE}`,
  },
];

const ASSET_INDEX: Readonly<Record<string, AssetRef>> = Object.freeze(
  Object.fromEntries(ASSETS.map((asset) => [asset.id, asset])),
);

/** 按 id 取资源；未登记返回 null（调用方回退占位）。 */
export function getAsset(id: string): AssetRef | null {
  return ASSET_INDEX[id] ?? null;
}

/**
 * 资源最终 URL：拼接 Vite 的 `base`，使同一份构建产物在三种部署下都能正确加载
 * `public/assets/` 下的图片：
 * - 本地 `npm run dev` / Vercel 根域名：`base` 为 `/` → 路径不变；
 * - GitHub Pages 子路径：`base` 为 `/Spidey-Reigns/` → 拼成 `/Spidey-Reigns/assets/...`。
 *
 * `ASSETS` 的路径约定以 `/` 开头；`base` 由 Vite 配置提供（开发期 `/`、生产期按部署平台定）。
 * 不在此处兜底「资源缺失」——缺失由 `AssetFrame` 按 `getAsset` 返回 null 走程序化占位（ADR-0005）。
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${path}`;
}
