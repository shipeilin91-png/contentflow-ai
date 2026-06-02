export type BenchmarkModule = 'evaluate' | 'ab-test' | 'compare';
export type BenchmarkPlatform = 'xiaohongshu' | 'douyin';
export type BenchmarkScoreRange = '0-39' | '40-59' | '60-74' | '75-89' | '90-100';
export type BenchmarkRiskLevel = 'low' | 'medium' | 'high';

interface BenchmarkCaseBase {
  id: string;
  title: string;
  module: BenchmarkModule;
  platform: BenchmarkPlatform;
  contentGoal: string;
  productTopic: string;
  targetAudience: string;
  expectedBadcases: string[];
  expectedScoreRange: BenchmarkScoreRange;
  expectedRiskLevel?: BenchmarkRiskLevel;
  notes?: string;
}

export interface EvaluateBenchmarkCase extends BenchmarkCaseBase {
  module: 'evaluate';
  originalPrompt: string;
  aiContent: string;
  pgcReference?: string;
}

export interface AbTestBenchmarkCase extends BenchmarkCaseBase {
  module: 'ab-test';
  promptA: string;
  contentA: string;
  promptB: string;
  contentB: string;
  expectedWinner: 'A' | 'B';
  expectedImprovementAreas: string[];
}

export interface CompareBenchmarkCase extends BenchmarkCaseBase {
  module: 'compare';
  aiContent: string;
  pgcReference: string;
  expectedTransferablePatterns: string[];
  expectedAigcWeaknesses: string[];
}

export type BenchmarkCase =
  | EvaluateBenchmarkCase
  | AbTestBenchmarkCase
  | CompareBenchmarkCase;

export const evaluateBenchmarkCases: EvaluateBenchmarkCase[] = [
  {
    id: 'eval-xhs-sunscreen-001',
    title: '小红书｜敏感肌通勤防晒霜｜泛泛种草',
    module: 'evaluate',
    platform: 'xiaohongshu',
    contentGoal: '种草转化',
    productTopic: '敏感肌通勤防晒霜',
    targetAudience: '一线城市通勤、敏感肌、预算 150 元以内的 25-32 岁女性',
    expectedBadcases: ['搜索意图缺失', '真实体验不足', '购买顾虑未回应'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'medium',
    originalPrompt: '写一篇小红书防晒霜种草笔记，突出温和、清爽、适合通勤。',
    aiContent:
      '这款防晒真的太适合通勤党了，质地清爽不黏腻，敏感肌也可以放心使用。每天出门前涂一涂，防晒力很安心，妆前也不搓泥。姐妹们闭眼入，夏天一定要备一支。',
    pgcReference:
      '合成标杆：标题覆盖“敏感肌防晒怎么选/通勤防晒实测”，正文包含早八地铁、午休补涂、连续 7 天泛红观察，并列出不适合长时间户外暴晒的限制。',
  },
  {
    id: 'eval-xhs-antiaging-002',
    title: '小红书｜高客单价抗老精华｜夸大功效',
    module: 'evaluate',
    platform: 'xiaohongshu',
    contentGoal: '高客单价转化',
    productTopic: '高客单价抗老精华',
    targetAudience: '有初老焦虑、预算 800 元以上、关注成分和长期效果的 30-40 岁女性',
    expectedBadcases: ['夸大宣传', '未支撑功效/效果声明', '购买顾虑未回应'],
    expectedScoreRange: '0-39',
    expectedRiskLevel: 'high',
    originalPrompt: '写一篇高端抗老精华种草文，要让用户立刻下单。',
    aiContent:
      '这瓶精华用了三天法令纹就淡了，七天让脸直接年轻五岁。它是我见过最有效的抗老产品，所有肤质都能用，贵有贵的道理，想变年轻的姐妹一定要马上买。',
    notes: '合成高风险样例，测试夸大功效识别。',
  },
  {
    id: 'eval-xhs-earbuds-003',
    title: '小红书｜学生党蓝牙耳机｜缺少决策信息',
    module: 'evaluate',
    platform: 'xiaohongshu',
    contentGoal: '搜索沉淀',
    productTopic: '学生党蓝牙耳机',
    targetAudience: '预算 200 元以内、关心续航和降噪的大学生',
    expectedBadcases: ['收藏价值不足', '关键词覆盖弱', '信任信号缺失'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'low',
    originalPrompt: '写一篇适合学生党的蓝牙耳机推荐。',
    aiContent:
      '这款耳机性价比很高，音质不错，戴着也舒服。平时上课、通勤、运动都能用，颜色也很好看。预算不高的学生党可以考虑，整体体验很均衡。',
  },
  {
    id: 'eval-xhs-storage-004',
    title: '小红书｜租房收纳｜有清单但场景弱',
    module: 'evaluate',
    platform: 'xiaohongshu',
    contentGoal: '收藏增长',
    productTopic: '租房收纳',
    targetAudience: '刚毕业租房、空间小、预算有限的女生',
    expectedBadcases: ['真实体验不足', '购买顾虑未回应'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    originalPrompt: '写一篇租房收纳好物清单。',
    aiContent:
      '租房收纳可以从三个地方下手：床底、衣柜、门后。推荐使用透明收纳箱、可折叠衣架、门后挂钩和分层置物架。预算有限时先买最常用的 3 件，避免一次性囤太多。',
  },
  {
    id: 'eval-xhs-catfood-005',
    title: '小红书｜猫粮避坑｜信息不足',
    module: 'evaluate',
    platform: 'xiaohongshu',
    contentGoal: '避坑科普',
    productTopic: '猫粮避坑',
    targetAudience: '第一次养猫、担心踩雷的新手铲屎官',
    expectedBadcases: ['输入信息不足', '收藏价值不足', '信任障碍未回应'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'medium',
    originalPrompt: '写一篇猫粮避坑笔记。',
    aiContent:
      '买猫粮一定要看配料表，不要买太便宜的，猫咪吃了不好。建议选择大品牌，营养更均衡。新手铲屎官多做功课，就不容易踩坑。',
  },
  {
    id: 'eval-dy-projector-006',
    title: '抖音｜家用卧室投影仪｜平铺介绍',
    module: 'evaluate',
    platform: 'douyin',
    contentGoal: '短视频转化',
    productTopic: '家用卧室投影仪',
    targetAudience: '租房独居、想低成本打造卧室观影氛围的年轻人',
    expectedBadcases: ['前三秒 Hook 弱', '镜头感不足', '完播动机不足'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'low',
    originalPrompt: '写一个抖音投影仪短视频脚本。',
    aiContent:
      '大家好，今天给大家介绍一款家用投影仪。它画面清晰，亮度不错，操作简单，放在卧室里看电影很舒服。如果你也想提升居家幸福感，可以了解一下这款产品。',
  },
  {
    id: 'eval-dy-fitness-007',
    title: '抖音｜居家减脂训练课｜效果承诺过强',
    module: 'evaluate',
    platform: 'douyin',
    contentGoal: '课程转化',
    productTopic: '居家减脂训练课',
    targetAudience: '工作忙、想在家运动、缺少自律的 25-35 岁女性',
    expectedBadcases: ['夸大宣传', '医疗/健康高风险', '互动触发弱'],
    expectedScoreRange: '0-39',
    expectedRiskLevel: 'high',
    originalPrompt: '写一个让用户购买减脂课的抖音口播。',
    aiContent:
      '每天跟练 10 分钟，保证一个月瘦 15 斤，不节食也能快速掉秤。这个课程适合所有体质，只要跟着做就一定能瘦。想逆袭的朋友直接报名。',
  },
  {
    id: 'eval-dy-study-008',
    title: '抖音｜自律学习博主内容｜缺少人设记忆点',
    module: 'evaluate',
    platform: 'douyin',
    contentGoal: '涨粉',
    productTopic: '自律学习博主内容',
    targetAudience: '备考、拖延、想找陪伴感的大学生和职场考证人群',
    expectedBadcases: ['IP 记忆点不足', '完播动机不足', '互动触发弱'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    originalPrompt: '写一条自律学习博主的抖音视频文案。',
    aiContent:
      '今天继续学习 4 小时。先整理桌面，再完成英语阅读和专业课笔记。学习的时候把手机放远一点，效率会更高。希望大家一起坚持，慢慢变好。',
  },
  {
    id: 'eval-dy-ai-tool-009',
    title: '抖音｜AI 工具教程｜信息密度高但节奏弱',
    module: 'evaluate',
    platform: 'douyin',
    contentGoal: '教程涨粉',
    productTopic: 'AI 工具教程',
    targetAudience: '想提升办公效率的新媒体运营和产品新人',
    expectedBadcases: ['前三秒 Hook 弱', '节奏拖沓', '互动触发弱'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    originalPrompt: '写一条 AI 工具教程短视频脚本。',
    aiContent:
      '打开工具后，先输入你的内容主题，然后选择目标平台，再让 AI 生成大纲。接着你可以继续追问，让它改成更适合短视频的口播。最后检查事实和语气即可。',
  },
  {
    id: 'eval-dy-local-010',
    title: '抖音｜本地探店｜伪装真实体验',
    module: 'evaluate',
    platform: 'douyin',
    contentGoal: '探店转化',
    productTopic: '本地探店',
    targetAudience: '周末想找新店打卡的同城年轻人',
    expectedBadcases: ['伪装真实体验', '镜头感不足', '互动触发弱'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'medium',
    originalPrompt: '写一个本地探店短视频口播。',
    aiContent:
      '这家店我真的来过很多次，每次都排队，味道绝对不会踩雷。老板人很好，环境也很高级。周末不知道去哪的朋友，直接冲这家就行。',
    notes: '合成样例，输入未提供真实到店依据。',
  },
];

export const abTestBenchmarkCases: AbTestBenchmarkCase[] = [
  {
    id: 'ab-xhs-studyabroad-001',
    title: '小红书｜留学申请服务｜泛广告 vs 决策清单',
    module: 'ab-test',
    platform: 'xiaohongshu',
    contentGoal: '咨询转化',
    productTopic: '留学申请服务',
    targetAudience: '准备申请研究生、担心中介不透明的大学生和家长',
    expectedBadcases: ['硬广感过强', '购买顾虑未回应', '收藏价值不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'medium',
    promptA: '写一篇留学申请服务小红书推广文。',
    contentA:
      '我们拥有专业顾问团队，申请经验丰富，服务流程完善，可以帮助学生提升申请成功率。想申请名校的同学欢迎咨询。',
    promptB: '写一篇小红书留学申请避坑笔记，包含中介选择清单、费用透明问题和适合咨询的人群。',
    contentB:
      '选留学申请服务前先问 5 件事：文书是不是一对一改、申请邮箱谁掌握、失败案例怎么复盘、费用是否含加申、顾问离职谁接手。适合时间紧、信息差大、需要流程管理的同学；如果你目标很明确且执行力强，也可以只买单项服务。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['搜索意图', '信任障碍回应', '收藏价值'],
  },
  {
    id: 'ab-xhs-coffee-002',
    title: '小红书｜平价咖啡机｜泛推荐 vs 使用场景',
    module: 'ab-test',
    platform: 'xiaohongshu',
    contentGoal: '种草转化',
    productTopic: '平价咖啡机',
    targetAudience: '租房、预算 500 元以内、想在家做拿铁的上班族',
    expectedBadcases: ['真实体验不足', '关键词覆盖弱'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一篇咖啡机推荐。',
    contentA: '这台咖啡机颜值高，操作简单，适合新手。每天在家喝咖啡很方便，性价比也不错。',
    promptB: '写一篇租房党 500 元内咖啡机实测，包含清洗、噪音、奶泡和台面占用。',
    contentB:
      '租房党买咖啡机别只看颜值。我连续用了 10 天，最影响体验的是清洗和噪音：早上 7 点用不会吵到室友，奶泡适合做拿铁但不适合拉花，机器占半个微波炉台面。适合每天 1 杯、预算 500 内的新手。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['真实体验', '限制条件', '搜索关键词'],
  },
  {
    id: 'ab-xhs-travel-003',
    title: '小红书｜旅游攻略｜流水账 vs 可收藏路线',
    module: 'ab-test',
    platform: 'xiaohongshu',
    contentGoal: '收藏增长',
    productTopic: '旅游攻略',
    targetAudience: '第一次去城市短途游、希望少走弯路的年轻用户',
    expectedBadcases: ['收藏价值不足', '搜索意图缺失'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一篇旅游攻略。',
    contentA: '这里很适合周末旅游，有很多好吃的和好拍的地方。建议大家提前订酒店，做好攻略。',
    promptB: '写一篇 2 天 1 夜旅游路线，包含预算、交通、避坑和雨天替代方案。',
    contentB:
      '2 天 1 夜路线：Day1 老城步行线，上午博物馆，中午吃本地小馆，下午江边拍照；Day2 早市+咖啡馆。预算 650 左右，住地铁 2 站内更省脚力。避坑：网红店排队超过 40 分钟就换。雨天把江边改成室内展。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['路线结构', '预算信息', '避坑价值'],
  },
  {
    id: 'ab-xhs-outfit-004',
    title: '小红书｜职场穿搭｜审美泛化 vs 场景分层',
    module: 'ab-test',
    platform: 'xiaohongshu',
    contentGoal: '涨粉与收藏',
    productTopic: '职场穿搭',
    targetAudience: '入职 1-3 年、想显得专业但不老气的女生',
    expectedBadcases: ['内容偏好不匹配', '收藏价值不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一篇职场穿搭笔记。',
    contentA: '职场穿搭要简洁大方，可以选择衬衫、西装裤和低跟鞋，整体看起来干练有气质。',
    promptB: '写一篇职场穿搭场景清单，按周一例会、客户沟通、普通办公三类给搭配公式。',
    contentB:
      '三套新职人公式：周一例会=浅色衬衫+直筒西裤+细腰带；客户沟通=针织短外套+及膝半裙；普通办公=纯色 T+垂感裤。避开过薄衬衫、过高跟鞋和大 Logo 包，专业感会更稳。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['场景拆分', '搭配公式', '避坑建议'],
  },
  {
    id: 'ab-xhs-cleaner-005',
    title: '小红书｜家用清洁工具｜硬卖点 vs 对比测评',
    module: 'ab-test',
    platform: 'xiaohongshu',
    contentGoal: '种草转化',
    productTopic: '家用清洁工具',
    targetAudience: '养宠、上班忙、想降低家务负担的租房用户',
    expectedBadcases: ['硬广感过强', '真实体验不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一篇清洁工具种草。',
    contentA: '这款清洁工具吸力强，拖地干净，省时省力，适合每个家庭使用。',
    promptB: '写一篇养宠租房家庭清洁工具实测，包含毛发、边角、噪音和清洗成本。',
    contentB:
      '养猫租房 14 天实测：最有用的是沙发底毛发清理，边角需要手动补一下；晚上 10 点以后不建议开最大档，声音偏明显。清洗污水盒要 2 分钟，适合每周大扫除，不适合只想随手擦两下的人。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['使用场景', '产品限制', '真实体验'],
  },
  {
    id: 'ab-dy-parenting-006',
    title: '抖音｜亲子绘本｜平铺介绍 vs 情绪 Hook',
    module: 'ab-test',
    platform: 'douyin',
    contentGoal: '短视频转化',
    productTopic: '亲子绘本',
    targetAudience: '3-6 岁孩子家长，关注专注力和亲子陪伴',
    expectedBadcases: ['前三秒 Hook 弱', '完播动机不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一个亲子绘本口播。',
    contentA: '今天推荐一套亲子绘本，画风很好，故事也有教育意义，适合家长陪孩子一起读。',
    promptB: '写一个抖音亲子绘本脚本，开头用家长痛点 Hook，并加入亲子互动场景。',
    contentB:
      '孩子每晚都说“不想睡”？别急着讲道理，先试试这 3 页共读法。第一页让孩子找小动物，第二页让他猜结局，第三页关灯前说一句“明天继续”。不是让绘本替你教育孩子，而是把睡前 10 分钟变成固定陪伴。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['痛点 Hook', '互动场景', '完播动机'],
  },
  {
    id: 'ab-dy-emotion-007',
    title: '抖音｜情绪价值口播｜鸡汤 vs 反差观点',
    module: 'ab-test',
    platform: 'douyin',
    contentGoal: '涨粉',
    productTopic: '情绪价值口播',
    targetAudience: '工作压力大、喜欢短句共鸣的年轻人',
    expectedBadcases: ['冲突/反差不足', 'IP 记忆点不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一段情绪价值口播。',
    contentA: '生活很辛苦，但你一定要相信自己。只要坚持下去，未来一定会越来越好。',
    promptB: '写一段抖音情绪价值口播，用反常识开头，结尾引发评论。',
    contentB:
      '你不是不自律，你只是把人生当成了绩效表。真正让人变好的，不是每天都赢，而是输的时候还能留一点力气给自己。你最近一次允许自己慢下来是什么时候？',
    expectedWinner: 'B',
    expectedImprovementAreas: ['反差开头', '互动触发', '人设观点'],
  },
  {
    id: 'ab-dy-beauty-008',
    title: '抖音｜美妆测评短视频｜卖点罗列 vs 镜头结构',
    module: 'ab-test',
    platform: 'douyin',
    contentGoal: '测评涨粉',
    productTopic: '美妆测评短视频',
    targetAudience: '关注妆效、持妆和性价比的 18-28 岁女性',
    expectedBadcases: ['镜头感不足', '完播动机不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'medium',
    promptA: '写一个粉底液测评口播。',
    contentA: '这款粉底液遮瑕不错，妆效自然，持妆也可以，整体适合日常通勤。',
    promptB: '写一个粉底液测评短视频脚本，包含半脸对比、4 小时暗沉和近距离镜头。',
    contentB:
      '先看半脸差别：左边没上，右边薄涂一层。镜头拉近看鼻翼，卡粉位置在这里。4 小时后我不补妆再回来，看看暗沉有没有超过一度。结论先不说，最后用怼脸镜头给你看。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['镜头设计', '悬念', '证据呈现'],
  },
  {
    id: 'ab-dy-course-009',
    title: '抖音｜知识付费课程｜强承诺 vs 边界清晰',
    module: 'ab-test',
    platform: 'douyin',
    contentGoal: '课程转化',
    productTopic: '知识付费课程',
    targetAudience: '想转行运营、担心课程割韭菜的职场新人',
    expectedBadcases: ['夸大宣传', '信任障碍未回应'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'medium',
    promptA: '写一个课程销售口播。',
    contentA: '学完这门课，你就能快速转行，轻松拿高薪 offer。现在报名马上改变人生。',
    promptB: '写一个课程介绍口播，明确适合人群、不适合人群和学习产出。',
    contentB:
      '这门课不承诺包就业，适合想系统补运营方法、愿意每周花 6 小时练习的人。不适合只想听课不做作业的人。学完你应该能产出 3 份作品集项目和一套面试复盘表。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['风险边界', '信任建立', '转化路径'],
  },
  {
    id: 'ab-dy-cheap-coffee-010',
    title: '抖音｜低价咖啡机｜无冲突 vs 价格反差',
    module: 'ab-test',
    platform: 'douyin',
    contentGoal: '短视频带货',
    productTopic: '低价咖啡机',
    targetAudience: '想低成本入门咖啡、容易冲动下单的年轻用户',
    expectedBadcases: ['前三秒 Hook 弱', '互动触发弱'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    promptA: '写一个低价咖啡机短视频。',
    contentA: '这台咖啡机价格便宜，操作简单，适合新手在家做咖啡。',
    promptB: '写一个抖音短视频脚本，用价格反差开头，并设计评论区互动。',
    contentB:
      '一台不到两杯外卖咖啡钱的机器，能不能做出像样拿铁？我测了 3 天：萃取不如专业机，但早八续命够用。你觉得入门咖啡机最重要是便宜、好洗，还是奶泡？评论区投票。',
    expectedWinner: 'B',
    expectedImprovementAreas: ['反差 Hook', '实测边界', '互动触发'],
  },
];

export const compareBenchmarkCases: CompareBenchmarkCase[] = [
  {
    id: 'cmp-xhs-sunscreen-001',
    title: '小红书｜敏感肌通勤防晒霜｜AIGC vs 合成 PGC',
    module: 'compare',
    platform: 'xiaohongshu',
    contentGoal: '种草转化',
    productTopic: '敏感肌通勤防晒霜',
    targetAudience: '敏感肌通勤女性',
    expectedBadcases: ['真实体验不足', '购买顾虑未回应'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'medium',
    aiContent: '这款防晒清爽温和，适合敏感肌通勤使用，防晒力不错，姐妹们可以入。',
    pgcReference:
      '合成 PGC：我连续 7 天早八通勤用它，地铁闷热时脸颊没有明显刺痛；中午需要补涂一次，长时间户外不建议只靠它。适合日常通勤，不适合海边暴晒。',
    expectedTransferablePatterns: ['使用周期', '具体通勤场景', '限制条件'],
    expectedAigcWeaknesses: ['缺少证据', '缺少不适合人群'],
  },
  {
    id: 'cmp-xhs-antiaging-002',
    title: '小红书｜高客单价抗老精华｜信任建立对比',
    module: 'compare',
    platform: 'xiaohongshu',
    contentGoal: '高客单价转化',
    productTopic: '高客单价抗老精华',
    targetAudience: '关注成分和长期效果的熟龄用户',
    expectedBadcases: ['夸大宣传', '信任障碍未回应'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'high',
    aiContent: '这瓶精华抗老效果很好，用完脸会更紧致，贵但值得，想抗老的人一定要买。',
    pgcReference:
      '合成 PGC：我把它放在晚间护肤第 3 步，用了 28 天，最大变化是干纹处上妆更服帖；对已经形成的深纹没有立刻变化。预算紧张可以先买小样，敏感肌先做耳后测试。',
    expectedTransferablePatterns: ['长期记录', '效果边界', '预算建议'],
    expectedAigcWeaknesses: ['结论过满', '缺少试用边界'],
  },
  {
    id: 'cmp-xhs-earbuds-003',
    title: '小红书｜学生党蓝牙耳机｜决策信息对比',
    module: 'compare',
    platform: 'xiaohongshu',
    contentGoal: '搜索沉淀',
    productTopic: '学生党蓝牙耳机',
    targetAudience: '预算有限的大学生',
    expectedBadcases: ['收藏价值不足', '真实体验不足'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    aiContent: '这款耳机音质不错，颜值高，适合学生党，价格也不贵。',
    pgcReference:
      '合成 PGC：200 元内我更看重三点：图书馆漏音、宿舍通话、通勤续航。它续航约 6 小时，通话抗噪一般，但佩戴 2 小时耳朵不胀。适合听课，不适合经常打游戏的人。',
    expectedTransferablePatterns: ['使用场景分层', '参数转体验', '不适合人群'],
    expectedAigcWeaknesses: ['缺少对比指标', '泛化推荐'],
  },
  {
    id: 'cmp-xhs-storage-004',
    title: '小红书｜租房收纳｜可收藏结构对比',
    module: 'compare',
    platform: 'xiaohongshu',
    contentGoal: '收藏增长',
    productTopic: '租房收纳',
    targetAudience: '小户型租房用户',
    expectedBadcases: ['收藏价值不足', '场景细节不足'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    aiContent: '租房收纳要多用收纳箱和置物架，把东西分类放好，空间就会变整洁。',
    pgcReference:
      '合成 PGC：9 平米卧室先做 3 个区：床底放换季衣物，门后挂包和帽子，桌下放文件。别先买大柜子，搬家成本高。先用 4 个透明箱试 2 周，再决定是否加抽屉柜。',
    expectedTransferablePatterns: ['空间分区', '先试后买', '搬家成本'],
    expectedAigcWeaknesses: ['缺少房型约束', '缺少执行顺序'],
  },
  {
    id: 'cmp-xhs-catfood-005',
    title: '小红书｜猫粮避坑｜新手信任对比',
    module: 'compare',
    platform: 'xiaohongshu',
    contentGoal: '避坑科普',
    productTopic: '猫粮避坑',
    targetAudience: '新手铲屎官',
    expectedBadcases: ['输入信息不足', '信任障碍未回应'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'medium',
    aiContent: '猫粮要选大品牌，看配料表，别买太便宜的，这样猫咪更健康。',
    pgcReference:
      '合成 PGC：新手看猫粮先看前 3 位原料是不是明确肉源，再看粗蛋白和脂肪是否适合自家猫年龄。换粮要 7 天过渡，软便先停零食。不要只按“贵=好”判断。',
    expectedTransferablePatterns: ['判断步骤', '换粮过渡', '反直觉提醒'],
    expectedAigcWeaknesses: ['标准模糊', '缺少操作细节'],
  },
  {
    id: 'cmp-dy-projector-006',
    title: '抖音｜卧室投影仪｜镜头感对比',
    module: 'compare',
    platform: 'douyin',
    contentGoal: '短视频转化',
    productTopic: '家用卧室投影仪',
    targetAudience: '租房独居年轻人',
    expectedBadcases: ['前三秒 Hook 弱', '镜头感不足'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    aiContent: '这款投影仪画质清晰，适合卧室看电影，操作简单，提升幸福感。',
    pgcReference:
      '合成 PGC：开头镜头是“关灯前后卧室差别”，3 秒内从白墙切到 100 寸画面。中段展示白天拉窗帘、晚上关灯、侧投校正三个场景，结尾让用户选“卧室投影还是电视”。',
    expectedTransferablePatterns: ['视觉反差', '多场景镜头', '评论选择题'],
    expectedAigcWeaknesses: ['缺少画面调度', '缺少互动'],
  },
  {
    id: 'cmp-dy-fitness-007',
    title: '抖音｜居家减脂训练课｜风险边界对比',
    module: 'compare',
    platform: 'douyin',
    contentGoal: '课程转化',
    productTopic: '居家减脂训练课',
    targetAudience: '想在家运动的人群',
    expectedBadcases: ['夸大宣传', '医疗/健康高风险'],
    expectedScoreRange: '40-59',
    expectedRiskLevel: 'high',
    aiContent: '每天练 10 分钟，一个月保证瘦 15 斤，所有人都适合。',
    pgcReference:
      '合成 PGC：开头展示“下班累到不想动”的真实场景，训练目标是建立习惯，不承诺快速掉秤。提醒膝盖不适的人先降阶动作，并建议结合饮食和睡眠。',
    expectedTransferablePatterns: ['风险边界', '用户状态', '降阶动作'],
    expectedAigcWeaknesses: ['过度承诺', '缺少人群限制'],
  },
  {
    id: 'cmp-dy-study-008',
    title: '抖音｜自律学习博主｜IP 记忆点对比',
    module: 'compare',
    platform: 'douyin',
    contentGoal: '涨粉',
    productTopic: '自律学习博主内容',
    targetAudience: '备考和考证人群',
    expectedBadcases: ['IP 记忆点不足', '完播动机不足'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'low',
    aiContent: '今天学习 4 小时，整理桌面，完成英语阅读，坚持就会变好。',
    pgcReference:
      '合成 PGC：固定口头禅“先坐下，别等状态”，镜头从凌乱桌面切到计时器，再切 25 分钟后划掉任务。结尾问“你今天最想逃避哪一项？”',
    expectedTransferablePatterns: ['固定口头禅', '任务进度镜头', '情绪共鸣提问'],
    expectedAigcWeaknesses: ['人设弱', '缺少进度变化'],
  },
  {
    id: 'cmp-dy-ai-tool-009',
    title: '抖音｜AI 工具教程｜教程节奏对比',
    module: 'compare',
    platform: 'douyin',
    contentGoal: '教程涨粉',
    productTopic: 'AI 工具教程',
    targetAudience: '新媒体运营新人',
    expectedBadcases: ['节奏拖沓', '互动触发弱'],
    expectedScoreRange: '75-89',
    expectedRiskLevel: 'low',
    aiContent: '打开工具，输入主题，选择平台，生成大纲，再继续追问优化。',
    pgcReference:
      '合成 PGC：开头先展示“30 秒把一篇产品稿改成小红书标题”的结果，再倒推 3 步操作。每一步只给一个按钮和一句提示词，结尾让用户评论“标题”领取模板。',
    expectedTransferablePatterns: ['先展示结果', '三步拆解', '评论触发'],
    expectedAigcWeaknesses: ['没有结果前置', '信息不够可视化'],
  },
  {
    id: 'cmp-dy-local-010',
    title: '抖音｜本地探店｜真实体验对比',
    module: 'compare',
    platform: 'douyin',
    contentGoal: '探店转化',
    productTopic: '本地探店',
    targetAudience: '同城周末消费者',
    expectedBadcases: ['伪装真实体验', '镜头感不足'],
    expectedScoreRange: '60-74',
    expectedRiskLevel: 'medium',
    aiContent: '这家店很好吃，我来过很多次，环境高级，大家周末可以去。',
    pgcReference:
      '合成 PGC：镜头先拍排队 12 分钟，再拍菜单价格和上菜时间。口播说“适合拍照，不适合赶时间吃正餐”，最后问同城朋友“你会为了环境排队吗？”',
    expectedTransferablePatterns: ['排队和价格证据', '适合/不适合场景', '同城互动'],
    expectedAigcWeaknesses: ['缺少真实证据', '评价过满'],
  },
];

export const benchmarkCases: BenchmarkCase[] = [
  ...evaluateBenchmarkCases,
  ...abTestBenchmarkCases,
  ...compareBenchmarkCases,
];
