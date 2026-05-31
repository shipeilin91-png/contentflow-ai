'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getMockResult,
  type EvaluationResult,
  type BadcaseItem,
} from '../data/mockResults';
import { addHistoryItem, generateId } from '../utils/history';
import CalibrationPanel from '../components/CalibrationPanel';
import SaveSopButton from '../components/SaveSopButton';
import SavePromptButton from '../components/SavePromptButton';
import {
  XHS_DEFAULT_STRUCTURE,
  DY_DEFAULT_STRUCTURE,
  XHS_DEFAULT_RUBRIC,
  DY_DEFAULT_RUBRIC,
} from '../types/sop';

// ── Constants ───────────────────────────────────────────────────────
const PLATFORMS = ['小红书', '抖音'] as const;
const GOALS = ['种草', '转化', '涨粉', '搜索沉淀'] as const;

const SCORE_LABELS: Record<string, string> = {
  platformFit: '平台适配 Platform Fit',
  audienceFit: '受众适配 Audience Fit',
  creatorGoalFit: '创作者目标 Creator Goal',
  overallEffectiveness: '综合 Overall',
} as const;

type ScoreKey = 'platformFit' | 'audienceFit' | 'creatorGoalFit' | 'overallEffectiveness';
const SCORE_KEYS: ScoreKey[] = ['platformFit', 'audienceFit', 'creatorGoalFit', 'overallEffectiveness'];

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

// ── Types ────────────────────────────────────────────────────────────
interface ABTestResult {
  resultA: EvaluationResult;
  resultB: EvaluationResult;
  winner: 'Prompt v1' | 'Prompt v2';
  scores: Record<ScoreKey, { a: number; b: number; delta: number }>;
  badcaseA: number;
  badcaseB: number;
  resolvedTypes: string[];
  remainingIssues: string[];
  recommendationReasons: string[];
  nextAdvice: string[];
  fallbackA: boolean;
  fallbackB: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}
function deltaColor(delta: number) {
  if (delta > 0) return 'text-emerald-600';
  if (delta < 0) return 'text-red-500';
  return 'text-slate-400';
}
function deltaPrefix(delta: number) { return delta > 0 ? '+' : ''; }
function sectionIcon(cls: string, letter: string) {
  return <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${cls}`}>{letter}</span>;
}

// ── Call /api/evaluate for one side ──────────────────────────────────
async function evaluateOne(
  platform: string, contentGoal: string, productTopic: string,
  targetAudience: string, originalPrompt: string, aiContent: string
): Promise<{ result: EvaluationResult; fallback: boolean }> {
  const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: apiPlatform, contentGoal, productTopic, targetAudience, originalPrompt, aiContent }),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const { _fallback, ...evaluationData } = data;
    return { result: evaluationData as EvaluationResult, fallback: !!_fallback };
  } catch (err) {
    console.error('[ContentFlow AI] A/B evaluation failed, using mock fallback:', err);
    return { result: getMockResult(platform), fallback: true };
  }
}

// ── Build comparison analysis ────────────────────────────────────────
function buildComparison(
  resultA: EvaluationResult, resultB: EvaluationResult, platform: string,
  fallbackA: boolean, fallbackB: boolean
): ABTestResult {
  const scores = {} as ABTestResult['scores'];
  for (const key of SCORE_KEYS) {
    const a = resultA.triFlowScores[key], b = resultB.triFlowScores[key];
    scores[key] = { a, b, delta: b - a };
  }
  const badcaseA = resultA.badcases.length, badcaseB = resultB.badcases.length;
  const typesA = new Set(resultA.badcases.map(bc => bc.type));
  const typesB = new Set(resultB.badcases.map(bc => bc.type));
  const resolvedTypes = [...typesA].filter(t => !typesB.has(t));
  const remainingIssues = resultB.badcases.map(bc => bc.type);
  const bOverall = resultB.triFlowScores.overallEffectiveness;
  const aOverall = resultA.triFlowScores.overallEffectiveness;
  const winner = bOverall > aOverall ? 'Prompt v2' : 'Prompt v1';

  const recommendationReasons: string[] = [];
  const improvements: string[] = [], regressions: string[] = [];
  for (const [key, s] of Object.entries(scores) as [ScoreKey, { a: number; b: number; delta: number }][]) {
    if (key === 'overallEffectiveness') continue;
    if (s.delta > 0) improvements.push(`${SCORE_LABELS[key]} ↑ ${s.delta} (${s.a} → ${s.b})`);
    else if (s.delta < 0) regressions.push(`${SCORE_LABELS[key]} ↓ ${Math.abs(s.delta)} (${s.a} → ${s.b})`);
  }

  if (winner === 'Prompt v2') {
    recommendationReasons.push(`综合分提升 +${bOverall - aOverall} 分 (${aOverall} → ${bOverall})`);
    if (improvements.length) recommendationReasons.push(`提升项: ${improvements.join('; ')}`);
    if (resolvedTypes.length) recommendationReasons.push(`已解决 ${resolvedTypes.length} 个问题类型: ${resolvedTypes.join(', ')}`);
    if (regressions.length) recommendationReasons.push(`⚠ 需关注回退: ${regressions.join('; ')}`);
    if (badcaseB > 0) recommendationReasons.push(`仍有 ${badcaseB} 个问题待下一轮优化`);
  } else {
    if (aOverall === bOverall) recommendationReasons.push('评分持平 — 两者表现相当，请参考下方定性差异');
    else recommendationReasons.push(`Prompt v1 仍领先 +${aOverall - bOverall} 分 — v2 需进一步打磨`);
    if (regressions.length) recommendationReasons.push(`v2 主要回退: ${regressions.join('; ')}`);
    if (improvements.length) recommendationReasons.push(`v2 有改善的维度: ${improvements.join('; ')} — 可提取保留`);
  }

  const nextAdvice: string[] = [];
  if (platform === '小红书') {
    nextAdvice.push('搜索意图: 检查标题和首段是否覆盖目标搜索词，考虑 A/B 测试不同关键词组合');
    nextAdvice.push('收藏价值: 增加清单体/对比表格/步骤总结，提升收藏率');
    nextAdvice.push('信任信号: 补充使用时间线、前后对比、具体场景描述');
    nextAdvice.push('软种草: 以第一人称体验叙事替代卖点罗列，先抛结论再展开');
  } else {
    nextAdvice.push('3s 钩子: 测试冲突句/反差句/反常识句开头的不同变体，看前3秒完播率');
    nextAdvice.push('完播动机: 设置悬念结构（痛点→放大→方案→验证），每3-5秒一个信息点');
    nextAdvice.push('互动设计: 设计2个以上引发评论的争议点/投票点');
    nextAdvice.push('IP 记忆: 加入标志性口头禅/动作/视觉符号，强化账号辨识度');
  }
  const remainingLayers = new Set(resultB.badcases.map(bc => bc.layer));
  if (remainingLayers.has('platform')) nextAdvice.push('仍有平台层问题 — 深入分析目标平台内容生态的最新变化');
  if (remainingLayers.has('audience')) nextAdvice.push('仍有受众层问题 — 考虑做受众调研或分析高互动竞品内容的心理钩子');
  if (remainingLayers.has('creator')) nextAdvice.push('仍有创作者层问题 — 重新审视品牌目标与平台内容的匹配策略');

  return { resultA, resultB, winner, scores, badcaseA, badcaseB, resolvedTypes, remainingIssues, recommendationReasons, nextAdvice, fallbackA, fallbackB };
}

// ── Page Component ───────────────────────────────────────────────────
export default function ABTestPage() {
  const [platform, setPlatform] = useState<string>('小红书');
  const [contentGoal, setContentGoal] = useState<string>('种草');
  const [productTopic, setProductTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [promptV1, setPromptV1] = useState('');
  const [contentA, setContentA] = useState('');
  const [promptV2, setPromptV2] = useState('');
  const [contentB, setContentB] = useState('');
  const [abResult, setAbResult] = useState<ABTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (abResult && !loading && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
      const allTypes = [...abResult.resultA.badcases.map((bc: BadcaseItem) => bc.badcaseLabel || bc.type), ...abResult.resultB.badcases.map((bc: BadcaseItem) => bc.badcaseLabel || bc.type)];
      addHistoryItem({
        id: generateId(), createdAt: new Date().toISOString(), source: 'ab-test', platform: apiPlatform,
        contentGoal, productTopic, targetAudience,
        overallEffectiveness: abResult.resultB.triFlowScores.overallEffectiveness,
        platformFit: abResult.resultB.triFlowScores.platformFit,
        audienceFit: abResult.resultB.triFlowScores.audienceFit,
        creatorGoalFit: abResult.resultB.triFlowScores.creatorGoalFit,
        badcaseCount: abResult.badcaseB, badcaseTypes: [...new Set(allTypes)],
        recommendedVersion: abResult.winner,
        improvementDelta: abResult.resultB.triFlowScores.overallEffectiveness - abResult.resultA.triFlowScores.overallEffectiveness,
        confidenceLevel: abResult.resultB.confidence?.level,
        riskLevel: abResult.resultB.riskAssessment?.riskLevel,
        reviewRequired: abResult.resultB.riskAssessment?.reviewRequired,
        judgeAgreementLevel: abResult.resultB.multiJudge?.agreement?.level,
        judgeReviewRequired: abResult.resultB.multiJudge?.agreement?.reviewRequired,
      });
    }
  }, [abResult, loading, platform, contentGoal, productTopic, targetAudience]);

  const handleRun = async () => {
    hasSavedRef.current = false;
    setLoading(true); setAbResult(null);
    const [sideA, sideB] = await Promise.all([
      evaluateOne(platform, contentGoal, productTopic, targetAudience, promptV1, contentA),
      evaluateOne(platform, contentGoal, productTopic, targetAudience, promptV2, contentB),
    ]);
    setAbResult(buildComparison(sideA.result, sideB.result, platform, sideA.fallback, sideB.fallback));
    setLoading(false);
  };

  const isFallback = abResult?.fallbackA || abResult?.fallbackB;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Prompt A/B 测试</h1>
          <p className="mt-1 text-sm text-slate-500">对比 Prompt v1 与 Prompt v2 的生成结果，验证优化是否真正提升平台适配、受众适配和创作者目标达成</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {platform === '小红书' ? '小红书 Rubric' : '抖音 Rubric'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Input Form ────────────────────────────────── */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-800 mb-5">测试配置</h2>
          {/* Platform */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">目标平台</label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" onClick={() => { setPlatform(p); setAbResult(null); }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${platform === p ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {/* Content Goal */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">内容目标</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button key={g} type="button" onClick={() => setContentGoal(g)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${contentGoal === g ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          {/* Product Topic + Audience */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">产品 / 主题</label>
            <input type="text" value={productTopic} onChange={(e) => setProductTopic(e.target.value)} placeholder="例如：敏感肌护肤品、家用投影仪"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">目标受众</label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="例如：25-35岁职场女性、Z世代学生"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>

          {/* Side A */}
          <div className="mb-3 flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">A</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prompt v1（原始）</span>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prompt v1</label>
            <textarea value={promptV1} onChange={(e) => setPromptV1(e.target.value)} placeholder="粘贴原始 Prompt (v1)..." rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prompt v1 生成内容</label>
            <textarea value={contentA} onChange={(e) => setContentA(e.target.value)} placeholder="粘贴 Prompt v1 生成的内容..." rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
          </div>

          {/* Side B */}
          <div className="mb-3 flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-700">B</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prompt v2（优化）</span>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prompt v2</label>
            <textarea value={promptV2} onChange={(e) => setPromptV2(e.target.value)} placeholder="粘贴优化后 Prompt (v2)..." rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Prompt v2 生成内容</label>
            <textarea value={contentB} onChange={(e) => setContentB(e.target.value)} placeholder="粘贴 Prompt v2 生成的内容..." rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
          </div>

          <button type="button" onClick={handleRun} disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                A/B 评测中...
              </span>
            ) : ('开始 A/B 评测')}
          </button>
        </div>

        {/* ── Right: Results ──────────────────────────────────── */}
        <div>
          {!abResult && !loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="mt-3 text-sm text-slate-400">填写两组 Prompt 和内容后，点击「开始 A/B 评测」</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="mt-3 text-sm text-slate-500">正在并行评测两组 Prompt...</p>
              </div>
            </div>
          )}

          {abResult && (
            <div className="space-y-4">
              {isFallback && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>使用备用评测结果</span>
                </div>
              )}

              {/* Winner Card */}
              <section className={`rounded-2xl border p-5 shadow-sm ${abResult.winner === 'Prompt v2' ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-amber-100 text-amber-700', '★')} 推荐版本
                </h3>
                <div className={`rounded-xl border p-4 ${abResult.winner === 'Prompt v2' ? 'border-emerald-100 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${abResult.winner === 'Prompt v2' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      推荐: {abResult.winner}
                    </span>
                    {abResult.winner === 'Prompt v2' && (
                      <span className="text-xs text-emerald-600 font-medium">↑ +{abResult.scores.overallEffectiveness.delta} 综合分</span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {abResult.recommendationReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-400" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <SaveSopButton
                    label="保存优胜 Prompt 为 SOP"
                    template={{
                      source: 'ab-test',
                      name: `${platform}｜A/B 优胜｜${contentGoal} SOP`,
                      platform: platform === '小红书' ? 'xiaohongshu' : 'douyin',
                      contentGoal,
                      targetAudience,
                      productTopic: productTopic || undefined,
                      structure: platform === '小红书' ? XHS_DEFAULT_STRUCTURE : DY_DEFAULT_STRUCTURE,
                      promptTemplate: abResult.winner === 'Prompt v2' ? promptV2 : promptV1,
                      commonBadcases: abResult.remainingIssues.length > 0
                        ? abResult.remainingIssues
                        : abResult.resultB.badcases.map((bc) => bc.badcaseLabel || bc.type),
                      rubricFocus: platform === '小红书' ? XHS_DEFAULT_RUBRIC : DY_DEFAULT_RUBRIC,
                    }}
                  />
                </div>
                {/* Save prompts to registry */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <SavePromptButton
                    label="保存 Prompt v1"
                    item={{
                      source: 'ab-test',
                      name: `${platform}｜${contentGoal}｜A/B Prompt v1`,
                      platform: platform === '小红书' ? 'xiaohongshu' : 'douyin',
                      contentGoal,
                      productTopic: productTopic || undefined,
                      targetAudience,
                      versionLabel: 'v1',
                      promptText: promptV1,
                      scoreSnapshot: {
                        platformFit: abResult.resultA.triFlowScores.platformFit,
                        audienceFit: abResult.resultA.triFlowScores.audienceFit,
                        creatorGoalFit: abResult.resultA.triFlowScores.creatorGoalFit,
                        overallEffectiveness: abResult.resultA.triFlowScores.overallEffectiveness,
                      },
                      abTestResult: {
                        winner: abResult.winner === 'Prompt v1',
                      },
                    }}
                  />
                  <SavePromptButton
                    label={`保存 Prompt v2${abResult.winner === 'Prompt v2' ? '（优胜）' : ''}`}
                    item={{
                      source: 'ab-test',
                      name: `${platform}｜${contentGoal}｜A/B ${abResult.winner === 'Prompt v2' ? '优胜' : 'v2'} Prompt`,
                      platform: platform === '小红书' ? 'xiaohongshu' : 'douyin',
                      contentGoal,
                      productTopic: productTopic || undefined,
                      targetAudience,
                      versionLabel: abResult.winner === 'Prompt v2' ? 'winner' : 'v2',
                      promptText: promptV2,
                      parentPromptText: promptV1 || undefined,
                      linkedBadcases: abResult.resultB.badcases.map((bc) => bc.badcaseLabel || bc.type),
                      scoreSnapshot: {
                        platformFit: abResult.resultB.triFlowScores.platformFit,
                        audienceFit: abResult.resultB.triFlowScores.audienceFit,
                        creatorGoalFit: abResult.resultB.triFlowScores.creatorGoalFit,
                        overallEffectiveness: abResult.resultB.triFlowScores.overallEffectiveness,
                      },
                      abTestResult: {
                        comparedWith: 'Prompt v1',
                        winner: abResult.winner === 'Prompt v2',
                        improvementDelta: abResult.resultB.triFlowScores.overallEffectiveness - abResult.resultA.triFlowScores.overallEffectiveness,
                      },
                    }}
                  />
                </div>
                {/* Winner confidence / risk / agreement */}
                {(abResult.resultB.confidence || abResult.resultB.riskAssessment || abResult.resultB.multiJudge) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {abResult.resultB.confidence && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        abResult.resultB.confidence.level === 'high' ? 'bg-emerald-100 text-emerald-700'
                          : abResult.resultB.confidence.level === 'medium' ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-600'
                      }`}>
                        置信: {abResult.resultB.confidence.level === 'high' ? '高' : abResult.resultB.confidence.level === 'medium' ? '中' : '低'}
                      </span>
                    )}
                    {abResult.resultB.riskAssessment && (
                      <>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          abResult.resultB.riskAssessment.riskLevel === 'high' ? 'bg-red-100 text-red-600'
                            : abResult.resultB.riskAssessment.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          风险: {abResult.resultB.riskAssessment.riskLevel === 'high' ? '高' : abResult.resultB.riskAssessment.riskLevel === 'medium' ? '中' : '低'}
                        </span>
                        {abResult.resultB.riskAssessment.reviewRequired && (
                          <span className="text-[10px] text-red-500 font-medium">建议人工复核</span>
                        )}
                      </>
                    )}
                    {abResult.resultB.multiJudge && (
                      <>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          abResult.resultB.multiJudge.agreement.level === 'high' ? 'bg-emerald-100 text-emerald-700'
                            : abResult.resultB.multiJudge.agreement.level === 'medium' ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-600'
                        }`}>
                          评审: {abResult.resultB.multiJudge.agreement.level === 'high' ? '高一致' : abResult.resultB.multiJudge.agreement.level === 'medium' ? '中等一致' : '低一致'}
                        </span>
                        {(abResult.resultB.multiJudge.agreement.level === 'low' || abResult.resultB.multiJudge.agreement.reviewRequired) && (
                          <span className="text-[10px] text-red-500 font-medium">推荐版本存在评审分歧，建议人工复核后再发布</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>

              {/* Score Comparison */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-indigo-100 text-indigo-700', 'S')} 评分对比
                </h3>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    <span>指标</span><span className="w-12 text-center">A</span><span className="w-12 text-center">B</span><span className="w-12 text-center">Δ</span>
                  </div>
                  {SCORE_KEYS.map((key) => {
                    const s = abResult.scores[key];
                    const isOverall = key === 'overallEffectiveness';
                    return (
                      <div key={key} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-xl border px-3 py-2.5 ${isOverall ? 'border-indigo-100 bg-indigo-50/60' : 'border-slate-100 bg-slate-50/60'}`}>
                        <span className={`text-xs ${isOverall ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{SCORE_LABELS[key]}</span>
                        <span className={`w-12 text-center text-xs font-mono font-medium ${scoreColor(s.a)}`}>{s.a}</span>
                        <span className={`w-12 text-center text-xs font-mono font-medium ${scoreColor(s.b)}`}>{s.b}</span>
                        <span className={`w-12 text-center text-xs font-mono font-semibold ${deltaColor(s.delta)}`}>{deltaPrefix(s.delta)}{s.delta}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Badcase Comparison */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-red-100 text-red-700', 'B')} 问题对比
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="block text-[10px] font-medium text-slate-400 uppercase">Prompt v1</span>
                    <span className="mt-1 block text-xl font-bold text-slate-700">{abResult.badcaseA}</span>
                    <span className="text-[10px] text-slate-400">个问题</span>
                  </div>
                  <div className={`rounded-xl border p-3 text-center ${abResult.badcaseB <= abResult.badcaseA ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <span className="block text-[10px] font-medium text-slate-400 uppercase">Prompt v2</span>
                    <span className={`mt-1 block text-xl font-bold ${abResult.badcaseB <= abResult.badcaseA ? 'text-emerald-700' : 'text-red-600'}`}>{abResult.badcaseB}</span>
                    <span className="text-[10px] text-slate-400">个问题</span>
                  </div>
                </div>
                {abResult.resolvedTypes.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-emerald-600">已解决:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {abResult.resolvedTypes.map((t, i) => (
                        <span key={i} className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {abResult.remainingIssues.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-amber-600">v2 仍存在:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {abResult.remainingIssues.map((t, i) => (
                        <span key={i} className="inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Next Iteration Advice */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-emerald-100 text-emerald-700', 'N')} 下一轮优化建议
                </h3>
                <ul className="space-y-2">
                  {abResult.nextAdvice.map((advice, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />{advice}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Human Calibration */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-700">H</span>
                  人工校准 Human Calibration
                </h3>
                <CalibrationPanel
                  source="ab-test"
                  platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'}
                  productTopic={productTopic || undefined}
                  targetAudience={targetAudience || undefined}
                  buttons={[
                    'accurate',
                    'score_too_high',
                    'score_too_low',
                    'badcase_wrong',
                    'prompt_useful',
                    'prompt_not_useful',
                  ]}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
