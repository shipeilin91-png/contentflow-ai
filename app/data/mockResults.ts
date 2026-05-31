// ── Type Definitions ──────────────────────────────────────────────
export interface AudiencePersona {
  userIntent: string;
  psychologicalNeeds: string[];
  trustBarriers: string[];
  dislikedExpressions: string[];
  contentPreference: string;
}

export interface TriFlowScores {
  platformFit: number;
  audienceFit: number;
  creatorGoalFit: number;
  overallEffectiveness: number;
}

export interface BadcaseItem {
  layer: 'platform' | 'audience' | 'creator';
  type: string;
  evidence: string;
  fix: string;
  badcaseTag?: string;
  badcaseLabel?: string;
}

export interface PromptV2 {
  optimizedPrompt: string;
  changeReasons: string[];
  expectedImprovements: string[];
}

export interface EvaluationResult {
  audiencePersona: AudiencePersona;
  triFlowScores: TriFlowScores;
  badcases: BadcaseItem[];
  promptV2: PromptV2;
}

// ── XiaoHongShu Mock Result ───────────────────────────────────────
const xiaohongshuResult: EvaluationResult = {
  audiencePersona: {
    userIntent: '搜索发现 → 信息对比 → 信任验证 → 决策收藏',
    psychologicalNeeds: [
      '真实性验证：需要看到真人真实体验，而非精致广告图',
      '信息密度：希望在有限篇幅内获取最大有效信息量',
      '避坑心理：比起"什么好"，更想知道"什么不好/怎么选"',
      '社交认同：通过点赞收藏数判断内容可信度',
    ],
    trustBarriers: [
      '过度修图/滤镜 → 真实感缺失',
      '缺乏使用场景/时间线 → 可信度下降',
      '结论模糊、各打五十大板 → 决策价值低',
    ],
    dislikedExpressions: [
      '“绝绝子”“YYDS”等无信息量感叹词',
      '品牌方话术：官方卖点罗列',
      '无对比、无场景的孤立推荐',
    ],
    contentPreference:
      '清单体/对比体 > 叙事体；高信息密度 > 情绪渲染；真实场景实拍 > 精修棚拍',
  },
  triFlowScores: {
    platformFit: 55,
    audienceFit: 42,
    creatorGoalFit: 48,
    overallEffectiveness: 48,
  },
  badcases: [
    {
      layer: 'platform',
      type: '搜索意图缺失',
      badcaseTag: 'search_intent_missing',
      badcaseLabel: '搜索意图缺失',
      evidence:
        '内容未覆盖关键词"xx护肤品怎么样""xx值得买吗"等搜索高意图词',
      fix: '标题和首段植入用户搜索词，如"干皮秋冬面霜实测｜A vs B 30天对比"',
    },
    {
      layer: 'platform',
      type: '收藏价值不足',
      badcaseTag: 'save_worthiness_low',
      badcaseLabel: '收藏价值不足',
      evidence: '全文无清单/对比表格/步骤总结等可收藏结构',
      fix: '增加"3 款面霜横向对比表格"或"干皮选面霜 Check List"',
    },
    {
      layer: 'audience',
      type: '信任信号缺失',
      badcaseTag: 'trust_detail_weak',
      badcaseLabel: '真实体验不足',
      evidence: '无使用前后对比、无使用周期记录、无具体使用场景',
      fix: '增加"使用 14 天皮肤水份值变化记录"和早晚使用场景描述',
    },
    {
      layer: 'audience',
      type: '决策感模糊',
      badcaseTag: 'trust_barrier_unresolved',
      badcaseLabel: '购买顾虑未回应',
      evidence: '结论为"都不错，看个人喜好"，未给出明确选择建议',
      fix: '按肤质/预算/场景给出明确推荐，如"预算 200 以内选 A，追求功效选 B"',
    },
    {
      layer: 'creator',
      type: '软种草力度不足',
      badcaseTag: 'hard_sell_tone',
      badcaseLabel: '硬广感过强',
      evidence: '产品卖点堆砌，缺乏个人体验叙事，读起来像产品说明书',
      fix: '以个人使用日记视角重写，先抛体验结论再展开细节',
    },
  ],
  promptV2: {
    optimizedPrompt: `你是一个小红书内容创作者，正在为一款[产品名称]撰写一篇"真实使用体验+横向对比"笔记。

【内容要求】
1. 标题采用搜索友好格式："[产品]真的值得买吗？X 天实测对比 [竞品]"
2. 首段直接给出结论，满足"不想看长文就想知道答案"的用户
3. 正文包含：
   - 使用时间线和场景（如：每天早上洁面后使用，连续 14 天）
   - 关键指标变化（水份值/肤感/出油情况等，可用大致数值）
   - 与 1-2 款竞品的横向对比表格（功效/价格/适合肤质/推荐指数）
   - 1-2 个小缺点（增加真实感）
4. 结尾给出明确选择建议："如果你 XX，选 A；如果你 XX，选 B"
5. 文末附"划重点"清单（3-5 条核心结论，方便收藏）
6. 全程以第一人称"我"的体验视角写作
7. 避免：品牌方话术、形容词堆砌、无信息量感叹词、过度修图感描述`,
    changeReasons: [
      '增加搜索关键词密度，提升搜索曝光',
      '加入对比表格和 Checklist 提升收藏价值',
      '以第一人称体验叙事替代品牌卖点罗列',
      '给出明确选择建议，提升决策参考价值',
      '增加使用时间线和数据变化，建立信任',
    ],
    expectedImprovements: [
      '搜索曝光提升：预估覆盖 5-8 个长尾搜索词',
      '收藏率提升：从 2% 预估提升至 6-8%',
      '信任转化提升：评论区咨询量预估提升 50%',
      'Platform Fit 预估从 55 分提升至 80+',
    ],
  },
};

// ── Douyin Mock Result ────────────────────────────────────────────
const douyinResult: EvaluationResult = {
  audiencePersona: {
    userIntent: '被动推荐 → 兴趣唤醒 → 情绪驱动 → 冲动互动',
    psychologicalNeeds: [
      '注意力竞争：前 3 秒决定划走还是停留',
      '情绪价值：需要刺激（好奇/反差/共鸣/冲突）才能看完',
      '轻决策：门槛越低越容易点赞/关注/分享',
      '圈层归属：内容需匹配用户自我标签和圈层认同',
    ],
    trustBarriers: [
      '开头无钩子 → 0.5 秒划走',
      '节奏拖沓 → 完播率断崖下降',
      '过度营销感 → 评论区翻车',
    ],
    dislikedExpressions: [
      '平铺直叙的科普/说明书',
      '无情绪起伏的朗读式口播',
      '硬广植入，无内容价值',
    ],
    contentPreference:
      '反差/冲突开场 > 平铺叙事；快节奏 > 慢讲解；强情绪 > 理性罗列',
  },
  triFlowScores: {
    platformFit: 38,
    audienceFit: 35,
    creatorGoalFit: 45,
    overallEffectiveness: 39,
  },
  badcases: [
    {
      layer: 'platform',
      type: '缺失 3 秒 Hook',
      badcaseTag: 'hook_weak',
      badcaseLabel: '前三秒 Hook 弱',
      evidence: '视频前 3 秒为品牌 Logo 展示，无任何信息/情绪钩子',
      fix: '以冲突句开头，如"花 1000 块买的面霜，还不如 50 块的？"',
    },
    {
      layer: 'platform',
      type: '完播动机不足',
      badcaseTag: 'completion_drive_low',
      badcaseLabel: '完播动机不足',
      evidence: '全程平铺介绍产品卖点，无节奏变化、无信息差悬念',
      fix: '设置悬念结构：先抛出问题→放大痛点→揭晓方案→效果验证',
    },
    {
      layer: 'audience',
      type: '缺乏反差/冲突',
      badcaseTag: 'conflict_contrast_weak',
      badcaseLabel: '冲突/反差不足',
      evidence: '内容为纯正面介绍，没有对比冲突，用户无情绪波动',
      fix: '加入"贵价 vs 平价实测""宣传效果 vs 真实效果"反差对比',
    },
    {
      layer: 'audience',
      type: 'IP 记忆点缺失',
      badcaseTag: 'ip_memory_weak',
      badcaseLabel: 'IP 记忆点不足',
      evidence: '口播风格无辨识度，看完记不住是谁说的',
      fix: '加入标志性口头禅/动作/视觉符号，强化个人 IP 辨识度',
    },
    {
      layer: 'creator',
      type: '互动引导薄弱',
      badcaseTag: 'interaction_trigger_weak',
      badcaseLabel: '互动触发弱',
      evidence: '仅在结尾说"点赞关注"，未设计引发互动的钩子',
      fix: '抛出争议性问题引导评论，如"你们觉得这个价格值吗？评论区告诉我"',
    },
  ],
  promptV2: {
    optimizedPrompt: `你是一个抖音内容创作者，正在制作一条[产品/主题]相关的短视频口播脚本。

【内容结构】
1. 【0-3 秒｜Hook】以冲突句/反差句/反常识句开头
   - 示例："这个东西全网都在推，但我用了 7 天发现一个 bug"
   - 示例："花 1000 和 50 块买的 X，区别到底有多大？"
2. 【3-15 秒｜痛点放大】描述用户最在意的痛点，建立共鸣
3. 【15-25 秒｜解决方案】引出产品/方法，给出核心卖点（不超过 3 个）
4. 【25-35 秒｜效果验证】真实使用对比/实测数据/使用场景
5. 【35-45 秒｜互动引导】抛出争议性问题或投票，引导评论区讨论
6. 【45-50 秒｜IP 记忆点】标志性口号/动作结束

【风格要求】
- 节奏：每 3-5 秒一个信息点或情绪转换，避免平铺
- 语气：像和朋友聊天，不用播音腔
- 视觉提示：标注需要配合画面切换/文字弹幕的时刻
- 互动钩子：设计 2 个以上引发评论的点

【避免】
- 品牌广告片风格
- 朗读式口播
- 信息量过低的内容水词
- 超过 60 秒（除非是系列深度内容）`,
    changeReasons: [
      '增加 3 秒冲突 Hook 提升停留率',
      '快节奏分段结构提升完播率',
      '加入反差对比增加内容记忆度',
      '设计互动钩子驱动评论/分享',
      'IP 记忆点强化账号辨识度',
    ],
    expectedImprovements: [
      '前 3 秒完播率预估从 30% 提升至 60%+',
      '整体完播率预估从 15% 提升至 35%+',
      '互动率（评赞转）预估提升 3-5 倍',
      'Platform Fit 预估从 38 分提升至 75+',
    ],
  },
};

// ── Generate result based on platform ─────────────────────────────
export function getMockResult(platform: string): EvaluationResult {
  if (platform === '抖音') {
    return JSON.parse(JSON.stringify(douyinResult));
  }
  // Default to 小红书
  return JSON.parse(JSON.stringify(xiaohongshuResult));
}
