/**
 * 美术占位层的降级守卫（ADR-0005）：资源缺失时绝不白屏、绝不抛错；
 * M2 美术实装后，已登记资源应渲染真图 <img>，未登记资源（含抽象说话者）仍走程序化占位。
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssetFrame } from './AssetFrame';
import { getAsset } from '../content/assets';

describe('资源清单协议（ADR-0005）', () => {
  it('已登记资源可被 getAsset 解析（M2 美术实装后）', () => {
    expect(getAsset('char-梅·帕克')).not.toBeNull();
    expect(getAsset('icon-civilians')).not.toBeNull();
    expect(getAsset('ending-death-hero-falls')).not.toBeNull();
  });

  it('未登记资源（含抽象说话者）getAsset 返回 null，渲染程序化占位', () => {
    expect(getAsset('char-警用频段')).toBeNull();
    expect(getAsset('char-does-not-exist')).toBeNull();

    render(<AssetFrame assetId="char-警用频段" label="警用频段" />);
    const placeholder = screen.getByRole('img', { name: '警用频段' });
    expect(placeholder).toHaveClass('asset-frame--placeholder');
    expect(placeholder).toHaveTextContent('警');
  });

  it('已登记资源渲染为真图 <img>，不再走占位', () => {
    render(<AssetFrame assetId="char-梅·帕克" label="梅姨" alt="梅·帕克立绘" />);
    const img = screen.getByRole('img', { name: '梅·帕克立绘' }) as HTMLImageElement;
    expect(img).toHaveClass('asset-frame--image');
    expect(img.getAttribute('src')).toBe('/assets/character/aunt-may.png');
  });

  it('占位对相同 id 产出稳定颜色（同一资源风格恒定）', () => {
    const { rerender } = render(<AssetFrame assetId="fixed-id" label="X" />);
    const first = screen.getByRole('img').className;
    rerender(<AssetFrame assetId="fixed-id" label="X" />);
    expect(screen.getByRole('img').className).toBe(first);
  });
});
