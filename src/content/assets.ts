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
 * M1 状态：占位层先行，本清单当前为空。所有资源届时经此登记，不入组件。
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

/**
 * 资源登记表。M1 只做占位层，刻意保持为空——
 * 任何 id 此刻都走 AssetFrame 的程序化占位，保证「资源缺失也绝不白屏」。
 * 图片生产（M1.5）时在此逐项登记，不碰组件。
 */
export const ASSETS: readonly AssetRef[] = [];

const ASSET_INDEX: Readonly<Record<string, AssetRef>> = Object.freeze(
  Object.fromEntries(ASSETS.map((asset) => [asset.id, asset])),
);

/** 按 id 取资源；未登记返回 null（调用方回退占位）。 */
export function getAsset(id: string): AssetRef | null {
  return ASSET_INDEX[id] ?? null;
}
