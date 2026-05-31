// ── Types ────────────────────────────────────────────────────────────
interface CompareRequest {
  platform: string;
  contentGoal: string;
  productTopic: string;
  targetAudience: string;
  aigcContent: string;
  pgcContent: string;
}

interface SopPotential {
  canBeSavedAsSop: boolean;
  suggestedSopName: string;
  reusableStructure: string[];
}

interface CompareResult {
  gapSummary: string;
  pgcStrengths: string[];
  aigcWeaknesses: string[];
  transferableRules: string[];
  platformSpecificInsights: string[];
  promptOptimizationAdvice: string[];
  sopPotential: SopPotential;
}

// ── System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AIGC Content Strategy Analyst for ContentFlow AI. Your job is to compare PGC (Professional Generated Content / benchmark content) with AIGC (AI Generated Content) and identify actionable gaps that can be closed through prompt optimization and SOP codification.

## What You Analyze

You are NOT judging which piece of content is "better" in a vague sense. You analyze:

1. **Why PGC fits the platform better** — What specific platform mechanics and user behaviors does the PGC leverage?
2. **What psychological triggers AIGC misses** — Which audience trust/emotion/decision triggers are present in PGC but absent in AIGC?
3. **What platform distribution signals AIGC lacks** — Which discoverability/engagement mechanics differ?
4. **What PGC structures are transferable** — Which patterns can be codified as Prompt rules or SOP templates?

## Platform-Specific Analysis Lenses

### XiaoHongShu (小红书) — Search-driven 种草 / consumer decision
Analyze through these dimensions:
- **Search Intent Match**: Does the content target real search keywords? Does PGC rank better in search?
- **Authentic Experience**: Does PGC feel like a real person's genuine use, while AIGC sounds like a brand release?
- **Save/Collection Value**: What makes PGC worth bookmarking (checklist, comparison, summary) that AIGC lacks?
- **Trust Signals**: What before/after details, timelines, or scenario descriptions are in PGC but missing in AIGC?
- **Soft 种草**: How does PGC persuade through narrative vs AIGC's hard-selling?
- **避坑 Value**: Does PGC help users avoid bad choices in a way AIGC doesn't?
- **Key to analyze**: search keywords, real-use scenarios, pros/cons honesty, decision guidance, collection triggers

### Douyin (抖音) — Feed-driven short video / attention competition
Analyze through these dimensions:
- **3-Second Hook**: What makes PGC stop the scroll vs AIGC's opening?
- **Completion Motivation**: What rhythm, suspense, or information gaps drive watch-through in PGC?
- **Contrast/Conflict**: Where does PGC create surprise/reversal that AIGC lacks?
- **Pacing & Rhythm**: How does PGC maintain attention through intensity shifts vs AIGC's flat delivery?
- **Interaction Design**: What comment/share triggers does PGC embed that AIGC misses?
- **IP Memory**: What signature style/phrase/gesture makes PGC memorable?
- **Key to analyze**: hook mechanics, emotional curve, segment pacing, interaction prompts, creator persona

## Rules You MUST Follow
1. Only extract structures and strategies — do NOT encourage word-for-word copying, rewriting, or content scraping
2. Do NOT fabricate product efficacy, sales data, certifications, medical effects, or authority endorsements not present in the input
3. Transferable rules must be about STRUCTURE and APPROACH, not about copying specific sentences
4. Platform insights must be actionable — someone reading them should know exactly what to change in their prompt
5. Output strictly valid JSON — no markdown, no extra explanation, no code fences
6. All responses must be in Chinese (中文) since the content under analysis is in Chinese`;

// ── Build User Prompt ────────────────────────────────────────────────
function buildUserPrompt(req: CompareRequest): string {
  const platformRubric =
    req.platform === 'douyin'
      ? `DOUYIN ANALYSIS LENS:
- 3-Second Hook: Compare openings — what makes PGC stop the scroll?
- Completion Drivers: Compare pacing, suspense, information gaps
- Contrast/Conflict: Where does PGC create surprise that AIGC lacks?
- Rhythm & Pacing: Compare emotional intensity shifts
- Interaction Design: Compare comment/share trigger points
- IP Memory: Compare signature style/persona elements
- What makes PGC feel native to Douyin's feed that AIGC doesn't?`
      : `XIAOHONGSHU ANALYSIS LENS:
- Search Intent: How does PGC target search keywords vs AIGC?
- Authentic Experience: Compare first-person genuine feel
- Save/Collection Value: What makes PGC bookmark-worthy?
- Trust Signals: Compare before/after, timeline, scenario details
- Soft 种草: How does PGC persuade through narrative?
- 避坑 Value: Does PGC help users avoid bad choices better?
- What makes PGC feel native to XiaoHongShu's search ecosystem that AIGC doesn't?`;

  return `## Platform
${req.platform === 'douyin' ? 'Douyin (抖音)' : 'XiaoHongShu (小红书)'}

## Content Goal
${req.contentGoal}

## Product / Topic
${req.productTopic}

## Target Audience
${req.targetAudience}

## AIGC Content
${req.aigcContent}

## PGC Benchmark Content
${req.pgcContent}

## Analysis Instructions
${platformRubric}

## Output Format
Return a SINGLE JSON object with exactly this structure:

{
  "gapSummary": "一句话总结 AIGC 和 PGC 之间的核心差距（中文，30字以内）",
  "pgcStrengths": ["PGC 优势1", "PGC 优势2", "PGC 优势3", "PGC 优势4"],
  "aigcWeaknesses": ["AIGC 短板1", "AIGC 短板2", "AIGC 短板3", "AIGC 短板4"],
  "transferableRules": [
    "可迁移规则1（必须描述结构/方法，不要描述具体文案）",
    "可迁移规则2",
    "可迁移规则3",
    "可迁移规则4"
  ],
  "platformSpecificInsights": [
    "平台相关洞察1（必须与当前平台相关）",
    "平台相关洞察2",
    "平台相关洞察3"
  ],
  "promptOptimizationAdvice": [
    "Prompt 优化建议1（具体可执行，不是泛泛而谈）",
    "Prompt 优化建议2",
    "Prompt 优化建议3"
  ],
  "sopPotential": {
    "canBeSavedAsSop": true/false,
    "suggestedSopName": "建议的 SOP 模板名称",
    "reusableStructure": ["可复用结构点1", "可复用结构点2", "可复用结构点3"]
  }
}

CRITICAL:
- All string values must be in Chinese (中文)
- pgcStrengths: 3-5 items
- aigcWeaknesses: 3-5 items
- transferableRules: 3-5 items — describe STRUCTURES, not copy sentences
- platformSpecificInsights: 2-4 items
- promptOptimizationAdvice: 2-4 items — concrete and actionable
- reusableStructure: 2-4 items
- Output ONLY the JSON object — no markdown fences, no extra text`;
}

// ── Validate CompareResult shape ─────────────────────────────────────
function isValidCompareResult(obj: unknown): obj is CompareResult {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;

  if (typeof r.gapSummary !== 'string') return false;
  if (!Array.isArray(r.pgcStrengths) || r.pgcStrengths.length < 1) return false;
  if (!Array.isArray(r.aigcWeaknesses) || r.aigcWeaknesses.length < 1) return false;
  if (!Array.isArray(r.transferableRules) || r.transferableRules.length < 1) return false;
  if (!Array.isArray(r.platformSpecificInsights) || r.platformSpecificInsights.length < 1) return false;
  if (!Array.isArray(r.promptOptimizationAdvice) || r.promptOptimizationAdvice.length < 1) return false;

  const sp = r.sopPotential;
  if (!sp || typeof sp !== 'object') return false;
  const spObj = sp as Record<string, unknown>;
  if (typeof spObj.canBeSavedAsSop !== 'boolean') return false;
  if (typeof spObj.suggestedSopName !== 'string') return false;
  if (!Array.isArray(spObj.reusableStructure)) return false;

  return true;
}

// ── Fallback Mock Results ────────────────────────────────────────────
function getMockCompareResult(platform: string): CompareResult {
  if (platform === 'douyin') {
    return {
      gapSummary: 'PGC 擅长用冲突钩子和快节奏制造完播动机，AIGC 仍停留在平铺直叙的产品介绍层面',
      pgcStrengths: [
        '前 3 秒使用冲突/反差句式直接抓注意力，而非品牌 Logo 开场',
        '每 3-5 秒切换信息点或情绪节点，节奏紧凑无明显冷场',
        '设计了至少 2 处互动触发点（争议提问 / 投票引导），引导评论区参与',
        '有明确的创作者个人风格和口头禅，看完能记住是谁说的',
      ],
      aigcWeaknesses: [
        '开头缺乏钩子，前 3 秒内容无信息增量或情绪刺激',
        '内容节奏平铺直叙，缺少悬念、冲突或信息差设计',
        '互动引导薄弱，仅在结尾说"点赞关注"而非设计互动动机',
        '缺乏个人 IP 辨识度，口吻与同类内容无差异',
      ],
      transferableRules: [
        '以冲突/反差句式开头（如"花XX钱买的X，还不如XX"），而非平铺标题',
        '按"痛点→放大→方案→验证→互动"五段式结构分配时长',
        '每 3-5 秒设置一个信息点或情绪转换，避免连续 5 秒以上无变化',
        '在内容中后段嵌入 2 个互动钩子（争议提问/投票/两种选择），给用户参与理由',
      ],
      platformSpecificInsights: [
        '抖音完播率的核心驱动不是信息完整性，而是情绪节奏和悬念设计',
        '互动率比点赞率更影响流量池晋级——评论导向的内容更容易进入大流量池',
        'IP 记忆点（标志性口吻/动作/视觉）是差异化竞争中成本最低的壁垒',
      ],
      promptOptimizationAdvice: [
        '在 Prompt 中明确要求"以冲突/反差句开头，给 3 种可选方向"，而非让 AI 自己决定开场',
        '要求 AI 按 5 段结构输出脚本（Hook/痛点/方案/验证/互动），每段标注时长建议',
        '加入互动设计要求：规定 AI 必须在内容中后段嵌入 2 个引发评论的触发句',
      ],
      sopPotential: {
        canBeSavedAsSop: true,
        suggestedSopName: '抖音短视频 5 段式口播脚本结构',
        reusableStructure: [
          '0-3s Hook：冲突/反差/反常识开场',
          '3-15s 痛点放大：描述用户最在意的痛点建立共鸣',
          '15-25s 解决方案：引出产品/方法，给出核心卖点（≤3个）',
          '25-35s 效果验证：实拍/实测/对比画面',
          '35-45s 互动触发：争议提问/投票/两种选择',
        ],
      },
    };
  }

  // Xiaohongshu fallback
  return {
    gapSummary: 'PGC 以真实体验细节和搜索友好结构建立信任，AIGC 更偏向泛泛的广告话术',
    pgcStrengths: [
      '标题覆盖 2-3 个长尾搜索词（如"XX到底值不值得买""XX 30天实测"），搜索曝光更高',
      '有明确使用时间线和场景细节（如"连续使用14天，每天早晚各一次"），真实感更强',
      '包含对比表格/Checklist/划重点等可收藏结构，决策价值明确',
      '明确指出产品局限性（肤色/场景限制），增加内容可信度',
    ],
    aigcWeaknesses: [
      '标题和首段缺少搜索关键词，难以被目标用户搜索到',
      '内容缺乏使用时间线和具体场景细节，读起来像产品说明书',
      '缺少对比信息和明确的选品建议，降低收藏价值',
      '回避产品局限性，所有描述都正面但缺乏说服力',
    ],
    transferableRules: [
      '标题和首段必须嵌入目标用户真实搜索词（搜索词可通过平台搜索下拉框获取），而非自创词',
      '以第一人称使用日记视角写作：使用周期 + 早晚场景 + 关键指标变化',
      '在文末增加"划重点"或对比表格等可收藏结构，满足收藏动机',
      '明确写出 1-2 个产品局限或不适合人群，反向建立信任',
    ],
    platformSpecificInsights: [
      '小红书是搜索驱动的消费决策平台——没有搜索关键词就没有曝光入口',
      '收藏率比点赞率更影响笔记权重——内容必须有"值得收藏"的结构',
      '真实性是小红书用户的第一信任门槛——过度修图/夸张话术反而不利于转化',
      '软种草的核心是"我用了觉得好"而非"这个东西很好"——视角差异决定信任度',
    ],
    promptOptimizationAdvice: [
      '在 Prompt 中要求 AI 先列出 5-8 个目标搜索词，然后在标题和首段中自然融入',
      '要求 AI 以"个人使用日记"视角写作，给出使用时间线、场景、大致效果变化',
      '要求 AI 输出表格/清单结构（如"3 款对比"或"5 条避坑指南"），提升可收藏性',
    ],
    sopPotential: {
      canBeSavedAsSop: true,
      suggestedSopName: '小红书搜索种草笔记结构模板',
      reusableStructure: [
        '标题：搜索词 + 核心结论（如"XX真的值得买吗？30天实测告诉你"）',
        '首段：直接给出结论（满足"不想看长文就想知道答案"的用户）',
        '正文：使用时间线 + 场景 + 关键指标变化 + 1-2个小缺点',
        '对比：与1-2款竞品的横向对比表格（功效/价格/适合肤质/推荐指数）',
        '结尾：明确选择建议 + 3条核心结论划重点（方便收藏）',
      ],
    },
  };
}

// ── Call DeepSeek API ────────────────────────────────────────────────
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<CompareResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('DeepSeek API returned empty or invalid response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Failed to parse DeepSeek response as JSON');
    }
  }

  if (!isValidCompareResult(parsed)) {
    throw new Error(
      'DeepSeek response JSON missing required fields or has invalid structure'
    );
  }

  return parsed;
}

// ── POST Handler ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  let body: CompareRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { platform } = body;
  if (!platform || !['xiaohongshu', 'douyin'].includes(platform)) {
    return Response.json(
      { error: 'platform must be "xiaohongshu" or "douyin"' },
      { status: 400 }
    );
  }

  if (!body.aigcContent || !body.pgcContent) {
    return Response.json(
      { error: 'aigcContent and pgcContent are required' },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(body);
    const result = await callDeepSeek(systemPrompt, userPrompt);

    return Response.json({ ...result, _fallback: false });
  } catch (error) {
    console.error(
      '[ContentFlow AI] Compare API call failed, falling back to mock:',
      error instanceof Error ? error.message : error
    );

    const mockResult = getMockCompareResult(platform);
    return Response.json({ ...mockResult, _fallback: true });
  }
}
