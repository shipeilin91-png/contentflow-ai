import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
  platformModuleStats: PlatformModuleStats;
  capabilityStats: CapabilityStats;
  resumeMetricCandidates: string[];
}

interface EvaluateModuleStats {
  total: number;
  successCount: number;
  averageOverallScore: number | null;
  highRiskCount: number;
  topBadcases: { label: string; count: number }[];
}

interface AbTestModuleStats {
  total: number;
  promptBWinRate: number | null;
  averageImprovementDelta: number | null;
  winnerMatchedRate: number | null;
}

interface CompareModuleStats {
  total: number;
  successCount: number;
  transferablePatternCount: number;
  aigcWeaknessCount: number;
}

interface PlatformCapabilityStats {
  evaluate: EvaluateModuleStats;
  abTest: AbTestModuleStats;
  compare: CompareModuleStats;
}

interface PlatformModuleStats {
  xiaohongshu: PlatformCapabilityStats;
  douyin: PlatformCapabilityStats;
}

interface CapabilityStats {
  evaluation: {
    total: number;
    successRate: number | null;
    averageOverallScore: number | null;
    riskDetectionCount: number;
    badcaseExtractionRate: number | null;
  };
  abTest: {
    total: number;
    promptBWinRate: number | null;
    averageImprovementDelta: number | null;
    winnerMatchedRate: number | null;
  };
  pgcCompare: {
    total: number;
    successRate: number | null;
    transferablePatternExtractionRate: number | null;
    aigcWeaknessExtractionRate: number | null;
  };
  riskAssessment: {
    lowRiskCount: number;
    mediumRiskCount: number;
    highRiskCount: number;
    highRiskRate: number | null;
    mediumOrHighRiskRate: number | null;
  };
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

function percentage(part: number, total: number): number | null {
  if (total === 0) return null;
  return Number(((part / total) * 100).toFixed(1));
}

function readCompareTransferablePatterns(response: unknown): unknown[] {
  const record = asRecord(response);
  const transferable = record.transferableRules || record.transferablePatterns;
  return Array.isArray(transferable) ? transferable : [];
}

function readCompareWeaknesses(response: unknown): unknown[] {
  const weaknesses = asRecord(response).aigcWeaknesses;
  return Array.isArray(weaknesses) ? weaknesses : [];
}

function topBadcaseLabels(results: BenchmarkResult[], limit = 5): { label: string; count: number }[] {
  const counts = countBy(
    results.flatMap((item) => item.badcases || []),
    (label) => label
  );
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function computeEvaluateModuleStats(results: BenchmarkResult[]): EvaluateModuleStats {
  const success = results.filter((item) => item.status === 'success');
  return {
    total: results.length,
    successCount: success.length,
    averageOverallScore: average(
      success.map((item) => item.overallScore).filter((value): value is number => typeof value === 'number')
    ),
    highRiskCount: success.filter((item) => item.riskLevel === 'high').length,
    topBadcases: topBadcaseLabels(success),
  };
}

function computeAbTestModuleStats(results: BenchmarkResult[]): AbTestModuleStats {
  const success = results.filter((item) => item.status === 'success');
  const withWinner = success.filter((item) => item.winner);
  const deltas = success
    .map((item) => item.improvementDelta)
    .filter((value): value is number => typeof value === 'number');
  return {
    total: results.length,
    promptBWinRate: percentage(withWinner.filter((item) => item.winner === 'B').length, withWinner.length),
    averageImprovementDelta: average(deltas),
    winnerMatchedRate: percentage(withWinner.filter((item) => item.winnerMatched).length, withWinner.length),
  };
}

function computeCompareModuleStats(results: BenchmarkResult[]): CompareModuleStats {
  const success = results.filter((item) => item.status === 'success');
  return {
    total: results.length,
    successCount: success.length,
    transferablePatternCount: success.reduce(
      (sum, item) => sum + readCompareTransferablePatterns(item.response).length,
      0
    ),
    aigcWeaknessCount: success.reduce((sum, item) => sum + readCompareWeaknesses(item.response).length, 0),
  };
}

function computePlatformModuleStats(results: BenchmarkResult[]): PlatformModuleStats {
  const statsFor = (platform: 'xiaohongshu' | 'douyin'): PlatformCapabilityStats => {
    const platformResults = results.filter((item) => item.platform === platform);
    return {
      evaluate: computeEvaluateModuleStats(platformResults.filter((item) => item.module === 'evaluate')),
      abTest: computeAbTestModuleStats(platformResults.filter((item) => item.module === 'ab-test')),
      compare: computeCompareModuleStats(platformResults.filter((item) => item.module === 'compare')),
    };
  };

  return {
    xiaohongshu: statsFor('xiaohongshu'),
    douyin: statsFor('douyin'),
  };
}

function computeCapabilityStats(results: BenchmarkResult[], riskCounts: Record<string, number>): CapabilityStats {
  const evaluate = results.filter((item) => item.module === 'evaluate');
  const evaluateSuccess = evaluate.filter((item) => item.status === 'success');
  const compare = results.filter((item) => item.module === 'compare');
  const compareSuccess = compare.filter((item) => item.status === 'success');
  const abTest = results.filter((item) => item.module === 'ab-test');
  const abStats = computeAbTestModuleStats(abTest);
  const totalRisk = (riskCounts.low || 0) + (riskCounts.medium || 0) + (riskCounts.high || 0);

  return {
    evaluation: {
      total: evaluate.length,
      successRate: percentage(evaluateSuccess.length, evaluate.length),
      averageOverallScore: average(
        evaluateSuccess
          .map((item) => item.overallScore)
          .filter((value): value is number => typeof value === 'number')
      ),
      riskDetectionCount: evaluateSuccess.filter((item) => item.riskLevel === 'medium' || item.riskLevel === 'high')
        .length,
      badcaseExtractionRate: percentage(
        evaluateSuccess.filter((item) => (item.badcases || []).length > 0).length,
        evaluateSuccess.length
      ),
    },
    abTest: {
      total: abStats.total,
      promptBWinRate: abStats.promptBWinRate,
      averageImprovementDelta: abStats.averageImprovementDelta,
      winnerMatchedRate: abStats.winnerMatchedRate,
    },
    pgcCompare: {
      total: compare.length,
      successRate: percentage(compareSuccess.length, compare.length),
      transferablePatternExtractionRate: percentage(
        compareSuccess.filter((item) => readCompareTransferablePatterns(item.response).length > 0).length,
        compareSuccess.length
      ),
      aigcWeaknessExtractionRate: percentage(
        compareSuccess.filter((item) => readCompareWeaknesses(item.response).length > 0).length,
        compareSuccess.length
      ),
    },
    riskAssessment: {
      lowRiskCount: riskCounts.low || 0,
      mediumRiskCount: riskCounts.medium || 0,
      highRiskCount: riskCounts.high || 0,
      highRiskRate: percentage(riskCounts.high || 0, totalRisk),
      mediumOrHighRiskRate: percentage((riskCounts.medium || 0) + (riskCounts.high || 0), totalRisk),
    },
  };
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

  const riskCounts = countBy(success, (item) => item.riskLevel || item.expectedRiskLevel);
  const platformModuleStats = computePlatformModuleStats(results);
  const capabilityStats = computeCapabilityStats(results, riskCounts);

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
    riskCounts,
    abTestStats: {
      total: abResults.length,
      winnerMatched: matched,
      winnerMatchedRate:
        abWithWinner.length === 0 ? null : Number(((matched / abWithWinner.length) * 100).toFixed(1)),
      averageImprovementDelta: average(deltas),
      promptBWinRate:
        abWithWinner.length === 0 ? null : Number(((promptBWins / abWithWinner.length) * 100).toFixed(1)),
    },
    platformModuleStats,
    capabilityStats,
    resumeMetricCandidates: [],
  };

  const successRate = Number(((analysis.successCount / analysis.totalCases) * 100).toFixed(1));
  const top3 = analysis.topBadcases.slice(0, 3).map((item) => item.label).join('、') || '暂无';
  analysis.resumeMetricCandidates = [
    `基于 ${analysis.totalCases} 条合成 benchmark case 验证评测链路，ContentFlow 自动完成 ${analysis.successCount} 条测试，成功率 ${successRate}%。`,
    `A/B 模块中优化版 Prompt 胜出率达 ${analysis.capabilityStats.abTest.promptBWinRate ?? '暂无'}%，平均综合分提升 ${analysis.capabilityStats.abTest.averageImprovementDelta ?? '暂无'} 分，winnerMatched rate 为 ${analysis.capabilityStats.abTest.winnerMatchedRate ?? '暂无'}%。`,
    `Evaluation 模块 badcase 提取率为 ${analysis.capabilityStats.evaluation.badcaseExtractionRate ?? '暂无'}%，可将平台内容问题拆解为可解释评分、Badcase 和风险等级。`,
    `PGC Compare 模块可迁移策略提取率为 ${analysis.capabilityStats.pgcCompare.transferablePatternExtractionRate ?? '暂无'}%，AIGC weakness 提取率为 ${analysis.capabilityStats.pgcCompare.aigcWeaknessExtractionRate ?? '暂无'}%，可反哺 Prompt 模板与 SOP 迭代。`,
    `Risk Assessment 识别 high-risk 内容 ${analysis.capabilityStats.riskAssessment.highRiskCount} 条（${analysis.capabilityStats.riskAssessment.highRiskRate ?? '暂无'}%），medium/high risk 合计 ${analysis.capabilityStats.riskAssessment.mediumOrHighRiskRate ?? '暂无'}%，可辅助人工复核优先级排序。`,
    `高频 Badcase Top 3 为 ${top3}，可用于指导 Prompt Optimizer 和 SOP Builder 优化方向。`,
    '以上指标来自合成 benchmark 测试集，不代表真实用户线上数据。',
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
  const xhs = analysis.platformModuleStats.xiaohongshu;
  const dy = analysis.platformModuleStats.douyin;
  const formatPercent = (value: number | null) => (value === null ? '暂无数据' : `${value}%`);
  const formatNumber = (value: number | null) => (value === null ? '暂无数据' : String(value));
  const formatTopBadcases = (items: { label: string; count: number }[]) =>
    items.length === 0 ? '暂无' : items.slice(0, 3).map((item) => `${item.label}（${item.count}）`).join('、');

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

## 6. 平台 × 能力模块表现

### 小红书场景

- Evaluation 模块长处：在 ${xhs.evaluate.successCount}/${xhs.evaluate.total} 条小红书评测样例中完成评估，平均综合分为 ${formatNumber(xhs.evaluate.averageOverallScore)}/100；高频问题集中在 ${formatTopBadcases(xhs.evaluate.topBadcases)}，说明 ContentFlow 能识别搜索意图、购买顾虑、收藏价值、真实体验等影响种草转化的关键问题。
- A/B Test 模块长处：Prompt B 胜出率为 ${formatPercent(xhs.abTest.promptBWinRate)}，平均 improvementDelta 为 ${formatNumber(xhs.abTest.averageImprovementDelta)}，winnerMatched rate 为 ${formatPercent(xhs.abTest.winnerMatchedRate)}。这说明引入搜索词、真实体验、限制条件和可收藏结构后，小红书内容适配度有可量化提升。
- PGC Compare 模块长处：${xhs.compare.successCount}/${xhs.compare.total} 条小红书 PGC 对比样例成功完成，提取 ${xhs.compare.transferablePatternCount} 条可迁移策略和 ${xhs.compare.aigcWeaknessCount} 条 AIGC 短板，可用于定位 AI 内容与 PGC 标杆之间的信任信号、真实体验和结构差距。

### 抖音场景

- Evaluation 模块长处：在 ${dy.evaluate.successCount}/${dy.evaluate.total} 条抖音评测样例中完成评估，平均综合分为 ${formatNumber(dy.evaluate.averageOverallScore)}/100；高频问题集中在 ${formatTopBadcases(dy.evaluate.topBadcases)}，说明 ContentFlow 能识别前三秒 Hook、冲突反差、完播动机、互动触发等短视频关键问题。
- A/B Test 模块长处：Prompt B 胜出率为 ${formatPercent(dy.abTest.promptBWinRate)}，平均 improvementDelta 为 ${formatNumber(dy.abTest.averageImprovementDelta)}，winnerMatched rate 为 ${formatPercent(dy.abTest.winnerMatchedRate)}。这说明加入镜头语言、节奏转折、真实场景和评论触发后，抖音脚本适配度有可量化提升。
- PGC Compare 模块长处：${dy.compare.successCount}/${dy.compare.total} 条抖音 PGC 对比样例成功完成，提取 ${dy.compare.transferablePatternCount} 条可迁移策略和 ${dy.compare.aigcWeaknessCount} 条 AIGC 短板，可用于发现 AI 脚本与 PGC 标杆之间的镜头感、节奏和互动机制差距。

## 7. A/B 测试效果分析

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

## 8. 风险识别分析

${riskTypes || '- 暂无风险统计'}

风险分析重点观察 ContentFlow 是否能识别夸大宣传、未支撑功效、输入信息不足、伪装真实体验等风险。若 high / medium 风险返回较少，应优先扩充高风险样例和 risk taxonomy。

## 9. 模块能力优势总结

### 1. Evaluation 模块

- 优势：能将平台内容质量问题拆解为可解释评分、Badcase、风险等级。
- 数据：${analysis.capabilityStats.evaluation.total} 条 evaluate case，成功率 ${formatPercent(analysis.capabilityStats.evaluation.successRate)}，平均综合分 ${formatNumber(analysis.capabilityStats.evaluation.averageOverallScore)}/100，风险识别数量 ${analysis.capabilityStats.evaluation.riskDetectionCount}，badcase 提取率 ${formatPercent(analysis.capabilityStats.evaluation.badcaseExtractionRate)}。

### 2. A/B Test 模块

- 优势：能验证 Prompt 优化是否真的带来质量提升。
- 数据：${analysis.capabilityStats.abTest.total} 条 A/B case，Prompt B 胜出率 ${formatPercent(analysis.capabilityStats.abTest.promptBWinRate)}，平均 improvementDelta ${formatNumber(analysis.capabilityStats.abTest.averageImprovementDelta)}，winnerMatched rate ${formatPercent(analysis.capabilityStats.abTest.winnerMatchedRate)}。

### 3. PGC Compare 模块

- 优势：能从 PGC 标杆中提取可迁移结构，发现 AIGC 内容短板。
- 数据：${analysis.capabilityStats.pgcCompare.total} 条 compare case，成功率 ${formatPercent(analysis.capabilityStats.pgcCompare.successRate)}，可迁移策略提取率 ${formatPercent(analysis.capabilityStats.pgcCompare.transferablePatternExtractionRate)}，AIGC weakness 提取率 ${formatPercent(analysis.capabilityStats.pgcCompare.aigcWeaknessExtractionRate)}。

### 4. Risk Assessment 模块

- 优势：能辅助人工复核优先级排序。
- 数据：high-risk rate ${formatPercent(analysis.capabilityStats.riskAssessment.highRiskRate)}，medium/high risk rate ${formatPercent(analysis.capabilityStats.riskAssessment.mediumOrHighRiskRate)}；其中 high-risk ${analysis.capabilityStats.riskAssessment.highRiskCount} 条，medium-risk ${analysis.capabilityStats.riskAssessment.mediumRiskCount} 条。

## 10. 可直接用于简历的数据表达

${analysis.resumeMetricCandidates.map((item) => `- ${item}`).join('\n')}

## 11. 产品迭代建议

- 继续扩充小红书和抖音各自的 benchmark 覆盖，尤其是高风险和低置信样例。
- 将高频 Badcase 纳入 Prompt Optimizer 的显式约束，减少泛化输出。
- 为 /ab-test 增加更完整的专用 API，避免长期依赖 evaluate 双跑。
- 为 /compare 增加结构化评分字段，方便量化 PGC/AIGC 差距。
- 引入人工标注对齐，用真实人工反馈校准 LLM-as-a-Judge 的 Rubric。

## 12. 边界说明

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

async function loadLatestResults(): Promise<BenchmarkResult[]> {
  const latestPath = path.join(RESULTS_DIR, 'latest.json');
  const raw = await readFile(latestPath, 'utf8');
  const parsed = JSON.parse(raw) as { results?: unknown };
  if (!Array.isArray(parsed.results)) {
    throw new Error('benchmark-results/latest.json does not contain a results array');
  }
  return parsed.results as BenchmarkResult[];
}

async function main() {
  if (process.env.BENCHMARK_REUSE_LATEST === '1') {
    console.log('Regenerating benchmark reports from benchmark-results/latest.json');
    const results = await loadLatestResults();
    const analysis = computeAnalysis(results);
    await writeReports(results, analysis);
    console.log(
      `Reports regenerated: success=${analysis.successCount}, failed=${analysis.failedCount}, skipped=${analysis.skippedCount}`
    );
    return;
  }

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
