import { type EvaluationResult, getMockResult } from '@/app/data/mockResults';
import { mapTypeToTaxon } from '@/app/data/badcaseTaxonomy';

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

## Rules You MUST Follow
1. Score honestly based on the content provided — do NOT inflate scores
2. Do NOT fabricate product efficacy, sales data, certifications, medical effects, or authoritative endorsements not present in the input
3. Do NOT help circumvent platform moderation, create fake word-of-mouth, or impersonate real user experiences
4. Scores are for content optimization reference only — they do NOT represent real platform recommendation results or real conversion outcomes
5. Every low-score judgment MUST cite原文 evidence from the provided content
6. You MUST output strictly valid JSON — no markdown, no extra explanation, no code fences

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
