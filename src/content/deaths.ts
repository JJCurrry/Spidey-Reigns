/**
 * 死亡结局。
 *
 * 术语表：「死亡」是内容，不是失败惩罚。四指标 × 双向 = 8 个边界结局必须齐全，
 * 否则 evaluateDeath 会在运行时抛错（由 __tests__/content.test.ts 在 CI 中拦截）。
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
    id: 'death-reputation-min',
    title: '全民公敌',
    text: '头版登出了你的通缉令，措辞比事实更有说服力。从此你救下的每一个人，都会在镜头前改口。',
  },
  {
    id: 'death-reputation-max',
    title: '镜头里的英雄',
    text: '你开始挑角度落地。掌声太响了，你再也分不清自己在救人，还是在救自己的海报。',
  },
  {
    id: 'death-order-min',
    title: '无主之城',
    text: '街区被分完了，地盘上插着别人的标记。你还在荡网，只是不知道该往哪儿落。',
  },
  {
    id: 'death-order-max',
    title: '蛛网铁幕',
    text: '每条街巷都在你的监听之下，犯罪率归零。人们不再抬头——他们学会了压低声音走路。',
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
