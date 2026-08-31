/**
 * 卡牌内容。只放数据 —— 出现任何函数或控制流，说明该逻辑属于 src/core/，应下沉。
 * （不变量 #4；内容表达方式见 docs/adr/ADR-0003-内容以类型化常量驱动.md）
 *
 * M0 只放 7 张种子卡，用途是把抽卡 / 去重 / 兜底 / 条件 / 特殊死亡五条机制跑通并钉死测试。
 * 正式的 40 张内容属于 M1，见 docs/接力文件.md。
 */

import type { Card } from '../core/types';

export const CARDS = [
  {
    id: 'card-jjj-headline',
    speaker: 'J·乔纳·詹姆森',
    text: '号角日报头版又是你：「蛛形威胁」。他在电视上用手指戳着你的照片。',
    left: {
      text: '开一场记者会澄清',
      effect: { reputation: 8, life: -6 },
      outcome: '你说完了。第二天头版写着：「蒙面者狡辩两小时」。',
    },
    right: {
      text: '不解释，继续巡逻',
      effect: { reputation: -10, civilians: 8 },
      outcome: '你救下了一整条街。没人知道是谁，包括詹姆森。',
    },
  },
  {
    id: 'card-bank-robbery',
    speaker: '警用频段',
    text: '第二大道银行被劫，五名人质。你已经三十个小时没合眼了。',
    left: {
      text: '现在就出发',
      effect: { civilians: 10, order: 6, life: -12 },
      outcome: '五个人平安回家。你在天台上坐到天亮，手指一直在抖。',
    },
    right: {
      text: '交给警队处理',
      effect: { civilians: -10, order: -4, life: 8 },
      outcome: '你睡了六个小时。新闻里的人质名单多了一个名字。',
    },
  },
  {
    id: 'card-aunt-may',
    speaker: '梅·帕克',
    text: '「彼得，你三天没回家了。锅里给你留了汤。」',
    left: {
      text: '回家，把汤喝完',
      effect: { life: 12, civilians: -8 },
      outcome: '汤是温的。她说你瘦了，你没敢抬头。',
    },
    right: {
      text: '告诉她今晚还有事',
      effect: { life: -10, civilians: 6 },
      outcome: '电话那头静了两秒，然后她说：「注意安全，孩子。」',
    },
  },
  {
    id: 'card-webshooter-repair',
    text: '左手发射器在昨夜的追逐里卡了壳。工作台上的零件摊了一地。',
    left: {
      text: '花一整晚修好它',
      effect: { order: 8, life: -8 },
      outcome: '校准到凌晨四点。它现在比你更可靠。',
    },
    right: {
      text: '凑合着用',
      effect: { order: -8, life: 6 },
      outcome: '你提前躺下。梦里全是没抓住的手。',
    },
  },
  {
    id: 'card-goblin-threat',
    speaker: '绿魔',
    text: '他在桥上丢下南瓜炸弹，笑着说：「这次我不会瞄准你朋友以外的人。」',
    once: true,
    weight: 2,
    left: {
      text: '先救人',
      effect: { civilians: 12, reputation: -8, order: -6 },
      flag: 'flag-spared-goblin',
      outcome: '他站在楼顶看着你把最后一个人放下，鼓了三下掌。',
    },
    right: {
      text: '追上去',
      effect: { reputation: 10, civilians: -8, order: 6 },
      outcome: '你们在钢梁之间撞了七次。他消失时，桥上还有人在等救援。',
    },
  },
  {
    id: 'card-exhausted-vow',
    text: '你挂在雨里的消防栓上，手指几乎握不住蛛丝。',
    condition: { stats: { life: { max: 25 } } },
    left: {
      text: '再撑一晚',
      effect: { life: -15 },
      outcome: '你撑住了。但你知道，下一次未必。',
    },
    right: {
      text: '把战衣挂回衣柜',
      effect: { reputation: -6 },
      death: 'death-exhausted-vow',
    },
  },
  {
    id: 'card-quiet-night',
    text: '今晚的纽约罕见地安静。',
    fallback: true,
    left: { text: '多巡两个街区', effect: { order: 6, life: -6 } },
    right: { text: '早点回去', effect: { order: -6, life: 6 } },
  },
] as const satisfies readonly Card[];
