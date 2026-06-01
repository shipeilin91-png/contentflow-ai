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

export interface Confidence {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  reviewRequired: boolean;
  riskTypes: string[];
  reasons: string[];
}

export interface MultiJudge {
  judgeType: 'platform' | 'audience' | 'creator' | 'risk';
  name: string;
  score: number;
  verdict: 'pass' | 'needs_revision' | 'high_risk';
  keyConcern: string;
  evidence: string;
  recommendation: string;
}

export interface JudgeAgreement {
  level: 'high' | 'medium' | 'low';
  scoreSpread: number;
  summary: string;
  reviewRequired: boolean;
}

export interface MultiJudgeResult {
  judges: MultiJudge[];
  agreement: JudgeAgreement;
}

export interface LocalizedEvaluation {
  audiencePersona?: Partial<AudiencePersona>;
  badcases?: Partial<Pick<BadcaseItem, 'type' | 'badcaseLabel' | 'evidence' | 'fix'>>[];
  promptV2?: Partial<PromptV2>;
  confidence?: {
    reasons?: string[];
  };
  riskAssessment?: {
    reasons?: string[];
    riskTypeLabels?: string[];
  };
  multiJudge?: {
    judges?: Partial<Pick<MultiJudge, 'keyConcern' | 'evidence' | 'recommendation'>>[];
    agreementSummary?: string;
  };
  summary?: string;
}

export interface EvaluationResult {
  audiencePersona: AudiencePersona;
  triFlowScores: TriFlowScores;
  badcases: BadcaseItem[];
  promptV2: PromptV2;
  confidence?: Confidence;
  riskAssessment?: RiskAssessment;
  multiJudge?: MultiJudgeResult;
  localized?: {
    zh: LocalizedEvaluation;
    en: LocalizedEvaluation;
  };
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
      '“绝绝子”“永远的神”等无信息量感叹词',
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
      fix: '标题和首段植入用户搜索词，如"干皮秋冬面霜实测｜两款产品 30 天对比"',
    },
    {
      layer: 'platform',
      type: '收藏价值不足',
      badcaseTag: 'save_worthiness_low',
      badcaseLabel: '收藏价值不足',
      evidence: '全文无清单/对比表格/步骤总结等可收藏结构',
      fix: '增加"3 款面霜横向对比表格"或"干皮选面霜检查清单"',
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
1. 标题采用搜索友好格式："[产品]真的值得买吗？连续多天实测对比 [竞品]"
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
      '加入对比表格和检查清单，提升收藏价值',
      '以第一人称体验叙事替代品牌卖点罗列',
      '给出明确选择建议，提升决策参考价值',
      '增加使用时间线和数据变化，建立信任',
    ],
    expectedImprovements: [
      '搜索曝光提升：预估覆盖 5-8 个长尾搜索词',
      '收藏率提升：从 2% 预估提升至 6-8%',
      '信任转化提升：评论区咨询量预估提升 50%',
      '平台适配分预估从 55 分提升至 80 分以上',
    ],
  },
  confidence: {
    score: 65,
    level: 'medium' as const,
    reasons: [
      '缺少真实体验细节，部分种草表达缺少证据支撑',
      '用户输入信息长度中等，部分判断依赖模式识别而非内容证据',
    ],
  },
  riskAssessment: {
    riskLevel: 'medium' as const,
    reviewRequired: false,
    riskTypes: ['unsupported_claim', 'fake_experience'],
    reasons: [
      '部分种草表达接近品牌话术，缺少第一人称体验证据',
      '没有出现明显合规红线，但真实感不足可能引发用户信任问题',
    ],
  },
  multiJudge: {
    judges: [
      {
        judgeType: 'platform' as const,
        name: '平台适配评审',
        score: 50,
        verdict: 'needs_revision' as const,
        keyConcern: '搜索意图缺失 + 收藏价值不足',
        evidence: '全文中未出现用户会主动搜索的关键词，也无对比表格或收藏结构',
        recommendation: '标题嵌入搜索词，文末增加"划重点"清单或对比表',
      },
      {
        judgeType: 'audience' as const,
        name: '受众心理评审',
        score: 42,
        verdict: 'needs_revision' as const,
        keyConcern: '购买顾虑未回应 + 决策价值模糊',
        evidence: '未说明适合/不适合人群，也未回应用户对价格和效果的潜在顾虑',
        recommendation: '明确写出 1-2 个不适合场景，按预算/肤质给出选择建议',
      },
      {
        judgeType: 'creator' as const,
        name: '创作者目标评审',
        score: 48,
        verdict: 'needs_revision' as const,
        keyConcern: '软种草路径不完整',
        evidence: '卖点堆砌多，第一人称体验叙事少，读起来像产品说明书而非个人分享',
        recommendation: '以个人使用日记视角重写，先抛体验结论再展开具体细节',
      },
      {
        judgeType: 'risk' as const,
        name: '风险边界评审',
        score: 65,
        verdict: 'needs_revision' as const,
        keyConcern: '部分描述缺少体验证据支撑',
        evidence: '未出现合规红线，但种草表达缺少第一人称证据，用户可能质疑真实性',
        recommendation: '补充使用周期和时间线描述，避免过度承诺产品效果',
      },
    ],
    agreement: {
      level: 'medium' as const,
      scoreSpread: 23,
      summary: '四个评审维度分数存在中等分歧（23 分差），主要分歧集中在平台适配与受众心理之间',
      reviewRequired: false,
    },
  },
  localized: {
    zh: {
      summary: '当前内容有基础信息，但搜索意图、收藏价值和真实体验信号不足，建议先补强证据和决策结构。',
    },
    en: {
      audiencePersona: {
        userIntent: 'Search discovery -> information comparison -> trust validation -> save for decision-making',
        psychologicalNeeds: [
          'Authenticity validation: users need to see real experience rather than polished ad-style claims.',
          'Information density: users want useful details in a compact format.',
          'Risk avoidance: users care more about what to avoid and how to choose than broad praise.',
          'Social proof: saves, comments, and concrete details help users judge credibility.',
        ],
        trustBarriers: [
          'Over-polished visuals reduce perceived authenticity.',
          'Missing usage scenarios or timelines weakens trust.',
          'Vague conclusions lower decision value.',
        ],
        dislikedExpressions: [
          'Empty hype words without useful information.',
          'Brand-style feature lists.',
          'Isolated recommendations without comparison or context.',
        ],
        contentPreference:
          'Checklist and comparison formats over narrative-only posts; high information density over emotional decoration; real scenarios over polished studio presentation.',
      },
      badcases: [
        {
          type: 'Missing search intent',
          badcaseLabel: 'Missing search intent',
          evidence: 'The content does not cover high-intent search phrases such as product reviews, worth buying, or comparison terms.',
          fix: 'Add search-friendly terms in the title and opening, such as a multi-day comparison for dry-skin winter cream.',
        },
        {
          type: 'Low save value',
          badcaseLabel: 'Low save value',
          evidence: 'The content lacks checklist, comparison table, steps, or summary structures worth saving.',
          fix: 'Add a comparison table or a short product-selection checklist for the target audience.',
        },
        {
          type: 'Weak trust signals',
          badcaseLabel: 'Insufficient real experience',
          evidence: 'There is no before/after comparison, usage timeline, or concrete scenario.',
          fix: 'Add a 14-day usage timeline, morning/evening scenarios, and observable changes.',
        },
        {
          type: 'Unclear decision guidance',
          badcaseLabel: 'Purchase concerns not addressed',
          evidence: 'The conclusion stays vague and does not provide a clear choice recommendation.',
          fix: 'Give recommendations by skin type, budget, and usage scenario.',
        },
        {
          type: 'Weak soft recommendation path',
          badcaseLabel: 'Too promotional',
          evidence: 'The content stacks product selling points and reads like a product manual.',
          fix: 'Rewrite from a first-person usage diary perspective, starting with the experience conclusion.',
        },
      ],
      promptV2: {
        optimizedPrompt: `You are a Xiaohongshu content creator writing a post for [product name] using a real experience plus comparison format.

Requirements:
1. Use a search-friendly title such as "[Product] is it worth buying? Multi-day test vs [competitor]".
2. Give the conclusion in the first paragraph for users who want a quick answer.
3. Include usage timeline, concrete scenarios, observable changes, comparison with 1-2 competitors, and 1-2 minor drawbacks.
4. End with clear recommendations by skin type, budget, or scenario.
5. Add a short key-takeaways checklist for saving.
6. Write in first person and avoid brand-style claims or empty hype.`,
        changeReasons: [
          'Increase search keyword coverage for search-driven discovery.',
          'Add comparison and checklist structures to improve save value.',
          'Replace brand-style selling points with first-person experience.',
          'Give clear decision guidance for different user scenarios.',
          'Add usage timeline and observable details to build trust.',
        ],
        expectedImprovements: [
          'Search exposure may cover more long-tail intent keywords.',
          'Save rate is expected to improve because the content becomes more reference-worthy.',
          'Trust-driven comments and product questions may increase.',
          'Platform Fit is expected to improve after restructuring.',
        ],
      },
      confidence: {
        reasons: [
          'Some recommendation statements lack concrete experience evidence.',
          'The input has moderate detail, so part of the judgment depends on pattern recognition.',
        ],
      },
      riskAssessment: {
        riskTypeLabels: ['Unsupported effect or performance claim', 'Simulated real experience'],
        reasons: [
          'Some recommendation language is close to brand copy and lacks first-person evidence.',
          'No obvious compliance red line appears, but weak authenticity may reduce user trust.',
        ],
      },
      multiJudge: {
        judges: [
          {
            keyConcern: 'Missing search intent and low save value',
            evidence: 'The content lacks active-search keywords and save-worthy comparison structures.',
            recommendation: 'Add search terms in the title and a key-takeaways checklist or comparison table.',
          },
          {
            keyConcern: 'Purchase concerns are not addressed',
            evidence: 'The content does not explain suitable or unsuitable users or answer price/effect concerns.',
            recommendation: 'State unsuitable scenarios and give choices by budget or skin type.',
          },
          {
            keyConcern: 'Incomplete soft recommendation path',
            evidence: 'The content reads more like a product manual than a personal sharing post.',
            recommendation: 'Rewrite from a first-person usage diary perspective.',
          },
          {
            keyConcern: 'Some claims lack experience evidence',
            evidence: 'No severe compliance issue is visible, but proof for authenticity is limited.',
            recommendation: 'Add usage timeline and avoid overpromising product effects.',
          },
        ],
        agreementSummary: 'The judges show medium disagreement, mainly between platform fit and audience psychology.',
      },
      summary: 'The content has basic information, but search intent, save value, and authenticity signals need to be strengthened before publishing.',
    },
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
      type: '缺失前三秒钩子',
      badcaseTag: 'hook_weak',
      badcaseLabel: '前三秒钩子弱',
      evidence: '视频前 3 秒为品牌标识展示，无任何信息或情绪钩子',
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
      fix: '加入"贵价和平价实测""宣传效果和真实效果"反差对比',
    },
    {
      layer: 'audience',
      type: '账号记忆点缺失',
      badcaseTag: 'ip_memory_weak',
      badcaseLabel: '账号记忆点不足',
      evidence: '口播风格无辨识度，看完记不住是谁说的',
      fix: '加入标志性口头禅、动作或视觉符号，强化账号辨识度',
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
1. 【0-3 秒｜钩子】以冲突句/反差句/反常识句开头
   - 示例："这个东西全网都在推，但我用了 7 天发现一个问题"
   - 示例："花 1000 和 50 块买的同类产品，区别到底有多大？"
2. 【3-15 秒｜痛点放大】描述用户最在意的痛点，建立共鸣
3. 【15-25 秒｜解决方案】引出产品/方法，给出核心卖点（不超过 3 个）
4. 【25-35 秒｜效果验证】真实使用对比/实测数据/使用场景
5. 【35-45 秒｜互动引导】抛出争议性问题或投票，引导评论区讨论
6. 【45-50 秒｜账号记忆点】用标志性口号或动作结束

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
      '增加 3 秒冲突钩子提升停留率',
      '快节奏分段结构提升完播率',
      '加入反差对比增加内容记忆度',
      '设计互动钩子驱动评论/分享',
      '账号记忆点强化账号辨识度',
    ],
    expectedImprovements: [
      '前 3 秒完播率预估从 30% 提升至 60%+',
      '整体完播率预估从 15% 提升至 35%+',
      '互动率（评赞转）预估提升 3-5 倍',
      '平台适配分预估从 38 分提升至 75 分以上',
    ],
  },
  confidence: {
    score: 60,
    level: 'medium' as const,
    reasons: [
      '脚本信息较短，开头钩子与完播判断需要结合真实视频表现复核',
      '口播脚本缺少实际镜头表现，部分节奏判断依赖文本推断',
    ],
  },
  riskAssessment: {
    riskLevel: 'low' as const,
    reviewRequired: false,
    riskTypes: ['low_context_confidence'],
    reasons: [
      '短视频脚本缺少实际视频素材参考，完播和互动判断存在不确定性',
      '没有出现明显合规红线或虚假宣传表述',
    ],
  },
  multiJudge: {
    judges: [
      {
        judgeType: 'platform' as const,
        name: '平台适配评审',
        score: 42,
        verdict: 'needs_revision' as const,
        keyConcern: '前三秒钩子弱 + 完播动机不足',
        evidence: '脚本以品牌标识开场，缺少冲突、反差或痛点钩子，全程平铺直叙',
        recommendation: '以冲突句开头，替换品牌标识开场，设置悬念递进结构',
      },
      {
        judgeType: 'audience' as const,
        name: '受众心理评审',
        score: 38,
        verdict: 'needs_revision' as const,
        keyConcern: '情绪触发不够强',
        evidence: '内容无反差对比，用户观看中无情绪波动，容易被划走',
        recommendation: '加入"贵价和平价"或"宣传效果和真实效果"对比片段',
      },
      {
        judgeType: 'creator' as const,
        name: '创作者目标评审',
        score: 45,
        verdict: 'needs_revision' as const,
        keyConcern: '账号记忆点不足 + 互动引导弱',
        evidence: '口播风格无辨识度，结尾仅"点赞关注"无互动钩子',
        recommendation: '加入标志性口头禅/动作，设计争议性问题引导评论',
      },
      {
        judgeType: 'risk' as const,
        name: '风险边界评审',
        score: 72,
        verdict: 'pass' as const,
        keyConcern: '文本阶段无明显风险',
        evidence: '未出现合规红线或虚假宣传，但脚本缺少实际视频素材验证',
        recommendation: '拍摄后复核口播节奏和实际画面表现',
      },
    ],
    agreement: {
      level: 'low' as const,
      scoreSpread: 34,
      summary: '四个评审维度分歧较大（34 分差），风险评审与其他三维度判断差异明显：无合规红线，但平台、受众和创作者适配均需改进',
      reviewRequired: true,
    },
  },
  localized: {
    zh: {
      summary: '当前脚本缺少前三秒钩子、完播动机和账号记忆点，适合先重构开头和节奏后再进入拍摄。',
    },
    en: {
      audiencePersona: {
        userIntent: 'Passive feed exposure -> interest trigger -> emotional pull -> quick interaction',
        psychologicalNeeds: [
          'Attention competition: the first three seconds decide whether users stay or swipe away.',
          'Emotional value: curiosity, contrast, resonance, or conflict is needed to keep watching.',
          'Low-friction decisions: easier actions lead to more likes, follows, and shares.',
          'Community identity: the content should match the user’s self-image and interest circle.',
        ],
        trustBarriers: [
          'No opening hook leads to instant swiping.',
          'Slow pacing causes completion rate to drop.',
          'A strong sales tone can trigger negative comments.',
        ],
        dislikedExpressions: [
          'Flat educational narration.',
          'Monotone read-aloud scripts.',
          'Hard advertising without content value.',
        ],
        contentPreference:
          'Conflict or contrast openings over flat storytelling; fast rhythm over slow explanation; strong emotion over feature lists.',
      },
      badcases: [
        {
          type: 'Missing first-three-second hook',
          badcaseLabel: 'Weak first-three-second hook',
          evidence: 'The video begins with a brand logo and has no information or emotional hook.',
          fix: 'Open with a conflict line, such as a surprising comparison between expensive and affordable products.',
        },
        {
          type: 'Weak completion motivation',
          badcaseLabel: 'Weak completion motivation',
          evidence: 'The script lists product selling points without rhythm changes or suspense.',
          fix: 'Use a suspense structure: problem, amplified pain point, solution reveal, and proof.',
        },
        {
          type: 'Weak contrast or conflict',
          badcaseLabel: 'Insufficient contrast',
          evidence: 'The content stays purely positive and gives users little emotional fluctuation.',
          fix: 'Add contrast between claimed effects and real effects, or between expensive and affordable options.',
        },
        {
          type: 'Missing account memory point',
          badcaseLabel: 'Weak account memory point',
          evidence: 'The speaking style is not recognizable, so users may not remember the creator.',
          fix: 'Add a signature phrase, gesture, or visual symbol to strengthen recognizability.',
        },
        {
          type: 'Weak interaction trigger',
          badcaseLabel: 'Weak interaction trigger',
          evidence: 'The ending only asks for likes and follows without a designed discussion hook.',
          fix: 'Ask a debate-style question to trigger comments.',
        },
      ],
      promptV2: {
        optimizedPrompt: `You are a Douyin content creator writing a short-video talking script for [product/topic].

Structure:
1. 0-3 seconds: open with conflict, contrast, or a counterintuitive claim.
2. 3-15 seconds: amplify the audience’s core pain point.
3. 15-25 seconds: introduce the solution and no more than three key selling points.
4. 25-35 seconds: show proof through real usage, comparison, or scenario.
5. 35-45 seconds: ask a debate-style or voting question to trigger comments.
6. 45-50 seconds: end with a recognizable phrase, gesture, or visual cue.

Style:
- One information or emotion shift every 3-5 seconds.
- Conversational tone, not broadcast narration.
- Add visual cues for cuts, captions, and scene changes.
- Avoid hard-ad style, read-aloud pacing, and low-information filler.`,
        changeReasons: [
          'Add a conflict hook to improve early retention.',
          'Use fast segmented pacing to improve completion rate.',
          'Add contrast to make the content more memorable.',
          'Design interaction hooks to drive comments and shares.',
          'Strengthen account recognizability with a memory point.',
        ],
        expectedImprovements: [
          'First-three-second retention is expected to improve.',
          'Overall completion rate may increase after pacing is tightened.',
          'Comment and share intent should improve with stronger interaction hooks.',
          'Platform Fit is expected to rise after the script is restructured.',
        ],
      },
      confidence: {
        reasons: [
          'The script is short, so hook and completion judgments need to be verified with actual video performance.',
          'The text lacks real shot execution, so some rhythm judgments are inferred from the script.',
        ],
      },
      riskAssessment: {
        riskTypeLabels: ['Insufficient input context'],
        reasons: [
          'The script lacks actual video material, so completion and interaction forecasts are uncertain.',
          'No obvious compliance red line or exaggerated claim appears in the text.',
        ],
      },
      multiJudge: {
        judges: [
          {
            keyConcern: 'Weak first-three-second hook and low completion motivation',
            evidence: 'The script opens with a brand logo and lacks conflict, contrast, or a pain-point hook.',
            recommendation: 'Replace the logo opening with a conflict line and add a suspense progression.',
          },
          {
            keyConcern: 'Emotional trigger is not strong enough',
            evidence: 'The content lacks contrast, so users have little emotional reason to stay.',
            recommendation: 'Add a comparison between expensive and affordable products or between claims and real effects.',
          },
          {
            keyConcern: 'Weak account memory point and interaction guide',
            evidence: 'The speaking style is not recognizable, and the ending has no discussion hook.',
            recommendation: 'Add a signature phrase or gesture and ask a debate-style question.',
          },
          {
            keyConcern: 'No obvious text-level risk',
            evidence: 'No clear compliance red line appears, but real video execution still needs review.',
            recommendation: 'Review the final video for pacing and visual expression after filming.',
          },
        ],
        agreementSummary: 'The judges show low agreement because risk is low while platform, audience, and creator fit all need revision.',
      },
      summary: 'The script lacks a strong opening hook, completion motivation, and account memory point; restructure the opening and pacing before filming.',
    },
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
