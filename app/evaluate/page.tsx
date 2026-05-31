'use client';

import { useState, useEffect, useRef } from 'react';
import { getMockResult, type EvaluationResult } from '../data/mockResults';
import { addHistoryItem, generateId } from '../utils/history';
import CalibrationPanel from '../components/CalibrationPanel';
import SaveSopButton from '../components/SaveSopButton';
import AddToDatasetButton from '../components/AddToDatasetButton';
import {
  XHS_DEFAULT_STRUCTURE,
  DY_DEFAULT_STRUCTURE,
  XHS_DEFAULT_RUBRIC,
  DY_DEFAULT_RUBRIC,
} from '../types/sop';

const PLATFORMS = ['小红书', '抖音'] as const;
const GOALS = ['种草', '转化', '涨粉', '搜索沉淀'] as const;

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionLabel =
  'text-xs font-medium text-slate-400 uppercase tracking-wider';

// ── Helpers ─────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}
function scoreBg(score: number) {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}
function layerBadge(layer: string) {
  switch (layer) {
    case 'platform':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'audience':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'creator':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
function sectionIcon(cls: string, letter: string) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${cls}`}
    >
      {letter}
    </span>
  );
}

export default function EvaluatePage() {
  const [platform, setPlatform] = useState<string>('小红书');
  const [contentGoal, setContentGoal] = useState<string>('种草');
  const [productTopic, setProductTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [pgcReference, setPgcReference] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (result && !loading && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const apiPlatform =
        platform === '小红书' ? 'xiaohongshu' : 'douyin';
      addHistoryItem({
        id: generateId(),
        createdAt: new Date().toISOString(),
        source: 'evaluate',
        platform: apiPlatform,
        contentGoal,
        productTopic,
        targetAudience,
        overallEffectiveness: result.triFlowScores.overallEffectiveness,
        platformFit: result.triFlowScores.platformFit,
        audienceFit: result.triFlowScores.audienceFit,
        creatorGoalFit: result.triFlowScores.creatorGoalFit,
        badcaseCount: result.badcases.length,
        badcaseTypes: result.badcases.map((bc) => bc.badcaseLabel || bc.type),
        confidenceLevel: result.confidence?.level,
        riskLevel: result.riskAssessment?.riskLevel,
        reviewRequired: result.riskAssessment?.reviewRequired,
      });
    }
  }, [result, loading, platform, contentGoal, productTopic, targetAudience]);

  const handleRun = async () => {
    hasSavedRef.current = false;
    setLoading(true);
    setIsFallback(false);

    const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: apiPlatform,
          contentGoal,
          productTopic,
          targetAudience,
          originalPrompt,
          aiContent,
          pgcReference: pgcReference || undefined,
        }),
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const { _fallback, ...evaluationData } = data;
      setResult(evaluationData as EvaluationResult);
      setIsFallback(!!_fallback);
    } catch (err) {
      console.error('[ContentFlow AI] API call failed, using local mock fallback:', err);
      setResult(getMockResult(platform));
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            内容评测工作台
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            TriFlow 平台-受众-创作者三方内容有效性评测
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {platform === '小红书' ? '搜索驱动 种草平台' : '推荐流 短视频平台'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Input Form ────────────────────────────────── */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-800 mb-5">
            配置面板
          </h2>

          {/* Platform */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">
              目标平台
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPlatform(p); setResult(null); }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    platform === p
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Content Goal */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">
              内容目标
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setContentGoal(g)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    contentGoal === g
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Product Topic */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              产品 / 主题
            </label>
            <input
              type="text"
              value={productTopic}
              onChange={(e) => setProductTopic(e.target.value)}
              placeholder="例如：敏感肌护肤品、家用投影仪"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          {/* Target Audience */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              目标受众
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="例如：25-35岁职场女性、Z世代学生"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          {/* Original Prompt */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              原始 Prompt
            </label>
            <textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="粘贴原始 AI Prompt..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* AI Content */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              AI 生成内容
            </label>
            <textarea
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              placeholder="粘贴 AI 生成的内容..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* PGC Reference */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              PGC 标杆内容（可选）
            </label>
            <textarea
              value={pgcReference}
              onChange={(e) => setPgcReference(e.target.value)}
              placeholder="可选：粘贴一篇高互动 PGC 内容作为参考..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                评测中...
              </span>
            ) : (
              '开始评测'
            )}
          </button>
        </div>

        {/* ── Right: Results ──────────────────────────────────── */}
        <div>
          {/* Empty state */}
          {!result && !loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-3 text-sm text-slate-400">
                  填写表单后点击「开始评测」查看结果
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-3 text-sm text-slate-500">正在进行 TriFlow 三方评测...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Fallback */}
              {isFallback && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>使用备用评测结果（未连接 API）</span>
                </div>
              )}

              {/* A. Audience Persona */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-blue-100 text-blue-700', 'A')}
                  受众画像 Audience Persona
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className={sectionLabel}>用户意图 User Intent</span>
                    <p className="mt-0.5 text-slate-700">{result.audiencePersona.userIntent}</p>
                  </div>
                  <div>
                    <span className={sectionLabel}>心理需求 Psychological Needs</span>
                    <ul className="mt-1 space-y-1">
                      {result.audiencePersona.psychologicalNeeds.map((n, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 text-xs">
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-blue-400" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={sectionLabel}>信任障碍 Trust Barriers</span>
                    <ul className="mt-1 space-y-1">
                      {result.audiencePersona.trustBarriers.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 text-xs">
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={sectionLabel}>内容偏好 Content Preference</span>
                    <p className="mt-0.5 text-slate-700 text-xs">{result.audiencePersona.contentPreference}</p>
                  </div>
                </div>
              </section>

              {/* B. TriFlow Scores */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-indigo-100 text-indigo-700', 'B')}
                  TriFlow 三方评分
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '平台适配 Platform Fit', key: 'platformFit' as const },
                    { label: '受众适配 Audience Fit', key: 'audienceFit' as const },
                    { label: '创作者目标 Creator Goal', key: 'creatorGoalFit' as const },
                    { label: '综合有效性 Overall', key: 'overallEffectiveness' as const },
                  ].map(({ label, key }) => {
                    const s = result.triFlowScores[key];
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-3.5 ${scoreBg(s)}`}
                      >
                        <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          {label}
                        </span>
                        <span className={`mt-1 block text-2xl font-bold tracking-tight ${scoreColor(s)}`}>
                          {s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* C. Badcase Diagnosis */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-red-100 text-red-700', 'C')}
                  问题归因 Badcase Diagnosis
                </h3>
                <div className="space-y-2.5">
                  {result.badcases.map((bc, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${layerBadge(bc.layer)}`}
                        >
                          {bc.layer === 'platform' ? '平台层' : bc.layer === 'audience' ? '受众层' : '创作者层'}
                        </span>
                        <span className="text-xs font-medium text-slate-700">{bc.badcaseLabel || bc.type}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">
                        <span className="font-medium text-slate-400">原文证据: </span>
                        {bc.evidence}
                      </p>
                      <p className="text-xs text-emerald-600">
                        <span className="font-medium text-emerald-500">修复建议: </span>
                        {bc.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* D. Prompt v2 */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-emerald-100 text-emerald-700', 'D')}
                  优化后 Prompt v2
                </h3>
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 font-mono">
                  {result.promptV2.optimizedPrompt}
                </pre>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <span className={sectionLabel}>变更原因 Change Reasons</span>
                    <ul className="mt-2 space-y-1.5">
                      {result.promptV2.changeReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className={sectionLabel}>预期改进 Expected Improvements</span>
                    <ul className="mt-2 space-y-1.5">
                      {result.promptV2.expectedImprovements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <SaveSopButton
                    template={{
                      source: 'evaluate',
                      name: `${platform}｜${contentGoal}｜${targetAudience || '通用受众'} SOP`,
                      platform: platform === '小红书' ? 'xiaohongshu' : 'douyin',
                      contentGoal,
                      targetAudience,
                      productTopic: productTopic || undefined,
                      structure: platform === '小红书' ? XHS_DEFAULT_STRUCTURE : DY_DEFAULT_STRUCTURE,
                      promptTemplate: result.promptV2.optimizedPrompt,
                      commonBadcases: result.badcases.map((bc) => bc.badcaseLabel || bc.type),
                      rubricFocus: platform === '小红书' ? XHS_DEFAULT_RUBRIC : DY_DEFAULT_RUBRIC,
                    }}
                  />
                  <AddToDatasetButton
                    source="evaluate"
                    platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'}
                    contentGoal={contentGoal}
                    productTopic={productTopic || undefined}
                    targetAudience={targetAudience || undefined}
                    content={aiContent}
                    prompt={originalPrompt || undefined}
                    aiScores={{
                      platformFit: result.triFlowScores.platformFit,
                      audienceFit: result.triFlowScores.audienceFit,
                      creatorGoalFit: result.triFlowScores.creatorGoalFit,
                      overallEffectiveness: result.triFlowScores.overallEffectiveness,
                    }}
                    aiBadcaseLabels={result.badcases.map((bc) => bc.badcaseLabel || bc.type)}
                    confidenceLevel={result.confidence?.level}
                    confidenceScore={result.confidence?.score}
                    riskLevel={result.riskAssessment?.riskLevel}
                    reviewRequired={result.riskAssessment?.reviewRequired}
                    riskTypes={result.riskAssessment?.riskTypes}
                  />
                </div>
              </section>

              {/* E. Confidence */}
              {result.confidence && (
                <section className={cardClass}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      result.confidence.level === 'high' ? 'bg-emerald-100 text-emerald-700'
                        : result.confidence.level === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}>C</span>
                    评测置信度 Confidence
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      result.confidence.level === 'high' ? 'bg-emerald-100 text-emerald-700'
                        : result.confidence.level === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                    }`}>
                      {result.confidence.level === 'high' ? '高置信' : result.confidence.level === 'medium' ? '中置信' : '低置信'}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{result.confidence.score}/100</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.confidence.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />{r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* F. Risk Assessment */}
              {result.riskAssessment && (
                <section className={cardClass}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      result.riskAssessment.riskLevel === 'high' ? 'bg-red-100 text-red-700'
                        : result.riskAssessment.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>R</span>
                    风险分层 Risk Assessment
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      result.riskAssessment.riskLevel === 'high' ? 'bg-red-100 text-red-600'
                        : result.riskAssessment.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {result.riskAssessment.riskLevel === 'high' ? '高风险' : result.riskAssessment.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </span>
                    {result.riskAssessment.reviewRequired && (
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-600">
                        建议人工复核
                      </span>
                    )}
                    {result.riskAssessment.riskTypes.map((rt) => (
                      <span key={rt} className="inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {rt}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {result.riskAssessment.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />{r}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    风险分层仅用于内容优化与人工复核参考，不代表法律意见、平台审核结果或真实转化预测。
                  </p>
                </section>
              )}

              {/* Human Calibration */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-700">H</span>
                  人工校准 Human Calibration
                </h3>
                <CalibrationPanel
                  source="evaluate"
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
