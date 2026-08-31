/**
 * 卡牌内容。只放数据 —— 出现任何函数或控制流，说明该逻辑属于 src/core/，应下沉。
 * （不变量 #4；内容表达方式见 docs/adr/ADR-0003-内容以类型化常量驱动.md）
 *
 * M1 正式卡牌集（约 40 张）。四指标 = 市民 / 媒体 / 反派 / 私人生活（ADR-0008）。
 * 机制覆盖：条件卡（按指标/标记/回合）、once 卡（大事件只来一次）、flag 链（抉择延续）、
 * 特殊死法（选项直接触发 death-<id>，优先于指标越界）。兜底卡 1 张。
 * 每张卡左右选项都至少影响一个指标（不变量 #5，由 content.test.ts 守卫）。
 */

import type { Card } from '../core/types';

export const CARDS = [
  // ---------------- 种子卡（机制样板，保留） ----------------
  {
    id: 'card-jjj-headline',
    speaker: 'J·乔纳·詹姆森',
    text: '号角日报头版又是你：「蛛形威胁」。他在电视上用手指戳着你的照片。',
    left: {
      text: '开一场记者会澄清',
      effect: { media: 8, life: -6 },
      outcome: '你说完了。第二天头版写着：「蒙面者狡辩两小时」。',
    },
    right: {
      text: '不解释，继续巡逻',
      effect: { media: -10, civilians: 8 },
      outcome: '你救下了一整条街。没人知道是谁，包括詹姆森。',
    },
  },
  {
    id: 'card-bank-robbery',
    speaker: '警用频段',
    text: '第二大道银行被劫，五名人质。你已经三十个小时没合眼了。',
    left: {
      text: '现在就出发',
      effect: { civilians: 10, villains: 6, life: -12 },
      outcome: '五个人平安回家。你在天台上坐到天亮，手指一直在抖。',
    },
    right: {
      text: '交给警队处理',
      effect: { civilians: -10, villains: -4, life: 8 },
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
      effect: { villains: 8, life: -8 },
      outcome: '校准到凌晨四点。它现在比你更可靠。',
    },
    right: {
      text: '凑合着用',
      effect: { villains: -8, life: 6 },
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
      effect: { civilians: 12, media: -8, villains: -6 },
      flag: 'flag-spared-goblin',
      outcome: '他站在楼顶看着你把最后一个人放下，鼓了三下掌。',
    },
    right: {
      text: '追上去',
      effect: { media: 10, civilians: -8, villains: 6 },
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
      effect: { media: -6 },
      death: 'death-exhausted-vow',
    },
  },
  {
    id: 'card-quiet-night',
    text: '今晚的纽约罕见地安静。',
    fallback: true,
    left: { text: '多巡两个街区', effect: { villains: 6, life: -6 } },
    right: { text: '早点回去', effect: { villains: -6, life: 6 } },
  },

  // ---------------- 媒体线 ----------------
  {
    id: 'card-daily-bugle-scoop',
    speaker: '号角日报实习生',
    text: '「我们拿到你救人的监控了，但剪进了一个……不太好看的角度。」',
    left: {
      text: '要求撤下',
      effect: { media: 6, civilians: 4 },
      outcome: '他们撤了。但编辑说「下次可没这么好说话」。',
    },
    right: {
      text: '随他们播',
      effect: { media: -10, villains: 4 },
      outcome: '播放量破了纪录。评论区一半在骂你，一半在夸你。',
    },
  },
  {
    id: 'card-live-stream-duel',
    speaker: '网红主播',
    text: '「现在连线！只要你当着镜头跟我对打，打赏全捐孤儿院。」',
    left: {
      text: '拒绝消费悲剧',
      effect: { media: -8, life: 4 },
      outcome: '你挂了线。孤儿院那条捐款链接，是你匿名发的。',
    },
    right: {
      text: '陪他演一场',
      effect: { media: 12, civilians: -4 },
      outcome: '打赏真的到了。可你也开始数镜头的角度了。',
    },
  },
  {
    id: 'card-media-frenzy',
    text: '全城都在转一张模糊的照片：红蓝身影从一栋着火的楼里抱出孩子。',
    condition: { stats: { media: { min: 70 } } },
    left: {
      text: '接受专访',
      effect: { media: 8, life: -6 },
      outcome: '镜头跟着你回了家。你第一次希望自己没有家。',
    },
    right: {
      text: '躲进地下',
      effect: { media: -12, villains: 4 },
      outcome: '你消失了三天。等再出现，标题变成了「英雄遁走」。',
    },
  },
  {
    id: 'card-unmask-trap',
    speaker: '神秘客',
    text: '全息投影把你围在中间：「摘下面具，我就停止模拟市民尖叫的音频。」',
    once: true,
    condition: { stats: { villains: { min: 60 } } },
    left: {
      text: '摘下面具',
      effect: { media: 14, civilians: -10 },
      death: 'death-unmasked',
    },
    right: {
      text: '撕碎投影',
      effect: { villains: -10, media: -4 },
      outcome: '你扯断了发射器。虚惊一场，但全市都替你捏了把汗。',
    },
  },

  // ---------------- 反派线 ----------------
  {
    id: 'card-doc-ock-breakout',
    speaker: '章鱼博士',
    text: '他撞开实验室的玻璃，四条机械臂拖着一整箱反应堆零件。',
    once: true,
    weight: 2,
    left: {
      text: '正面拦截',
      effect: { civilians: 8, villains: 10, life: -10 },
      outcome: '零件散了一地。他的臂膀在你肩上留下四道印。',
    },
    right: {
      text: '先疏散群众',
      effect: { civilians: 12, villains: -6, life: -4 },
      outcome: '没人受伤。章鱼博士回头看了你一眼，像在记你的样子。',
    },
  },
  {
    id: 'card-kingpin-deal',
    speaker: '金并',
    text: '「我让你的街区安静三个月，你别碰我的码头。」他递来一杯没碰过的酒。',
    once: true,
    left: {
      text: '拒绝交易',
      effect: { villains: 10, civilians: -6, media: 6 },
      outcome: '酒杯被他放回桌上。那晚之后，你的照片贴满了码头。',
    },
    right: {
      text: '假意答应',
      effect: { villains: -8, media: -4 },
      flag: 'flag-kingpin-truce',
      outcome: '你点了头。三个月里没血案，但你睡得比有血案时还差。',
    },
  },
  {
    id: 'card-kingpin-betrayal',
    speaker: '金并',
    text: '「协议到期了。不过……看在你这三个月的份上，我给你最后一个选项。」',
    once: true,
    condition: { flags: ['flag-kingpin-truce'] },
    left: {
      text: '掀了码头',
      effect: { villains: 12, civilians: 8, life: -10 },
      outcome: '火光照亮半条河。金并的笑声从对岸飘过来。',
    },
    right: {
      text: '再续三个月',
      effect: { villains: -6, media: -8, life: 6 },
      outcome: '你又点了头。镜子里的你，已经不太像彼得了。',
    },
  },
  {
    id: 'card-venom-symbiote',
    speaker: '毒液',
    text: '黑色黏液从天台边缘渗下来，声音在你脑子里：「我们一起，就没人会死。」',
    once: true,
    left: {
      text: '把它甩掉',
      effect: { villains: -10, life: -8 },
      outcome: '你用教堂的钟声震开了它。耳朵里安静了，手臂却在抖。',
    },
    right: {
      text: '让它上来',
      effect: { villains: 12, civilians: 6, life: -6 },
      flag: 'flag-has-venom',
      outcome: '身体轻了一倍。可你分不清哪些念头，还是你自己的。',
    },
  },
  {
    id: 'card-venom-control',
    text: '黑共生体在替你出拳，力道大得把墙打穿了。路人尖叫着后退。',
    once: true,
    condition: { flags: ['flag-has-venom'] },
    left: {
      text: '夺回身体',
      effect: { villains: -8, life: -10 },
      outcome: '你把自己锁进冷库。等出来时，它已经不在了，你也不太一样了。',
    },
    right: {
      text: '交给它',
      effect: { villains: 14, civilians: -8 },
      death: 'death-hero-falls',
    },
  },
  {
    id: 'card-street-dealer',
    text: '巷口的孩子在卖「战衣同款」贴纸，十块一张，钱进了更大的口袋。',
    left: {
      text: '端掉供货',
      effect: { villains: 8, civilians: 4 },
      outcome: '贴纸摊空了。孩子冲你比了个中指，跑进了夜色。',
    },
    right: {
      text: '不管',
      effect: { villains: -6, media: 4 },
      outcome: '你转身走了。第二天，同款贴纸印上了你的脸。',
    },
  },
  {
    id: 'card-villain-territory',
    text: '两个帮派在你常巡的街区交火，都在等你先动手。',
    condition: { stats: { villains: { min: 55 } } },
    left: {
      text: '强行分开两边',
      effect: { civilians: 8, villains: -10, life: -8 },
      outcome: '你用蛛网把两拨人捆在路灯上。他们骂你，却都没再开枪。',
    },
    right: {
      text: '只保人，不抓人',
      effect: { civilians: 10, villains: 4, life: 4 },
      outcome: '伤员都送走了。地盘照旧分，只是今晚没人死。',
    },
  },

  // ---------------- 市民线 ----------------
  {
    id: 'card-protest-crowd',
    speaker: '广场上的标语',
    text: '「蒙面者滚出我们的街区」和「我们需要蒙面者」两拨人，隔着喷泉对骂。',
    left: {
      text: '站到中间',
      effect: { civilians: 10, media: -6, life: -4 },
      outcome: '你摘下一半面具，只露眼睛。两边都安静了一瞬。',
    },
    right: {
      text: '从屋顶路过',
      effect: { civilians: -8, media: 6 },
      outcome: '你荡过去时，有人举手机拍你，配文是「看，他根本不关心」。',
    },
  },
  {
    id: 'card-save-cat',
    text: '三楼窗台卡着一只猫，楼下围了几十个人在拍。',
    left: {
      text: '救下来',
      effect: { civilians: 6, media: 4, life: -2 },
      outcome: '猫挠了你一下，跳进人群。视频上了热搜，标题很暖。',
    },
    right: {
      text: '让消防员来',
      effect: { civilians: -4, life: 4 },
      outcome: '消防员三分钟赶到。你松了口气，也松了点存在感。',
    },
  },
  {
    id: 'card-tenant-eviction',
    speaker: '隔壁邻居',
    text: '「我交不起房租了，下周就搬。你……能不能帮我跟房东说句好话？」',
    left: {
      text: '替他垫上',
      effect: { civilians: 8, life: -10 },
      outcome: '你掏空了钱包。梅姨说你像你叔叔，你没敢接话。',
    },
    right: {
      text: '帮不出钱',
      effect: { civilians: -8, life: 6 },
      outcome: '你只能帮他把箱子搬上车。他笑着说的谢谢，比骂还难受。',
    },
  },
  {
    id: 'card-school-visit',
    speaker: '母校老师',
    text: '「孩子们想见见蜘蛛侠。就二十分钟，不拍照。」',
    left: {
      text: '去一趟',
      effect: { civilians: 10, media: 6, life: -4 },
      outcome: '二十分钟变成了两小时。一个小女孩说她想当像你一样的人。',
    },
    right: {
      text: '婉拒',
      effect: { civilians: -6, life: 6 },
      outcome: '你回了消息。屏幕暗下去，屋里只剩你一个人。',
    },
  },

  // ---------------- 私人生活线 ----------------
  {
    id: 'card-midtown-exam',
    speaker: '班主任',
    text: '「彼得·帕克，你这学期缺课二十七节。再这样，留级。」',
    left: {
      text: '回去上课',
      effect: { life: 10, civilians: -6 },
      outcome: '你坐回倒数第二排。粉笔灰落进你刚结痂的伤口。',
    },
    right: {
      text: '翘掉考试',
      effect: { life: -12, villains: 4 },
      outcome: '警报响的时候你正好在考场门口。你翻墙走了，试卷没写。',
    },
  },
  {
    id: 'card-ned-friendship',
    speaker: '内德',
    text: '「你最近老失踪。我不是要管你，我只是……有点想我哥们了。」',
    left: {
      text: '坦白一点',
      effect: { life: 10, media: -4 },
      outcome: '你只说了「我在忙很重要的事」。他点头，像信，又像不信。',
    },
    right: {
      text: '装没事',
      effect: { life: -10, civilians: 4 },
      outcome: '你笑着说没事。他没再问，只是把游戏机收了起来。',
    },
  },
  {
    id: 'card-may-hospital',
    speaker: '医院来电',
    text: '「梅姨晕倒了，现在在急诊。她嘱咐我们别打扰你……但我们还是打了。」',
    left: {
      text: '放下一切赶去',
      effect: { life: 12, civilians: -10, media: -4 },
      outcome: '你脱下战衣冲进病房。她醒来第一句是「你又没好好吃饭」。',
    },
    right: {
      text: '先处理眼前的危机',
      effect: { life: -14, civilians: 8 },
      outcome: '你救了那栋楼的人。手机还亮着，是医院的未接来电。',
    },
  },
  {
    id: 'card-birthday-alone',
    text: '今天是你的生日。冰箱上贴着梅姨画的歪歪扭扭的蛋糕。',
    condition: { stats: { life: { max: 30 } } },
    left: {
      text: '给自己放一天',
      effect: { life: 14 },
      outcome: '你吹灭了想象里的蜡烛。窗外有警报，你按住了自己的手。',
    },
    right: {
      text: '照常出门',
      effect: { life: -10, villains: 6 },
      outcome: '你翻出窗外。生日愿望，是希望明天不用再过生日。',
    },
  },
] as const satisfies readonly Card[];
