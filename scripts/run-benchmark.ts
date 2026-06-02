import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  abTestBenchmarkCases,
  benchmarkCases,
  compareBenchmarkCases,
  evaluateBenchmarkCases,
  type AbTestBenchmarkCase,
  type BenchmarkCase,
  type CompareBenchmarkCase,
  type EvaluateBenchmarkCase,
} from '../app/data/benchmarkCases';

type BenchmarkStatus = 'success' | 'failed' | 'skipped';

interface BenchmarkResult {
  caseId: string;
  title: string;
  module: BenchmarkCase['module'];
  platform: string;
  contentGoal: string;
  productTopic: string;
  requestPayload: unknown;
  response: unknown;
  overallScore?: number;
  platformFit?: number;
  audienceFit?: number;
  creatorGoalFit?: number;
  riskLevel?: string;
  confidenceLevel?: string;
  badcases?: string[];
  expectedBadcases?: string[];
  expectedScoreRange?: string;
  expectedRiskLevel?: string;
  status: BenchmarkStatus;
  errorMessage?: string;
  createdAt: string;
  scoreA?: number;
  scoreB?: number;
  winner?: 'A' | 'B';
  expectedWinner?: 'A' | 'B';
  winnerMatched?: boolean;
  improvementDelta?: number;
}

interface AnalysisData {
  totalCases: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  platformCounts: Record<string, number>;
  moduleCounts: Record<string, number>;
  averageOverallScore: number | null;
  averageOverallByPlatform: Record<string, number | null>;
  scoreBandCounts: Record<string, number>;
  topBadcases: { label: string; count: number; primaryPlatform: string; explanation: string }[];
  riskCounts: Record<string, number>;
  abTestStats: {
    total: number;
    winnerMatched: number;
    winnerMatchedRate: number | null;
    averageImprovementDelta: number | null;
    promptBWinRate: number | null;
  };
  resumeMetricCandidates: string[];
}

const BASE_URL = (process.env.BENCHMARK_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const RESULTS_DIR = path.join(process.cwd(), 'benchmark-results');
const RUN_TIME = new Date().toISOString();

function getScoreBand(score: number | undefined): string {
  if (typeof score !== 'number') return 'unknown';
  if (score <= 39) return '0-39';
  if (score <= 59) return '40-59';
  if (score <= 74) return '60-74';
  if (score <= 89) return '75-89';
  return '90-100';
}

function scoreBandLabel(band: string): string {
  const labels: Record<string, string> = {
    '0-39': '明显不合格',
    '40-59': '较弱',
    '60-74': '基本可用',
    '75-89': '表现良好',
    '90-100': '高度适配',
    unknown: '暂无评分',
  };
  return labels[band] || band;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readScore(response: unknown): {
  overallScore?: number;
  platformFit?: number;
  audienceFit?: number;
  creatorGoalFit?: number;
} {
  const record = asRecord(response);
  const scores = asRecord(record.triFlowScores);
  return {
    overallScore:
      typeof scores.overallEffectiveness === 'number' ? scores.overallEffectiveness : undefined,
    platformFit: typeof scores.platformFit === 'number' ? scores.platformFit : undefined,
    audienceFit: typeof scores.audienceFit === 'number' ? scores.audienceFit : undefined,
    creatorGoalFit: typeof scores.creatorGoalFit === 'number' ? scores.creatorGoalFit : undefined,
  };
}

function readBadcases(response: unknown): string[] {
  const record = asRecord(response);
  if (!Array.isArray(record.badcases)) return [];
  return record.badcases
    .map((item) => {
      const badcase = asRecord(item);
      return String(badcase.badcaseLabel || badcase.type || badcase.badcaseTag || '').trim();
    })
    .filter(Boolean);
}

function readRiskLevel(response: unknown): string | undefined {
  const risk = asRecord(asRecord(response).riskAssessment);
  return typeof risk.riskLevel === 'string' ? risk.riskLevel : undefined;
}

function readConfidenceLevel(response: unknown): string | undefined {
  const confidence = asRecord(asRecord(response).confidence);
  return typeof confidence.level === 'string' ? confidence.level : undefined;
}

async function postJson(endpoint: string, payload: unknown): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    const error = new Error(`${endpoint} is not available`);
    error.name = 'Skipped';
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${endpoint} returned ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function createBaseResult(
  testCase: BenchmarkCase,
  requestPayload: unknown,
  response: unknown,
  status: BenchmarkStatus,
  errorMessage?: string
): BenchmarkResult {
  const scores = readScore(response);
  return {
    caseId: testCase.id,
    title: testCase.title,
    module: testCase.module,
    platform: testCase.platform,
    contentGoal: testCase.contentGoal,
    productTopic: testCase.productTopic,
    requestPayload,
    response,
    ...scores,
    riskLevel: readRiskLevel(response),
    confidenceLevel: readConfidenceLevel(response),
    badcases: readBadcases(response),
    expectedBadcases: testCase.expectedBadcases,
    expectedScoreRange: testCase.expectedScoreRange,
    expectedRiskLevel: testCase.expectedRiskLevel,
    status,
    errorMessage,
    createdAt: RUN_TIME,
  };
}

async function runEvaluateCase(testCase: EvaluateBenchmarkCase): Promise<BenchmarkResult> {
  const requestPayload = {
    platform: testCase.platform,
    contentGoal: testCase.contentGoal,
    productTopic: testCase.productTopic,
    targetAudience: testCase.targetAudience,
    originalPrompt: testCase.originalPrompt,
    aiContent: testCase.aiContent,
    pgcReference: testCase.pgcReference,
  };

  try {
    const response = await postJson('/api/evaluate', requestPayload);
    return createBaseResult(testCase, requestPayload, response, 'success');
  } catch (error) {
    const isSkipped = error instanceof Error && error.name === 'Skipped';
    return createBaseResult(
      testCase,
      requestPayload,
      null,
      isSkipped ? 'skipped' : 'failed',
      error instanceof Error ? error.message : 'Unknown benchmark error'
    );
  }
}

async function runAbTestCase(testCase: AbTestBenchmarkCase): Promise<BenchmarkResult> {
  const payloadA = {
    platform: testCase.platform,
    contentGoal: testCase.contentGoal,
    productTopic: testCase.productTopic,
    targetAudience: testCase.targetAudience,
    originalPrompt: testCase.promptA,
    aiContent: testCase.contentA,
  };
  const payloadB = {
    ...payloadA,
    originalPrompt: testCase.promptB,
    aiContent: testCase.contentB,
  };
  const requestPayload = { promptA: payloadA, promptB: payloadB };

  try {
    const [responseA, responseB] = await Promise.all([
      postJson('/api/evaluate', payloadA),
      postJson('/api/evaluate', payloadB),
    ]);
    const scoreA = readScore(responseA).overallScore;
    const scoreB = readScore(responseB).overallScore;
    const winner = typeof scoreA === 'number' && typeof scoreB === 'number' && scoreB > scoreA ? 'B' : 'A';
    const improvementDelta =
      typeof scoreA === 'number' && typeof scoreB === 'number'
        ? Number((scoreB - scoreA).toFixed(1))
        : undefined;
    const response = { A: responseA, B: responseB };

    return {
      ...createBaseResult(testCase, requestPayload, response, 'success'),
      overallScore: scoreB,
      platformFit: readScore(responseB).platformFit,
      audienceFit: readScore(responseB).audienceFit,
      creatorGoalFit: readScore(responseB).creatorGoalFit,
      riskLevel: readRiskLevel(responseB),
      confidenceLevel: readConfidenceLevel(responseB),
      badcases: readBadcases(responseB),
      scoreA,
      scoreB,
      winner,
      expectedWinner: testCase.expectedWinner,
      winnerMatched: winner === testCase.expectedWinner,
      improvementDelta,
    };
  } catch (error) {
    const isSkipped = error instanceof Error && error.name === 'Skipped';
    return {
      ...createBaseResult(
        testCase,
        requestPayload,
        null,
        isSkipped ? 'skipped' : 'failed',
        error instanceof Error ? error.message : 'Unknown benchmark error'
      ),
      expectedWinner: testCase.expectedWinner,
    };
  }
}

async function runCompareCase(testCase: CompareBenchmarkCase): Promise<BenchmarkResult> {
  const requestPayload = {
    platform: testCase.platform,
    contentGoal: testCase.contentGoal,
    productTopic: testCase.productTopic,
    targetAudience: testCase.targetAudience,
    aigcContent: testCase.aiContent,
    pgcContent: testCase.pgcReference,
  };

  try {
    const response = await postJson('/api/compare', requestPayload);
    return createBaseResult(testCase, requestPayload, response, 'success');
  } catch (error) {
    const isSkipped = error instanceof Error && error.name === 'Skipped';
    return createBaseResult(
      testCase,
      requestPayload,
      null,
      isSkipped ? 'skipped' : 'failed',
      error instanceof Error ? error.message : 'Unknown benchmark error'
    );
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string | undefined): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function badcaseExplanation(label: string): string {
  if (label.includes('真实体验')) return '主要出现在小红书种草场景，说明泛化 AI 内容往往缺少具体使用细节和限制条件。';
  if (label.includes('Hook') || label.includes('前三秒')) return '主要出现在抖音短视频场景，说明普通产品介绍不适合推荐流注意力竞争。';
  if (label.includes('收藏')) return '说明内容缺少清单、对比、步骤等可复用结构，难以形成收藏动机。';
  if (label.includes('风险') || label.includes('夸大')) return '说明内容可能存在过度承诺或依据不足，需要进入人工复核。';
  if (label.includes('互动')) return '说明内容缺少评论、投票或讨论触发点，抖音传播链路较弱。';
  return '说明该类问题在当前合成样例中重复出现，适合纳入 Prompt Optimizer 和 SOP 模板。';
}

function computeAnalysis(results: BenchmarkResult[]): AnalysisData {
  const success = results.filter((item) => item.status === 'success');
  const scored = success.filter((item) => typeof item.overallScore === 'number');
  const scoredByPlatform = (platform: string) =>
    scored.filter((item) => item.platform === platform).map((item) => item.overallScore as number);
  const badcasePairs = success.flatMap((item) =>
    (item.badcases || []).map((label) => ({ label, platform: item.platform }))
  );
  const badcaseCounts = countBy(badcasePairs, (item) => item.label);
  const topBadcases = Object.entries(badcaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => {
      const platforms = badcasePairs.filter((item) => item.label === label).map((item) => item.platform);
      const platformCounts = countBy(platforms, (item) => item);
      const primaryPlatform =
        Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
      return { label, count, primaryPlatform, explanation: badcaseExplanation(label) };
    });

  const abResults = success.filter((item) => item.module === 'ab-test');
  const abWithWinner = abResults.filter((item) => item.winner);
  const matched = abWithWinner.filter((item) => item.winnerMatched).length;
  const deltas = abResults
    .map((item) => item.improvementDelta)
    .filter((value): value is number => typeof value === 'number');
  const promptBWins = abWithWinner.filter((item) => item.winner === 'B').length;

  const scoreBandCounts = ['0-39', '40-59', '60-74', '75-89', '90-100'].reduce<Record<string, number>>(
    (acc, band) => {
      acc[band] = scored.filter((item) => getScoreBand(item.overallScore) === band).length;
      return acc;
    },
    {}
  );

  const analysis: AnalysisData = {
    totalCases: results.length,
    successCount: results.filter((item) => item.status === 'success').length,
    failedCount: results.filter((item) => item.status === 'failed').length,
    skippedCount: results.filter((item) => item.status === 'skipped').length,
    platformCounts: countBy(results, (item) => item.platform),
    moduleCounts: countBy(results, (item) => item.module),
    averageOverallScore: average(scored.map((item) => item.overallScore as number)),
    averageOverallByPlatform: {
      xiaohongshu: average(scoredByPlatform('xiaohongshu')),
      douyin: average(scoredByPlatform('douyin')),
    },
    scoreBandCounts,
    topBadcases,
    riskCounts: countBy(success, (item) => item.riskLevel || item.expectedRiskLevel),
    abTestStats: {
      total: abResults.length,
      winnerMatched: matched,
      winnerMatchedRate:
        abWithWinner.length === 0 ? null : Number(((matched / abWithWinner.length) * 100).toFixed(1)),
      averageImprovementDelta: average(deltas),
      promptBWinRate:
        abWithWinner.length === 0 ? null : Number(((promptBWins / abWithWinner.length) * 100).toFixed(1)),
    },
    resumeMetricCandidates: [],
  };

  const successRate = Number(((analysis.successCount / analysis.totalCases) * 100).toFixed(1));
  const top3 = analysis.topBadcases.slice(0, 3).map((item) => item.label).join('、') || '暂无';
  analysis.resumeMetricCandidates = [
    `在 ${analysis.totalCases} 条合成 benchmark case 中，ContentFlow 自动完成 ${analysis.successCount} 条测试，成功率 ${successRate}%。`,
    analysis.abTestStats.promptBWinRate === null
      ? 'A/B 测试样例已接入自动双跑，当前暂无可计算的 Prompt B 胜出率。'
      : `在 A/B 测试样例中，Prompt B 在 ${analysis.abTestStats.promptBWinRate}% case 中获得更高综合分。`,
    `高频 Badcase Top 3 为 ${top3}，可用于指导 Prompt Optimizer 和 SOP Builder 优化方向。`,
    `高风险内容识别出 ${analysis.riskCounts.high || 0} 条，可辅助人工复核优先级排序。`,
  ];

  return analysis;
}

function escapeCsv(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(results: BenchmarkResult[]): string {
  const headers = [
    'caseId',
    'title',
    'module',
    'platform',
    'contentGoal',
    'productTopic',
    'overallScore',
    'platformFit',
    'audienceFit',
    'creatorGoalFit',
    'riskLevel',
    'confidenceLevel',
    'badcases',
    'expectedScoreRange',
    'expectedRiskLevel',
    'status',
    'scoreA',
    'scoreB',
    'winner',
    'expectedWinner',
    'winnerMatched',
    'improvementDelta',
    'errorMessage',
    'createdAt',
  ];
  const rows = results.map((item) =>
    headers
      .map((header) => {
        const value = (item as unknown as Record<string, unknown>)[header];
        return escapeCsv(Array.isArray(value) ? value.join(' | ') : value);
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function tableRow(values: unknown[]): string {
  return `| ${values.map((value) => String(value ?? '-').replace(/\n/g, ' ')).join(' | ')} |`;
}

function formatScore(value: number | undefined): string {
  return typeof value === 'number' ? `${value}/100` : '暂无';
}

function platformDisplay(value: string): string {
  if (value === 'xiaohongshu') return '小红书';
  if (value === 'douyin') return '抖音';
  return value;
}

function markdownBlock(value: unknown): string {
  if (value === undefined || value === null || value === '') return '暂无';
  return `\`\`\`\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n\`\`\``;
}

function markdownList(values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) return '- 暂无';
  return values.map((item) => `- ${String(item)}`).join('\n');
}

function getLocalizedAudience(response: unknown): Record<string, unknown> {
  const record = asRecord(response);
  const localized = asRecord(record.localized);
  const zh = asRecord(localized.zh);
  const zhAudience = asRecord(zh.audiencePersona);
  if (Object.keys(zhAudience).length > 0) return zhAudience;
  return asRecord(record.audiencePersona);
}

function getLocalizedPromptV2(response: unknown): Record<string, unknown> {
  const record = asRecord(response);
  const localized = asRecord(record.localized);
  const zh = asRecord(localized.zh);
  const zhPrompt = asRecord(zh.promptV2);
  if (Object.keys(zhPrompt).length > 0) return zhPrompt;
  return asRecord(record.promptV2);
}

function getLocalizedRisk(response: unknown): Record<string, unknown> {
  const record = asRecord(response);
  const localized = asRecord(record.localized);
  const zh = asRecord(localized.zh);
  const zhRisk = asRecord(zh.riskAssessment);
  const risk = asRecord(record.riskAssessment);
  return { ...risk, ...zhRisk };
}

function getLocalizedConfidence(response: unknown): Record<string, unknown> {
  const record = asRecord(response);
  const localized = asRecord(record.localized);
  const zh = asRecord(localized.zh);
  const zhConfidence = asRecord(zh.confidence);
  const confidence = asRecord(record.confidence);
  return { ...confidence, ...zhConfidence };
}

function renderBadcaseDetails(response: unknown): string {
  const record = asRecord(response);
  if (!Array.isArray(record.badcases) || record.badcases.length === 0) return '暂无';
  return record.badcases
    .map((item, index) => {
      const badcase = asRecord(item);
      return `#### Badcase ${index + 1}. ${badcase.badcaseLabel || badcase.type || '未分类问题'}

- Layer：${badcase.layer || '暂无'}
- Type：${badcase.type || '暂无'}
- Evidence：${badcase.evidence || '暂无'}
- Fix：${badcase.fix || '暂无'}`;
    })
    .join('\n\n');
}

function renderEvaluateCase(index: number, item: EvaluateBenchmarkCase, result: BenchmarkResult): string {
  const audience = getLocalizedAudience(result.response);
  const promptV2 = getLocalizedPromptV2(result.response);
  const risk = getLocalizedRisk(result.response);
  const confidence = getLocalizedConfidence(result.response);
  const responseRecord = asRecord(result.response);

  return `## Case ${index}. ${item.title}

- Case ID：${item.id}
- Module：内容评测 Evaluation
- Platform：${platformDisplay(item.platform)}
- Content Goal：${item.contentGoal}
- Product Topic：${item.productTopic}
- Expected Score Range：${item.expectedScoreRange}
- Expected Risk Level：${item.expectedRiskLevel || '暂无'}
- Expected Badcases：${item.expectedBadcases.join('、')}

### 1. 输入 Input

#### Target Audience
${markdownBlock(item.targetAudience)}

#### Original Prompt
${markdownBlock(item.originalPrompt)}

#### AI Generated Content
${markdownBlock(item.aiContent)}

#### PGC Reference
${markdownBlock(item.pgcReference || '未提供')}

### 2. ContentFlow 输出 Output

- Overall Score：${formatScore(result.overallScore)}
- Platform Fit：${formatScore(result.platformFit)}
- Audience Fit：${formatScore(result.audienceFit)}
- Creator Goal Fit：${formatScore(result.creatorGoalFit)}
- Risk Level：${result.riskLevel || '暂无'}
- Confidence Level：${result.confidenceLevel || '暂无'}
- Used Fallback：${String(responseRecord._fallback ?? '暂无')}

### 3. Audience Persona

- 用户意图 User Intent：${audience.userIntent || '暂无'}
- 心理需求 Psychological Needs：
${markdownList(audience.psychologicalNeeds)}
- 信任障碍 Trust Barriers：
${markdownList(audience.trustBarriers)}
- 内容偏好 Content Preference：${audience.contentPreference || '暂无'}

### 4. Badcase Diagnosis

${renderBadcaseDetails(result.response)}

### 5. Prompt v2

#### Optimized Prompt
${markdownBlock(promptV2.optimizedPrompt)}

#### Change Reasons
${markdownList(promptV2.changeReasons)}

#### Expected Improvements
${markdownList(promptV2.expectedImprovements)}

### 6. Risk & Confidence

- riskAssessment.riskLevel：${risk.riskLevel || '暂无'}
- riskAssessment.riskTypes / 中文 label：
${markdownList(risk.riskTypeLabels || risk.riskTypes)}
- riskAssessment.reasons：
${markdownList(risk.reasons)}
- confidence.score：${confidence.score ?? '暂无'}
- confidence.level：${confidence.level || '暂无'}
- confidence.reasons：
${markdownList(confidence.reasons)}
`;
}

function renderAbCase(index: number, item: AbTestBenchmarkCase, result: BenchmarkResult): string {
  const response = asRecord(result.response);
  const responseA = response.A;
  const responseB = response.B;
  const bPrompt = getLocalizedPromptV2(responseB);
  const conclusion =
    result.winner === 'B'
      ? 'Prompt B 在该 case 中获得更高综合分，说明加入平台机制、受众约束、真实场景或表达结构后，内容适配度提升。'
      : result.scoreA === result.scoreB
        ? '两版差异有限，需要引入更明确的目标约束或平台表达结构。'
        : 'Prompt B 未显著提升，需要检查 Prompt 优化方向。';

  return `## Case ${index}. ${item.title}

- Case ID：${item.id}
- Module：A/B 测试
- Platform：${platformDisplay(item.platform)}
- Content Goal：${item.contentGoal}
- Product Topic：${item.productTopic}
- Expected Winner：${item.expectedWinner}
- Expected Improvement Areas：${item.expectedImprovementAreas.join('、')}

### 1. 输入 Input

#### Prompt A
${markdownBlock(item.promptA)}

#### Content A
${markdownBlock(item.contentA)}

#### Prompt B
${markdownBlock(item.promptB)}

#### Content B
${markdownBlock(item.contentB)}

### 2. A/B 自动评测结果

- Score A：${formatScore(result.scoreA)}
- Score B：${formatScore(result.scoreB)}
- Winner：${result.winner || '暂无'}
- Expected Winner：${result.expectedWinner || '暂无'}
- Winner Matched：${result.winnerMatched ?? '暂无'}
- Improvement Delta：${result.improvementDelta ?? '暂无'}

### 3. A 版本主要问题

${responseA ? renderBadcaseDetails(responseA) : '当前 runner 未保存 A 版本完整 badcase，可查看 latest.json 原始结果。'}

### 4. B 版本主要问题 / 优化表现

${responseB ? renderBadcaseDetails(responseB) : '暂无'}

#### B 版本 Prompt v2
${markdownBlock(bPrompt.optimizedPrompt)}

### 5. 结论

${conclusion}
`;
}

function renderCompareCase(index: number, item: CompareBenchmarkCase, result: BenchmarkResult): string {
  const response = asRecord(result.response);
  const transferable = response.transferableRules || response.transferablePatterns;
  const weaknesses = response.aigcWeaknesses;

  return `## Case ${index}. ${item.title}

- Case ID：${item.id}
- Module：PGC 对比
- Platform：${platformDisplay(item.platform)}
- Content Goal：${item.contentGoal}
- Product Topic：${item.productTopic}
- Expected Transferable Patterns：${item.expectedTransferablePatterns.join('、')}
- Expected AIGC Weaknesses：${item.expectedAigcWeaknesses.join('、')}

### 1. 输入 Input

#### AI Content
${markdownBlock(item.aiContent)}

#### PGC Reference
${markdownBlock(item.pgcReference)}

### 2. Compare 输出 Output

- score / overallScore：${response.score || response.overallScore || '暂无'}
- gapSummary：${response.gapSummary || '暂无'}
- sopPotential：${markdownBlock(response.sopPotential || '暂无')}

#### 完整 response 摘要
${markdownBlock(result.response)}

### 3. 可迁移策略

#### Expected Transferable Patterns
${markdownList(item.expectedTransferablePatterns)}

#### Model Transferable Patterns
${markdownList(transferable)}

### 4. AIGC 内容短板

#### Expected AIGC Weaknesses
${markdownList(item.expectedAigcWeaknesses)}

#### Model AIGC Weaknesses
${markdownList(weaknesses)}
`;
}

function createCasesReport(results: BenchmarkResult[]): string {
  const caseMap = new Map(benchmarkCases.map((item) => [item.id, item]));
  const detailSections = results
    .map((result, index) => {
      const item = caseMap.get(result.caseId);
      if (!item) return `## Case ${index + 1}. ${result.title}\n\n原始 case 未找到。`;
      if (item.module === 'evaluate') return renderEvaluateCase(index + 1, item, result);
      if (item.module === 'ab-test') return renderAbCase(index + 1, item, result);
      return renderCompareCase(index + 1, item, result);
    })
    .join('\n\n---\n\n');

  const indexRows = results
    .map((item) =>
      tableRow([
        item.caseId,
        item.module,
        item.platform,
        item.title,
        item.status,
        item.module === 'ab-test'
          ? `${formatScore(item.scoreA)} / ${formatScore(item.scoreB)}`
          : formatScore(item.overallScore),
        item.riskLevel || '-',
        (item.badcases || []).slice(0, 3).join('、') || '-',
      ])
    )
    .join('\n');

  return `# ContentFlow Benchmark Case Details

本报告展示全部 ${results.length} 条 benchmark case 的原始输入、ContentFlow 输出、评分、Badcase、风险、Prompt 优化建议和对比结果。所有样例均为合成测试场景，不代表真实用户线上数据。

${detailSections}

# Appendix：Case Index

| caseId | module | platform | title | status | overallScore 或 scoreA/scoreB | riskLevel | topBadcases |
| --- | --- | --- | --- | --- | --- | --- | --- |
${indexRows}
`;
}

function createSummary(results: BenchmarkResult[], analysis: AnalysisData): string {
  const evaluate = results.filter((item) => item.module === 'evaluate');
  const abTests = results.filter((item) => item.module === 'ab-test');
  const compares = results.filter((item) => item.module === 'compare');
  const failures = results.filter((item) => item.status === 'failed');
  const compareSuccess = compares.some((item) => item.status === 'success');

  return `# ContentFlow Benchmark Report

## Run Info
- Run time: ${RUN_TIME}
- Base URL: ${BASE_URL}
- Total cases: ${analysis.totalCases}
- Success count: ${analysis.successCount}
- Failed count: ${analysis.failedCount}
- Skipped count: ${analysis.skippedCount}

如需查看全部 ${analysis.totalCases} 条 benchmark case 的完整输入与输出，请打开 benchmark-results/latest-cases.md。

## Evaluate Results
| caseId | title | platform | contentGoal | overallScore | riskLevel | topBadcases | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
${evaluate
  .map((item) =>
    tableRow([
      item.caseId,
      item.title,
      item.platform,
      item.contentGoal,
      item.overallScore === undefined ? '-' : `${item.overallScore}/100`,
      item.riskLevel || '-',
      (item.badcases || []).slice(0, 3).join('、') || '-',
      item.status,
    ])
  )
  .join('\n')}

## A/B Test Results
| caseId | title | platform | scoreA | scoreB | winner | expectedWinner | winnerMatched | improvementDelta | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${abTests
  .map((item) =>
    tableRow([
      item.caseId,
      item.title,
      item.platform,
      item.scoreA === undefined ? '-' : `${item.scoreA}/100`,
      item.scoreB === undefined ? '-' : `${item.scoreB}/100`,
      item.winner || '-',
      item.expectedWinner || '-',
      item.winnerMatched === undefined ? '-' : item.winnerMatched ? 'yes' : 'no',
      item.improvementDelta ?? '-',
      item.status,
    ])
  )
  .join('\n')}

## PGC Compare Results
${
  compareSuccess
    ? `| caseId | title | platform | summary | status |
| --- | --- | --- | --- | --- |
${compares
  .map((item) => tableRow([item.caseId, item.title, item.platform, asRecord(item.response).gapSummary || '-', item.status]))
  .join('\n')}`
    : '当前 compare cases 已准备，但自动 API 尚未接入或调用失败，可在前端页面手动验证。'
}

## Failure Log
${
  failures.length === 0
    ? 'No failed cases.'
    : failures.map((item) => `- ${item.caseId}: ${item.errorMessage || 'Unknown error'}`).join('\n')
}
`;
}

function createAnalysisReport(results: BenchmarkResult[], analysis: AnalysisData): string {
  const xhsProblems = analysis.topBadcases
    .filter((item) => item.primaryPlatform === 'xiaohongshu')
    .slice(0, 4)
    .map((item) => item.label);
  const dyProblems = analysis.topBadcases
    .filter((item) => item.primaryPlatform === 'douyin')
    .slice(0, 4)
    .map((item) => item.label);
  const riskTypes = Object.entries(analysis.riskCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => `- ${level}: ${count}`)
    .join('\n');

  return `# ContentFlow Benchmark Analysis

## 1. 测试目标

本 benchmark 用于验证 ContentFlow 在小红书/抖音典型内容场景下，对 AIGC 内容质量、Badcase 归因、风险识别、Prompt 优化和平台差异化评测的稳定性。

## 2. 测试集构成

- 总 case 数：${analysis.totalCases}
- evaluate case 数：${analysis.moduleCounts.evaluate || 0}
- ab-test case 数：${analysis.moduleCounts['ab-test'] || 0}
- compare case 数：${analysis.moduleCounts.compare || 0}
- 小红书 case 数：${analysis.platformCounts.xiaohongshu || 0}
- 抖音 case 数：${analysis.platformCounts.douyin || 0}
- 高风险 case 数：${benchmarkCases.filter((item) => item.expectedRiskLevel === 'high').length}

## 3. 总体评分表现

- 平均综合分：${analysis.averageOverallScore === null ? '暂无数据' : `${analysis.averageOverallScore}/100`}
- 小红书平均综合分：${
    analysis.averageOverallByPlatform.xiaohongshu === null
      ? '暂无数据'
      : `${analysis.averageOverallByPlatform.xiaohongshu}/100`
  }
- 抖音平均综合分：${
    analysis.averageOverallByPlatform.douyin === null
      ? '暂无数据'
      : `${analysis.averageOverallByPlatform.douyin}/100`
  }
- 低分 case 数（0-39）：${analysis.scoreBandCounts['0-39']}
- 中低分 case 数（40-59）：${analysis.scoreBandCounts['40-59']}
- 可用 case 数（60-74）：${analysis.scoreBandCounts['60-74']}
- 良好 case 数（75-89）：${analysis.scoreBandCounts['75-89']}
- 高度适配 case 数（90-100）：${analysis.scoreBandCounts['90-100']}

## 4. 高频 Badcase 分析

| badcase 名称 | 出现次数 | 主要平台 | 产品解释 |
| --- | --- | --- | --- |
${analysis.topBadcases
  .map((item) => tableRow([item.label, item.count, item.primaryPlatform, item.explanation]))
  .join('\n') || '| 暂无 | 0 | - | 当前运行没有返回 badcase 数据。 |'}

## 5. 平台差异分析

小红书常见问题：
- ${xhsProblems[0] || '搜索意图不足'}
- ${xhsProblems[1] || '真实体验不足'}
- ${xhsProblems[2] || '信任障碍未回应'}
- ${xhsProblems[3] || '收藏价值不足'}

抖音常见问题：
- ${dyProblems[0] || '前三秒 Hook 弱'}
- ${dyProblems[1] || '完播动机不足'}
- ${dyProblems[2] || '镜头感不足'}
- ${dyProblems[3] || '互动触发弱'}

当前结论基于合成 benchmark case 与 API 返回结果，样本量仍然有限，应作为产品验证信号而非最终统计结论。

## 6. A/B 测试效果分析

- A/B case 总数：${analysis.abTestStats.total}
- 自动判断 winner 的 case 数：${results.filter((item) => item.module === 'ab-test' && item.winner).length}
- expectedWinner 命中数：${analysis.abTestStats.winnerMatched}
- winnerMatched rate：${
    analysis.abTestStats.winnerMatchedRate === null ? '暂无数据' : `${analysis.abTestStats.winnerMatchedRate}%`
  }
- 平均 improvementDelta：${
    analysis.abTestStats.averageImprovementDelta === null ? '暂无数据' : analysis.abTestStats.averageImprovementDelta
  }
- Prompt B 胜出比例：${analysis.abTestStats.promptBWinRate === null ? '暂无数据' : `${analysis.abTestStats.promptBWinRate}%`}

Prompt v2 是否通常优于 Prompt v1，需要结合 winnerMatched rate 与 improvementDelta 共同判断。当前测试集中，Prompt B 主要通过加入目标受众、平台机制、真实场景、限制条件、Hook / 互动 / 镜头感来提升内容质量。

## 7. 风险识别分析

${riskTypes || '- 暂无风险统计'}

风险分析重点观察 ContentFlow 是否能识别夸大宣传、未支撑功效、输入信息不足、伪装真实体验等风险。若 high / medium 风险返回较少，应优先扩充高风险样例和 risk taxonomy。

## 8. 可用于简历/作品集的指标候选

${analysis.resumeMetricCandidates.map((item) => `- ${item}`).join('\n')}

以上指标来自合成 benchmark 测试集，不代表真实用户线上数据。

## 9. 产品迭代建议

- 继续扩充小红书和抖音各自的 benchmark 覆盖，尤其是高风险和低置信样例。
- 将高频 Badcase 纳入 Prompt Optimizer 的显式约束，减少泛化输出。
- 为 /ab-test 增加更完整的专用 API，避免长期依赖 evaluate 双跑。
- 为 /compare 增加结构化评分字段，方便量化 PGC/AIGC 差距。
- 引入人工标注对齐，用真实人工反馈校准 LLM-as-a-Judge 的 Rubric。

## 10. 边界说明

- 当前 benchmark 使用合成测试样例，不直接复制真实平台内容。
- 结果用于产品验证和作品集展示，不代表真实平台推荐效果或转化预测。
- 后续可以接入真实用户授权样本和人工标注数据。
`;
}

async function writeReports(results: BenchmarkResult[], analysis: AnalysisData) {
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(path.join(RESULTS_DIR, 'latest.json'), JSON.stringify({ runTime: RUN_TIME, baseUrl: BASE_URL, results }, null, 2));
  await writeFile(path.join(RESULTS_DIR, 'latest.csv'), toCsv(results));
  await writeFile(path.join(RESULTS_DIR, 'latest-cases.md'), createCasesReport(results));
  await writeFile(path.join(RESULTS_DIR, 'latest-summary.md'), createSummary(results, analysis));
  await writeFile(path.join(RESULTS_DIR, 'latest-analysis.md'), createAnalysisReport(results, analysis));
  await writeFile(path.join(RESULTS_DIR, 'benchmark-analysis-data.json'), JSON.stringify(analysis, null, 2));
}

async function main() {
  console.log(`Running ContentFlow benchmark against ${BASE_URL}`);
  console.log(
    `Cases: evaluate=${evaluateBenchmarkCases.length}, ab-test=${abTestBenchmarkCases.length}, compare=${compareBenchmarkCases.length}`
  );

  const results: BenchmarkResult[] = [];
  for (const testCase of benchmarkCases) {
    console.log(`- ${testCase.id} ${testCase.title}`);
    if (testCase.module === 'evaluate') {
      results.push(await runEvaluateCase(testCase));
    } else if (testCase.module === 'ab-test') {
      results.push(await runAbTestCase(testCase));
    } else {
      results.push(await runCompareCase(testCase));
    }
  }

  const analysis = computeAnalysis(results);
  await writeReports(results, analysis);
  console.log(
    `Benchmark complete: success=${analysis.successCount}, failed=${analysis.failedCount}, skipped=${analysis.skippedCount}`
  );
  console.log(`Reports written to ${RESULTS_DIR}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
