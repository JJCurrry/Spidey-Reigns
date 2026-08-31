/**
 * 死亡结局。
 *
 * 术语表：「死亡」是内容，不是失败惩罚。四指标 × 双向 = 8 个边界结局必须齐全，
 * 否则 evaluateDeath 会在运行时抛错（由 __tests__/content.test.ts 在 CI 中拦截）。
 *
 * M1-b：四指标语义重构（ADR-0008）后，边界结局 id 改为 death-media-* / death-villains-*，
 * 文案按新语义重写。特殊死法 death-exhausted-vow 保留（由 card-exhausted-vow 触发）；
 * 另两个特殊死法 death-unmasked / death-hero-falls 属于 M1-e 扩充。
 *
 * 边界结局 id 的格式是硬约定：`death-<指标键>-<min|max>`，见 src/core/game.ts。
 */

import type { Death } from '../core/types';

export const DEATHS = [
  {
    id: 'death-civilians-min',
    title: '被驱逐',
    text: '没有人再抬头看你。橱窗里挂着的战衣被当成万圣节存货打折——纽约不赶你走，它只是不再需要你。',
  },
  {
    id: 'death-civilians-max',
    title: '被供上神坛',
    text: '每一个路口都有人在等你自己走出来。你成了这座城市的日程表，再也不是它的人。',
  },
  {
    id: 'death-media-min',
    title: '被抹去',
    text: '号角日报的版面换成了星座运势。你救下的人接受采访，镜头扫过你时，主持人说「这位是谁来着」。你还在救人，只是故事不再有你的名字。',
  },
  {
    id: 'death-media-max',
    title: '真人秀主角',
    text: '你的每一次出击都被提前直播。镜头比反派更懂怎么逼你出拳。你开始为收视率挑对手——观众爱看，你也停不下来。',
  },
  {
    id: 'death-villains-min',
    title: '下一个威胁',
    text: '你把最后一名反派送进了监狱。第二天，头条写的是「谁还需要蒙面人」。城市开始数你救过的人里，有几个其实是你自己惹出来的祸。',
  },
  {
    id: 'death-villains-max',
    title: '无主之城',
    text: '街区被分完了，每块地盘上插着别人的标记。你还在荡网，只是不知道该往哪儿落。反派不再躲你——他们现在怕的是彼此。',
  },
  {
    id: 'death-life-min',
    title: '彼得·帕克消失了',
    text: '退学通知、欠租单、未接来电，全叠在空冰箱上。衣柜里那件红蓝的衣服，没人再认领。',
  },
  {
    id: 'death-life-max',
    title: '战衣挂在衣柜里',
    text: '房租交清了，论文过了，梅姨的汤是热的。窗外有警报声——你翻了个身，把被子拉高了些。',
  },
  {
    id: 'death-exhausted-vow',
    title: '力竭',
    text: '你松开了手指。坠落的时候你才想起，那句「能力越大责任越大」，从来没说你可以不睡觉。',
  },
] as const satisfies readonly Death[];
