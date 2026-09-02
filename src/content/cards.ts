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
  {
    id: 'card-media-stardom',
    speaker: '综艺制作人',
    text: '你的故事收视爆了。我们想给你做一档专属真人秀，冠名费够买下半条街。',
    weight: 3,
    condition: { stats: { media: { min: 55 } } },
    left: {
      text: '顺水推舟',
      effect: { media: 14, life: -4 },
      outcome: '镜头追着你升空。你开始分不清哪句是台词，哪句是自己。',
    },
    right: {
      text: '拒绝镜头',
      effect: { media: 10, civilians: 4 },
      outcome: '你挂了电话，可热搜已经替你写好了下一季剧本。',
    },
  },
  {
    id: 'card-media-silence',
    speaker: '收件箱',
    text: '你的名字从热搜跌到了第十页。连詹姆森都改写星座专栏了。',
    weight: 3,
    condition: { stats: { media: { max: 45 } } },
    left: {
      text: '彻底隐身',
      effect: { media: -14 },
      outcome: '你删掉了所有账号。从此城市讲你的故事时，主角换成别人。',
    },
    right: {
      text: '强行刷存在',
      effect: { media: -10, life: 4 },
      outcome: '你对着镜头比了个Pose。镜子里的自己，有点像商品。',
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
  {
    id: 'card-villain-overlord',
    speaker: '街头传闻',
    text: '地盘重新分完了，每一块都插着别人的旗。没人再记得这座城有过蒙面人。',
    weight: 3,
    condition: { stats: { villains: { min: 55 } } },
    left: {
      text: '赶尽杀绝',
      effect: { villains: 14, civilians: -8 },
      outcome: '你把最后的据点端了。可新冒头的，比旧的对你更陌生。',
    },
    right: {
      text: '收编为己用',
      effect: { villains: 10, life: 6 },
      outcome: '你收纳了散兵。城市在你脚下，第一次有了明确的归属。',
    },
  },
  {
    id: 'card-villain-vacuum',
    text: '监狱空了，通缉令换成了你的证件照。连小偷都开始绕着你走。',
    weight: 3,
    condition: { stats: { villains: { max: 45 } } },
    left: {
      text: '放任不管',
      effect: { villains: -14 },
      outcome: '你去了别的城市。这里的头条，换成了别人的热闹。',
    },
    right: {
      text: '主动清剿',
      effect: { villains: -10, life: 6 },
      outcome: '你蹲守了三晚。抓到的第一个，竟是个模仿你的少年。',
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

  // ---------------- 城市大事件（条件触发） ----------------
  {
    id: 'card-blackout',
    text: '全城停电了。黑暗里，只有你的蛛丝还在反光。',
    condition: { minTurn: 15 },
    left: {
      text: '守在变电站',
      effect: { civilians: 10, villains: -6, life: -6 },
      outcome: '你用身体顶住闸刀两小时。灯亮时，没人知道你也在。',
    },
    right: {
      text: '趁黑巡逻',
      effect: { villains: 10, civilians: -4, life: 4 },
      outcome: '停电的三小时，犯罪率没升。代价是你的膝盖。',
    },
  },
  {
    id: 'card-ferry-crisis',
    text: '渡轮在河心裂开，两岸的孩子都在哭。',
    condition: { minTurn: 25 },
    left: {
      text: '织一张大网兜住',
      effect: { civilians: 14, life: -12 },
      outcome: '船没沉。你挂在钢索上，像一面被拉到极限的旗。',
    },
    right: {
      text: '分批撤离',
      effect: { civilians: 8, media: 6, life: 4 },
      outcome: '你一船一船送。最后一个人上岸时，天已经白了。',
    },
  },
  {
    id: 'card-mayor-speech',
    speaker: '市长',
    text: '「我提议立法，给蒙面义警发牌照。当然，前提是先摘下面具。」',
    left: {
      text: '公开反对',
      effect: { media: 8, civilians: 6, villains: 4 },
      outcome: '你站在市政厅顶上举牌。第二天，法案被压了下去。',
    },
    right: {
      text: '保持沉默',
      effect: { media: -10, villains: 6 },
      outcome: '你没出声。法案过了初审，只是执行人换成了别人。',
    },
  },
  {
    id: 'card-goblin-return',
    speaker: '绿魔',
    text: '「上次你放了我一马。这次，我带了整座游乐场的人质。」',
    once: true,
    condition: { flags: ['flag-spared-goblin'], minTurn: 20 },
    left: {
      text: '先救人质',
      effect: { civilians: 14, media: -8, life: -10 },
      flag: 'flag-goblin-final',
      outcome: '你救下所有人。他在广播里笑：「你果然还是先救人。」',
    },
    right: {
      text: '直取绿魔',
      effect: { media: 10, villains: 12, life: -6 },
      outcome: '你们撞进摩天轮。它停转时，他不在了，孩子都安全了。',
    },
  },
  {
    id: 'card-goblin-finale',
    speaker: '绿魔',
    text: '他只剩最后一口气，却把起爆器塞进了自己的口袋：「一起走，好不好？」',
    once: true,
    condition: { flags: ['flag-goblin-final'], minTurn: 30 },
    left: {
      text: '抢下起爆器',
      effect: { civilians: 10, villains: 12, life: -10 },
      outcome: '你扑过去。爆炸的气浪把你掀出三米，他留在了原地。',
    },
    right: {
      text: '拉他一起跳',
      effect: { civilians: -6, life: -14 },
      death: 'death-hero-falls',
    },
  },

  // ---------------- 指标临界预警卡（贴近边界时给叙事预告） ----------------
  {
    id: 'card-civilians-worship',
    text: '街角立起了你的等身雕像，底座刻着「我们的王」。有人开始朝它下跪。',
    condition: { stats: { civilians: { min: 60 } } },
    left: {
      text: '推倒雕像',
      effect: { civilians: -16, media: 6 },
      outcome: '你亲手推的。人群安静得可怕，然后有人开始鼓掌。',
    },
    right: {
      text: '留着',
      effect: { civilians: 2, media: 8 },
      outcome: '你没动。第二天，雕像戴上了真的战衣。',
    },
  },
  {
    id: 'card-civilians-exodus',
    speaker: '广场',
    text: '雕像被推倒了，底座还在，上面有人用喷漆写「下一个是谁」。人群散得比来时快。',
    weight: 4,
    condition: { stats: { civilians: { max: 48 } } },
    left: {
      text: '抽身离去',
      effect: { civilians: -14 },
      outcome: '你荡出城界。橱窗里你的战衣，被当作万圣节存货打折。',
    },
    right: {
      text: '挽回人心',
      effect: { civilians: -10, life: 6 },
      outcome: '你挨家挨户解释了三晚。有人信了，也有人只是礼貌地点头。',
    },
  },
  {
    id: 'card-media-invisible',
    text: '你已经两周没出现在任何报道里了。连詹姆森都换了头条。',
    condition: { stats: { media: { max: 20 } } },
    left: {
      text: '制造一次露面',
      effect: { media: 14, life: -4 },
      outcome: '你在对着镜头摆了个Pose。镜子里的自己有点陌生。',
    },
    right: {
      text: '享受清静',
      effect: { media: -6, life: 8 },
      outcome: '你睡了整觉。梦里没有镜头，只有梅姨的汤。',
    },
  },
  {
    id: 'card-villains-cleared',
    text: '监狱满了，反派没了。城市开始把通缉令换成你的证件照。',
    condition: { stats: { villains: { max: 18 } } },
    left: {
      text: '提醒他们你不是威胁',
      effect: { villains: 10, civilians: -8 },
      outcome: '你摘下半张面具开会。会后，你的照片仍在通缉栏。',
    },
    right: {
      text: '暂时离开',
      effect: { villains: -8, life: 8 },
      outcome: '你去了别的城市。这里的头条，换成了别的热闹。',
    },
  },
  {
    id: 'card-life-erased',
    text: '彼得·帕克这个名字，从所有档案里消失了。连校友录都找不到你。',
    condition: { stats: { life: { max: 18 } } },
    left: {
      text: '找回自己',
      effect: { life: 16, civilians: -6 },
      outcome: '你去派出所改了回名字。盖章的那下，手是稳的。',
    },
    right: {
      text: '就此消失',
      effect: { life: -6, media: 6 },
      outcome: '你删掉了最后一张合影。从此，只有蜘蛛侠还在。',
    },
  },

  // ---------------- 日常卡（维持节奏，弱效果） ----------------
  {
    id: 'card-rooftop-lunch',
    text: '你在天台上吃三明治，对面大楼的清洁工跟你挥了挥手。',
    left: {
      text: '挥手回去',
      effect: { life: 4, civilians: 2 },
      outcome: '你们隔空碰了碰三明治。这一刻，谁也不是英雄。',
    },
    right: {
      text: '继续监视',
      effect: { villains: 2, life: -2 },
      outcome: '你放下三明治，重新盯住了街角。手还是僵的。',
    },
  },
  {
    id: 'card-fan-letter',
    speaker: '一封手写信',
    text: '「我本来想跳楼的。但看了你救人的视频，我决定再看一天。」',
    left: {
      text: '回一封信',
      effect: { civilians: 6, life: 4 },
      outcome: '你写了「明天也请你留下来」。字迹歪歪扭扭，像小学生。',
    },
    right: {
      text: '不回',
      effect: { media: 4, life: -2 },
      outcome: '你把信折好放进口袋。那天你多巡了一个街区。',
    },
  },
  {
    id: 'card-broken-grapple',
    text: '荡到半空时，主绳崩了——你靠备用绳翻了两个跟头才落地。',
    left: {
      text: '立刻返修',
      effect: { villains: 4, life: -6 },
      outcome: '你蹲在楼道里缝了一下午。线头比你想象的还多。',
    },
    right: {
      text: '先用着',
      effect: { villains: -4, life: 6 },
      outcome: '你赌它撑得住。今晚风很大，你荡得比平时低。',
    },
  },
  {
    id: 'card-bodega-dog',
    text: '杂货店的狗认得你了，每次路过都摇尾巴，老板也多塞给你一个苹果。',
    left: {
      text: '陪它玩一会',
      effect: { life: 6, civilians: 2 },
      outcome: '你蹲下来揉了揉它的头。老板说「你比新闻里亲切」。',
    },
    right: {
      text: '别耽误',
      effect: { villains: 2, life: -2 },
      outcome: '你点了点头就走。苹果留在了柜台上。',
    },
  },
  {
    id: 'card-rain-patrol',
    text: '雨把纽约浇成了水墨画。犯罪也跟着潮了，黏糊糊地冒头。',
    left: {
      text: '冒雨巡街',
      effect: { villains: 6, civilians: 4, life: -4 },
      outcome: '你湿透了，但三个扒手被你挂在路灯上晾干。',
    },
    right: {
      text: '等雨停',
      effect: { villains: -4, life: 6 },
      outcome: '你缩在消防梯下。雨停时，街区已经安静了。',
    },
  },
  {
    id: 'card-graffiti-tribute',
    speaker: '墙上的涂鸦',
    text: '有人在你常出现的巷口画了幅你，旁边写「谢谢你还在这里」。',
    left: {
      text: '补一笔颜色',
      effect: { civilians: 4, media: 4, life: 2 },
      outcome: '你偷偷给那幅画描了边。第二天，它被人拍上了新闻。',
    },
    right: {
      text: '不动它',
      effect: { life: 2, civilians: 2 },
      outcome: '你只是多看了两眼。那面墙，后来再没人乱涂。',
    },
  },
  {
    id: 'card-night-shift-nurse',
    speaker: '夜班护士',
    text: '「我值夜班，总能从窗口看见你荡过去。算我一个人的安心。」',
    left: {
      text: '冲她比个心',
      effect: { life: 4, civilians: 4 },
      outcome: '你比了。她笑出了声，又快步回了病房。',
    },
    right: {
      text: '假装没看见',
      effect: { life: -2, media: 4 },
      outcome: '你低头荡过。她的窗，后来一直留着一盏小灯。',
    },
  },
  {
    id: 'card-skateboard-kid',
    text: '一个小孩学你荡蛛丝，用滑板摔进了灌木丛，冲你喊「再演示一次」。',
    left: {
      text: '示范一遍',
      effect: { civilians: 6, life: -4 },
      outcome: '你慢慢荡了个弧线。他看呆了，忘了疼。',
    },
    right: {
      text: '让他自己练',
      effect: { civilians: -2, life: 4 },
      outcome: '你摇摇头走了。他后来真的学会了，用的不是蛛丝。',
    },
  },
  {
    id: 'card-old-photo',
    text: '钱包里那张本叔叔的照片边角卷了。你很久没敢打开它。',
    left: {
      text: '再看一眼',
      effect: { life: 8, civilians: -2 },
      outcome: '「能力越大责任越大。」你念出声，像第一次听见。',
    },
    right: {
      text: '合上钱包',
      effect: { life: -6, villains: 2 },
      outcome: '你把钱包塞进最深的口袋。今晚，你出奇地狠。',
    },
  },

  // ---------------- 机制延伸（M3-B）：MJ 线 / 毒液·绿魔链收尾 / 英勇牺牲线 ----------------
  {
    id: 'card-mj-rooftop',
    speaker: '米歇尔·琼斯',
    text: '米歇尔在楼顶拦住你：「彼得最近总失踪。你和他……是同一个人，对吗？」',
    left: {
      text: '承认',
      effect: { life: 12, media: -6 },
      flag: 'flag-mj-knows',
      outcome: '她笑了笑：「我就知道。下次别一个人扛。」',
    },
    right: {
      text: '否认',
      effect: { life: -10, civilians: 4 },
      outcome: '你摇了摇头。她没再追问，只是多看了你一眼。',
    },
  },
  {
    id: 'card-mj-choice',
    speaker: '米歇尔·琼斯',
    text: '有人用米歇尔的安全换你现身。视频里她被按在墙角，对面说：「摘下面具，或者看她掉下去。」',
    once: true,
    condition: { flags: ['flag-mj-knows'] },
    left: {
      text: '公开求援',
      effect: { media: 12, civilians: -10 },
      death: 'death-public-shame',
    },
    right: {
      text: '独自营救',
      effect: { villains: 10, life: -12 },
      flag: 'flag-mj-rescued',
      outcome: '你用蛛丝卷走她。镜头拍到的，只有一道红蓝的影子。',
    },
  },
  {
    id: 'card-venom-legacy',
    speaker: '毒液',
    text: '毒液残留还在你血液里低语。科研所想要样本，说能造出「可控的守护者」。',
    once: true,
    condition: { flags: ['flag-has-venom'] },
    left: {
      text: '交出样本',
      effect: { villains: -10, media: 8, life: -4 },
      outcome: '你抽了血。三天后头条写「义警血液或成新药」——你希望他们别成功。',
    },
    right: {
      text: '彻底焚毁',
      effect: { villains: -6, life: -8 },
      outcome: '你烧掉了最后一滴。耳边安静了，可你总觉得少了点什么。',
    },
  },
  {
    id: 'card-goblin-echo',
    text: '收音机里偶尔还能听见绿魔的笑。你分不清是回声，还是自己太累了。',
    once: true,
    condition: { flags: ['flag-goblin-final'] },
    left: {
      text: '去找医生',
      effect: { life: 10, media: -4 },
      outcome: '医生说是创伤后应激。你笑着说是「英雄的职业病」。',
    },
    right: {
      text: '置之不理',
      effect: { life: -8, villains: 4 },
      outcome: '你关掉了收音机。可那笑声，关不掉。',
    },
  },
  {
    id: 'card-traded-hero',
    text: '一个陌生的老人挡在失控的卡车前。你来得及，但得用身体替他垫下那一记撞击。',
    once: true,
    condition: { stats: { life: { max: 30 } } },
    left: {
      text: '替他挡下',
      effect: { life: -16 },
      death: 'death-traded-places',
    },
    right: {
      text: '拉他避开',
      effect: { life: -8, civilians: 10 },
      outcome: '你们一起滚到路边。老人喘着气说「谢谢你，孩子」。',
    },
  },
  {
    id: 'card-last-swing',
    text: '洪水漫过地铁站，最后一名孩子卡在扶梯底下。你的蛛丝已经起了毛刺。',
    once: true,
    condition: { stats: { life: { max: 20 } } },
    left: {
      text: '用身体护住',
      effect: { life: -18 },
      death: 'death-last-swing',
    },
    right: {
      text: '先撤自己',
      effect: { life: 6, villains: -6 },
      outcome: '你退到安全处。孩子被后来的人救起——你告诉自己这就够了。',
    },
  },
] as const satisfies readonly Card[];
