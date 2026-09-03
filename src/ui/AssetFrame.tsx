import type { CSSProperties } from 'react';
import { getAsset, assetUrl } from '../content/assets';
import './asset-frame.css';

export interface AssetFrameProps {
  /** 资源 id，对应 src/content/assets.ts 的登记项。 */
  readonly assetId: string;
  /** 占位时用作图形的文字（取首字），也作无障碍标签。 */
  readonly label?: string;
  /** 图片模式的替代文本。 */
  readonly alt?: string;
  /** 附加类名（调用方控制尺寸/布局）。 */
  readonly className?: string;
}

/** 由 id 稳定推出色相，保证同一资源占位颜色恒定。 */
function hueFromId(id: string): number {
  let hash = 0;
  for (const ch of id) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return hash % 360;
}

/**
 * 资源占位框。按 ADR-0005 的降级条款：
 * 资源未登记（getAsset 返回 null）时回退到程序化占位（色块 + 首字），禁止白屏或抛错。
 * 资源登记后自动切换为 <img>，组件调用方无需改动。
 */
export function AssetFrame({ assetId, label, alt, className }: AssetFrameProps) {
  const asset = getAsset(assetId);

  if (asset !== null) {
    return (
      <img
        className={`asset-frame asset-frame--image ${className ?? ''}`.trim()}
        src={assetUrl(asset.path)}
        alt={alt ?? label ?? assetId}
      />
    );
  }

  const glyph = (label ?? assetId).slice(0, 1);
  const style = { '--ph-hue': hueFromId(assetId) } as CSSProperties;

  return (
    <div
      className={`asset-frame asset-frame--placeholder ${className ?? ''}`.trim()}
      style={style}
      role="img"
      aria-label={alt ?? label ?? assetId}
    >
      <span className="asset-frame__glyph">{glyph}</span>
    </div>
  );
}
