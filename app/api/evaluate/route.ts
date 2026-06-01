import { type EvaluationResult, getMockResult } from '@/app/data/mockResults';
import { mapTypeToTaxon } from '@/app/data/badcaseTaxonomy';
import type { Confidence, RiskAssessment, MultiJudgeResult } from '@/app/data/mockResults';

// ── Request body type ───────────────────────────────────────────────
interface EvaluateRequest {
  platform: string;
  contentGoal: string;
  productTopic: string;
  targetAudience: string;
  originalPrompt: string;
  aiContent: string;
  pgcReference?: string;
}

// ── System Prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AIGC Content Strategy Evaluation Expert for ContentFlow AI.

Your job is to evaluate AI-generated content using the TriFlow framework across three dimensions:
- Platform Fit: How well the content matches the target platform's content ecosystem and user behavior
- Audience Fit: How well the content addresses the target audience's psychological needs and trust barriers
- Creator Goal Fit: How well the content serves the creator/brand's objectives

## Platform-Specific Rubrics

### XiaoHongShu (小红书)
- Search intent: Does the content target search keywords users actually type?
- Save/collection value: Is there a checklist, comparison table, or summary worth bookmarking?
- Authentic experience: Does it read like a real person's genuine experience, not a brand press release?
- Trust signals: Are there before/after details, usage timelines, specific scenarios?
- Soft种草 (soft recommendation): Does it persuade through personal narrative rather than hard-selling?
- Avoid: hard ads, exaggerated claims, vague conclusions, over-filtered/over-produced tone

### Douyin (抖音)
- 3-second hook: Does it open with conflict, contrast, or curiosity that stops the scroll?
- Completion motivation: Is there rhythm change,悬念 (suspense), or information gap that drives watch-through?
- Emotional pacing: Alternating intensity — does it avoid flat, monotone delivery?
- Contrast/conflict: Are there surprising comparisons or unexpected reveals?
- Interaction guide: Are there designed moments that provoke comments/shares?
- IP memory point: Is there a signature phrase, gesture, or visual symbol?
- Avoid: flat narration, lecture-style delivery, hard-ad format, content devoid of emotional peaks

## Language Requirement
ALL user-facing content MUST be output in Chinese (中文). Field names can remain in English, but the VALUES — explanations, reasons, evidence, suggestions, optimized prompt text, psychological needs, trust barriers, content preferences, badcase type/evidence/fix, confidence reasons, risk reasons, judge keyConcern/evidence/recommendation, changeReasons, expectedImprovements — must all be in Chinese. A small amount of English professional terminology may be used as title modifiers, but the body text must be Chinese.

## Rules You MUST Follow
1. Score honestly based on the content provided — do NOT inflate scores
2. Do NOT fabricate product efficacy, sales data, certifications, medical effects, or authoritative endorsements not present in the input
3. Do NOT help circumvent platform moderation, create fake word-of-mouth, or impersonate real user experiences
4. Scores are for content optimization reference only — they do NOT represent real platform recommendation results or real conversion outcomes
5. Every low-score judgment MUST cite原文 evidence from the provided content
6. You MUST output strictly valid JSON — no markdown, no extra explanation, no code fences
7. All output values must be in Chinese (中文)

## Scoring Guidelines
- 0-30: Critical flaws — fundamentally misaligned with platform/audience/goal
- 31-50: Significant issues — requires major revision
- 51-70: Acceptable — works but has clear improvement opportunities
- 71-85: Good — well-optimized with minor gaps
- 86-100: Excellent — strong alignment across all dimensions

## Badcase Requirements
- Identify at least 3, at most 5 badcases
- Each badcase must include these fields: layer, type, badcaseTag, badcaseLabel, evidence, fix
- badcaseTag must be selected from the platform-specific taxonomy below
- badcaseLabel must be the Chinese label corresponding to the selected tag
- Layer assignment: "platform" = platform mechanic mismatch, "audience" = user psychology mismatch, "creator" = brand/creator objective mismatch

### XiaoHongShu Badcase Taxonomy (use only for xiaohongshu platform)
- search_intent_missing (搜索意图缺失): Content doesn't cover keywords/questions users actively search for
- trust_detail_weak (真实体验不足): Missing specific usage scenarios, limitations, or detailed evidence
- save_worthiness_low (收藏价值不足): Lacking checklist, steps, comparison, or save-worthy structure
- hard_sell_tone (硬广感过强): Overly promotional, lacking natural种草 tone and user perspective
- trust_barrier_unresolved (购买顾虑未回应): Not addressing user concerns about price, efficacy, suitability
- keyword_coverage_weak (关键词覆盖弱): Title/body missing platform search keywords and decision terms
- community_tone_mismatch (社区语气不匹配): Language doesn't sound like genuine experience sharing

### Douyin Badcase Taxonomy (use only for douyin platform)
- hook_weak (前三秒 Hook 弱): Opening lacks conflict, contrast, pain point, or result hook
- completion_drive_low (完播动机不足): Missing suspense, progression, or rhythm design to drive completion
- conflict_contrast_weak (冲突/反差不足): Too flat/narrative, lacking tension needed for short-video feed
- visualizability_low (镜头感不足): Missing visual/action/storyboard elements, hard to translate to video
- interaction_trigger_weak (互动触发弱): Missing comment/follow/discussion/remix triggers
- ip_memory_weak (IP 记忆点不足): Inconsistent tone, persona, viewpoint or expression style
- rhythm_dragging (节奏拖沓): Information pacing too slow, key points not prominent

## Confidence Scoring
You must evaluate your own confidence in the assessment:

- **High (score 80-100)**: Content is detailed, audience is specific, platform mechanics are clear, and evidence for each badcase is substantial. You are confident in the scores and diagnoses.
- **Medium (score 50-79)**: Content has moderate detail, some judgments rely on pattern recognition rather than explicit evidence. Scores are directionally correct but may need human adjustment.
- **Low (score 0-49)**: Content is very short (<50 Chinese characters), audience is vague, product information is missing, or the platform context is unclear. Scores are rough estimates and should be reviewed by a human.

Rules:
- If content is very short (<50 Chinese characters), confidence must be low.
- If platform, audience, and product information are all provided and specific, confidence can be high if evidence is strong.
- Score must be 0-100, level must be "high"/"medium"/"low".
- Provide 1-3 reasons explaining the confidence level.

## Risk Assessment
You must flag content that may pose compliance, authenticity, or quality risks:

### Risk Types to Check (use these exact tags)
- unsupported_claim: Content makes efficacy, sales, ranking, expert endorsement, or effect claims not provided in the input
- exaggerated_promotion: Absolute claims, over-promises, or clearly exaggerated marketing language
- fake_experience: Impersonating real user testimonials, buyer reviews, or 素人种草 without real material basis
- platform_evasion: Content suggests circumventing platform moderation, avoiding sensitive words, or隐形营销
- medical_financial_legal_risk: Content involves medical, financial, or legal deterministic advice or effect promises
- low_context_confidence: Insufficient input information causing low AI confidence — human review needed
- plagiarism_imitation_risk: Content is too close to a benchmark/reference, risking imitation or rewriting

### Risk Level Rules
- If content contains "100%有效", "全网第一", "根治", "医生推荐", "真实用户亲测" without provided evidence, riskLevel is at least medium.
- If content suggests bypassing moderation, avoiding sensitive words, or faking 素人 identity, riskLevel = high, reviewRequired = true.
- If confidence is low, reviewRequired = true regardless of riskLevel.
- Provide riskTypes as array of tags from the list above.
- Provide 1-3 reasons explaining the risk judgment.

## Multi-Judge Evaluation
You must evaluate the content from four distinct perspectives simultaneously. Each judge provides an independent score, verdict, key concern, evidence, and recommendation.

### Judge 1: Platform Judge (平台适配评审)
Focus exclusively on platform mechanics:
- XiaoHongShu: search intent, save/collection value, authentic experience, trust signals, soft种草
- Douyin: 3s hook, completion motivation, contrast/conflict, visual pacing, interaction triggers
- Score based on platform-specific criteria, NOT on audience or creator goals

### Judge 2: Audience Judge (受众心理评审)
Focus exclusively on user psychology:
- Does the content match the target audience's current intent and decision stage?
- Does it address trust barriers and psychological needs?
- Does it translate product features into user benefits?
- Does it avoid expressions the audience dislikes?

### Judge 3: Creator Judge (创作者目标评审)
Focus exclusively on creator/brand objectives:
- Does the content serve the stated content goal (种草/转化/涨粉/搜索沉淀)?
- Does it align with the brand/creator persona?
- Does it have a conversion path or IP memory point?
- Is the structure reusable enough to become an SOP?

### Judge 4: Risk Judge (风险边界评审)
Focus exclusively on risk boundaries:
- Are there exaggerated claims or unsupported efficacy statements?
- Does it impersonate real user experiences without evidence?
- Does it suggest circumventing platform moderation?
- Is human review required?

Each judge must return: judgeType, name, score (0-100), verdict ("pass"/"needs_revision"/"high_risk"), keyConcern, evidence, recommendation.

### Agreement Calculation
- Compute scoreSpread = max(judgeScores) - min(judgeScores)
- If scoreSpread <= 15, agreement.level = "high"
- If 15 < scoreSpread <= 30, agreement.level = "medium"
- If scoreSpread > 30, agreement.level = "low"
- If Risk Judge verdict = "high_risk", agreement.reviewRequired = true
- If agreement.level = "low", agreement.reviewRequired = true
- Provide a 1-sentence agreement.summary explaining the divergence

## Prompt v2 Requirements
- The optimized prompt must address EVERY identified badcase
- Change reasons must be specific and actionable, not generic
- Expected improvements must be directional with rough magnitude estimates`;

// ── Build User Prompt ────────────────────────────────────────────────
function buildUserPrompt(req: EvaluateRequest): string {
  const taxonomyList =
    req.platform === 'douyin'
      ? `- hook_weak (前三秒 Hook 弱)
- completion_drive_low (完播动机不足)
- conflict_contrast_weak (冲突/反差不足)
- visualizability_low (镜头感不足)
- interaction_trigger_weak (互动触发弱)
- ip_memory_weak (IP 记忆点不足)
- rhythm_dragging (节奏拖沓)`
      : `- search_intent_missing (搜索意图缺失)
- trust_detail_weak (真实体验不足)
- save_worthiness_low (收藏价值不足)
- hard_sell_tone (硬广感过强)
- trust_barrier_unresolved (购买顾虑未回应)
- keyword_coverage_weak (关键词覆盖弱)
- community_tone_mismatch (社区语气不匹配)`;

  const platformRubric =
    req.platform === 'douyin'
      ? `DOUYIN RUBRIC:
- 0-3s Hook: Does the content open with a conflict/contrast/curiosity hook?
- Completion drivers: Is there rhythm pacing, suspense, or information gaps?
- Emotional curve: Are there intensity shifts, not flat narration?
- Contrast/conflict: Any surprising comparisons or unexpected reveals?
- Interaction design: Are there moments designed to trigger comments?
- IP memory: Is there a signature element the creator is known for?
- Avoid: flat科普, lecture tone, hard-ad format, no emotional peaks`
      : `XIAOHONGSHU RUBRIC:
- Search intent: Does content target real search keywords?
- Save value: Is there a checklist, comparison table, or summary?
- Authenticity: Does it read like genuine personal experience?
- Trust signals: Before/after details, usage timeline, specific scenarios?
- Soft种草: Persuasion through narrative, not hard-selling?
- Avoid: brand-speak, exaggerated claims, vague conclusions, over-produced tone`;

  let prompt = `## Platform
${req.platform === 'douyin' ? 'Douyin (抖音)' : 'XiaoHongShu (小红书)'}

## Content Goal
${req.contentGoal}

## Product / Topic
${req.productTopic}

## Target Audience
${req.targetAudience}

## Original Prompt
${req.originalPrompt}

## AI-Generated Content
${req.aiContent}`;

  if (req.pgcReference) {
    prompt += `\n\n## PGC Reference (Benchmark)\n${req.pgcReference}`;
  }

  prompt += `\n\n## Evaluation Instructions
${platformRubric}

## Available Badcase Taxonomy Tags (use ONLY these)
${taxonomyList}

## Output Format
Return a SINGLE JSON object with exactly this structure:

{
  "audiencePersona": {
    "userIntent": "string describing the user's journey from discovery to decision",
    "psychologicalNeeds": ["need1", "need2", "need3", "need4"],
    "trustBarriers": ["barrier1", "barrier2", "barrier3"],
    "dislikedExpressions": ["expression1", "expression2"],
    "contentPreference": "string describing preferred content format/style"
  },
  "triFlowScores": {
    "platformFit": 0-100 integer,
    "audienceFit": 0-100 integer,
    "creatorGoalFit": 0-100 integer,
    "overallEffectiveness": 0-100 integer
  },
  "badcases": [
    {
      "layer": "platform" | "audience" | "creator",
      "type": "string - specific issue type name",
      "badcaseTag": "string - MUST be one of the taxonomy tags listed above",
      "badcaseLabel": "string - the Chinese label for the tag",
      "evidence": "string - quote from the original content",
      "fix": "string - concrete, actionable improvement"
    }
  ],
  "promptV2": {
    "optimizedPrompt": "string - the complete rewritten prompt",
    "changeReasons": ["reason1", "reason2", ...],
    "expectedImprovements": ["improvement1", "improvement2", ...]
  },
  "confidence": {
    "score": 0-100 integer,
    "level": "high" | "medium" | "low",
    "reasons": ["reason1", "reason2"]
  },
  "riskAssessment": {
    "riskLevel": "low" | "medium" | "high",
    "reviewRequired": true/false,
    "riskTypes": ["unsupported_claim", "exaggerated_promotion", ...],
    "reasons": ["risk reason1", "risk reason2"]
  },
  "multiJudge": {
    "judges": [
      {
        "judgeType": "platform" | "audience" | "creator" | "risk",
        "name": "string - judge display name",
        "score": 0-100 integer,
        "verdict": "pass" | "needs_revision" | "high_risk",
        "keyConcern": "string - most critical issue from this judge's perspective",
        "evidence": "string - quote or reference from the content",
        "recommendation": "string - specific fix from this judge's perspective"
      }
    ],
    "agreement": {
      "level": "high" | "medium" | "low",
      "scoreSpread": number - max judge score minus min judge score,
      "summary": "string - one sentence explaining agreement level",
      "reviewRequired": true/false
    }
  }
}

CRITICAL:
- badcases array: minimum 3 items, maximum 5 items
- Each badcase MUST include badcaseTag and badcaseLabel from the taxonomy above
- All scores: integers from 0 to 100
- promptV2.optimizedPrompt: must be a complete, usable prompt, NOT a summary
- promptV2.changeReasons: each reason must reference specific badcases being fixed
- Output ONLY the JSON object — no markdown fences, no extra text`;

  return prompt;
}

// ── Validate EvaluationResult shape ─────────────────────────────────
function isValidEvaluationResult(obj: unknown): obj is EvaluationResult {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;

  // audiencePersona
  const ap = r.audiencePersona;
  if (!ap || typeof ap !== 'object') return false;
  const apObj = ap as Record<string, unknown>;
  if (typeof apObj.userIntent !== 'string') return false;
  if (!Array.isArray(apObj.psychologicalNeeds)) return false;
  if (!Array.isArray(apObj.trustBarriers)) return false;
  if (!Array.isArray(apObj.dislikedExpressions)) return false;
  if (typeof apObj.contentPreference !== 'string') return false;

  // triFlowScores
  const ts = r.triFlowScores;
  if (!ts || typeof ts !== 'object') return false;
  const tsObj = ts as Record<string, unknown>;
  if (typeof tsObj.platformFit !== 'number') return false;
  if (typeof tsObj.audienceFit !== 'number') return false;
  if (typeof tsObj.creatorGoalFit !== 'number') return false;
  if (typeof tsObj.overallEffectiveness !== 'number') return false;

  // badcases
  if (!Array.isArray(r.badcases) || r.badcases.length < 1) return false;

  // promptV2
  const pv = r.promptV2;
  if (!pv || typeof pv !== 'object') return false;
  const pvObj = pv as Record<string, unknown>;
  if (typeof pvObj.optimizedPrompt !== 'string') return false;
  if (!Array.isArray(pvObj.changeReasons)) return false;
  if (!Array.isArray(pvObj.expectedImprovements)) return false;

  return true;
}

// ── Fill missing taxonomy tags with fallback keyword mapping ────────
function applyTaxonomyFallback(
  result: EvaluationResult,
  platform: string
): void {
  for (const bc of result.badcases) {
    if (bc.badcaseTag && bc.badcaseLabel) continue;
    const taxon = mapTypeToTaxon(platform, bc.type);
    if (taxon) {
      bc.badcaseTag = taxon.tag;
      bc.badcaseLabel = taxon.label;
    }
    // If no match, leave undefined — frontend handles missing fields gracefully
  }
}

// ── Fill missing confidence/risk with simple heuristic fallback ─────
function applyConfidenceFallback(
  result: EvaluationResult,
  aiContent: string
): void {
  if (!result.confidence) {
    const isShort = aiContent.replace(/\s/g, '').length < 50;
    result.confidence = {
      score: isShort ? 45 : 65,
      level: isShort ? 'low' : 'medium',
      reasons: isShort
        ? ['输入内容过短（<50字），AI 判断置信度较低']
        : ['AI 未返回置信度数据，使用默认中等置信度'],
    };
  }
  if (!result.riskAssessment) {
    const isShort = aiContent.replace(/\s/g, '').length < 50;
    result.riskAssessment = {
      riskLevel: 'low',
      reviewRequired: isShort,
      riskTypes: isShort ? ['low_context_confidence'] : [],
      reasons: isShort
        ? ['输入内容过短，建议人工复核']
        : ['AI 未返回风险评估数据，使用默认低风险'],
    };
  }
  // Ensure reviewRequired if confidence is low
  if (
    result.confidence.level === 'low' &&
    !result.riskAssessment.reviewRequired
  ) {
    result.riskAssessment.reviewRequired = true;
  }
}

// ── Fill missing multiJudge with heuristic fallback ─────────────────
function applyMultiJudgeFallback(result: EvaluationResult): void {
  if (result.multiJudge) return;

  const pf = result.triFlowScores.platformFit;
  const af = result.triFlowScores.audienceFit;
  const cf = result.triFlowScores.creatorGoalFit;

  // Risk score heuristic based on riskAssessment
  let riskScore = 70;
  if (result.riskAssessment?.riskLevel === 'high') {
    riskScore = 35;
  } else if (result.riskAssessment?.riskLevel === 'medium') {
    riskScore = 60;
  }

  const verdict = (s: number): MultiJudgeResult['judges'][0]['verdict'] => {
    if (s >= 75) return 'pass';
    if (s >= 50) return 'needs_revision';
    return 'needs_revision';
  };

  const riskVerdict =
    result.riskAssessment?.riskLevel === 'high' ? 'high_risk' : verdict(riskScore);

  const judges: MultiJudgeResult['judges'] = [
    {
      judgeType: 'platform',
      name: '平台适配评审 Platform Judge',
      score: pf,
      verdict: verdict(pf),
      keyConcern: pf >= 70 ? '平台适配整体较好' : '平台适配存在改进空间',
      evidence: '基于 TriFlow 平台适配维度评分',
      recommendation: pf >= 70 ? '保持当前平台适配策略' : '根据平台 Rubric 优化内容表达和结构',
    },
    {
      judgeType: 'audience',
      name: '受众心理评审 Audience Judge',
      score: af,
      verdict: verdict(af),
      keyConcern: af >= 70 ? '受众匹配度较高' : '受众心理需求回应不足',
      evidence: '基于 TriFlow 受众适配维度评分',
      recommendation: af >= 70 ? '保持受众洞察和信任构建' : '增强信任信号和购买顾虑回应',
    },
    {
      judgeType: 'creator',
      name: '创作者目标评审 Creator Judge',
      score: cf,
      verdict: verdict(cf),
      keyConcern: cf >= 70 ? '创作者目标对齐较好' : '创作者目标对齐度不足',
      evidence: '基于 TriFlow 创作者目标维度评分',
      recommendation: cf >= 70 ? '保持目标导向的内容策略' : '加强软种草路径和转化逻辑',
    },
    {
      judgeType: 'risk',
      name: '风险边界评审 Risk Judge',
      score: riskScore,
      verdict: riskVerdict,
      keyConcern:
        result.riskAssessment?.riskLevel === 'high'
          ? '存在高风险内容，需要立即复核'
          : result.riskAssessment?.riskLevel === 'medium'
            ? '存在中等风险，建议关注'
            : '当前内容处于低风险区间',
      evidence: '基于风险分层评估结果',
      recommendation:
        result.riskAssessment?.reviewRequired
          ? '建议人工复核后发布'
          : '暂无强制复核要求',
    },
  ];

  const scores = judges.map((j) => j.score);
  const scoreSpread = Math.max(...scores) - Math.min(...scores);

  let level: 'high' | 'medium' | 'low';
  if (scoreSpread <= 15) level = 'high';
  else if (scoreSpread <= 30) level = 'medium';
  else level = 'low';

  const reviewRequired =
    riskVerdict === 'high_risk' ||
    level === 'low' ||
    result.riskAssessment?.reviewRequired === true;

  result.multiJudge = {
    judges,
    agreement: {
      level,
      scoreSpread,
      summary:
        level === 'high'
          ? '四个评审维度高度一致，评分差异在合理范围内'
          : level === 'medium'
            ? '四个评审维度存在中等分歧，部分维度判断差异值得关注'
            : '四个评审维度分歧较大，建议人工复核确认',
      reviewRequired,
    },
  };
}

// ── Call DeepSeek API ───────────────────────────────────────────────
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  platform: string
): Promise<EvaluationResult> {
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

  // Parse the JSON from the response
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Sometimes the model wraps JSON in markdown fences — try stripping
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

  if (!isValidEvaluationResult(parsed)) {
    throw new Error(
      'DeepSeek response JSON missing required fields or has invalid structure'
    );
  }

  // Clamp scores to 0-100 range
  const result = parsed as EvaluationResult;
  result.triFlowScores.platformFit = Math.max(
    0,
    Math.min(100, Math.round(result.triFlowScores.platformFit))
  );
  result.triFlowScores.audienceFit = Math.max(
    0,
    Math.min(100, Math.round(result.triFlowScores.audienceFit))
  );
  result.triFlowScores.creatorGoalFit = Math.max(
    0,
    Math.min(100, Math.round(result.triFlowScores.creatorGoalFit))
  );
  result.triFlowScores.overallEffectiveness = Math.max(
    0,
    Math.min(100, Math.round(result.triFlowScores.overallEffectiveness))
  );

  // Fill missing badcaseTag/badcaseLabel with keyword-based fallback
  applyTaxonomyFallback(result, platform);

  return result;
}

// ── POST Handler ────────────────────────────────────────────────────
export async function POST(request: Request) {
  let body: EvaluateRequest;
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

  const normalizedPlatform =
    platform === 'xiaohongshu' ? '小红书' : '抖音';

  try {
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(body);
    const result = await callDeepSeek(systemPrompt, userPrompt, platform);

    // Fill missing confidence/risk with heuristic fallback
    applyConfidenceFallback(result, body.aiContent || '');
    // Fill missing multiJudge with heuristic fallback
    applyMultiJudgeFallback(result);

    return Response.json({ ...result, _fallback: false });
  } catch (error) {
    // Log the error server-side for debugging
    console.error(
      '[ContentFlow AI] DeepSeek API call failed, falling back to mock:',
      error instanceof Error ? error.message : error
    );

    // Fallback to mock data
    const mockResult = getMockResult(normalizedPlatform);
    return Response.json({ ...mockResult, _fallback: true });
  }
}
