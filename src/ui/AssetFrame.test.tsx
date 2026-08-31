/**
 * 美术占位层的降级守卫（ADR-0005）：资源未登记时绝不白屏、绝不抛错。
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssetFrame } from './AssetFrame';
import { getAsset } from '../content/assets';

describe('资源清单协议（ADR-0005）', () => {
  it('M1 阶段清单为空，任何 id 都走占位（getAsset 返回 null）', () => {
    expect(getAsset('card-jjj-headline')).toBeNull();
    expect(getAsset('char-may')).toBeNull();
  });

  it('未登记资源渲染为程序化占位，且带无障碍标签，不抛错', () => {
    render(<AssetFrame assetId="card-jjj-headline" label="詹姆森" />);
    const placeholder = screen.getByRole('img', { name: '詹姆森' });
    expect(placeholder).toHaveClass('asset-frame--placeholder');
    expect(placeholder).toHaveTextContent('詹');
  });

  it('占位对相同 id 产出稳定颜色（同一资源风格恒定）', () => {
    const { rerender } = render(<AssetFrame assetId="fixed-id" label="X" />);
    const first = screen.getByRole('img').className;
    rerender(<AssetFrame assetId="fixed-id" label="X" />);
    expect(screen.getByRole('img').className).toBe(first);
  });
});
