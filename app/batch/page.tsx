'use client';

import { useState } from 'react';
import { type EvaluationResult, getMockResult } from '../data/mockResults';
import { addHistoryItem, generateId } from '../utils/history';
import AddToDatasetButton from '../components/AddToDatasetButton';

const PLATFORMS = ['小红书', '抖音'] as const;
const GOALS = ['种草', '转化', '涨粉', '搜索沉淀'] as const;
const MAX_BATCH_ITEMS = 8;

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

// ── Types ───────────────────────────────────────────────────────────
interface BatchItem {
  id: string;
  index: number;
  contentPreview: string;
  fullContent: string;
  result: EvaluationResult | null;
  error?: string;
  fallback?: boolean;
}

interface BatchSummary {
  totalCount: number;
  successCount: number;
  averageOverall: number;
  averagePlatformFit: number;
  averageAudienceFit: number;
  averageCreatorGoalFit: number;
  topBadcases: { label: string; count: number }[];
  bestItemIndex: number;
  worstItemIndex: number;
  highRiskCount: number;
  reviewRequiredCount: number;
  lowConfidenceCount: number;
  lowAgreementCount: number;
  judgeReviewRequiredCount: number;
  nextPromptAdvice: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

function parseContents(raw: string): string[] {
  // Split by --- first, then by double newline
  const delimiter = raw.includes('---') ? '---' : '\n\n';
  return raw
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_BATCH_ITEMS);
}

async function evaluateSingle(
  platform: string,
  contentGoal: string,
  productTopic: string,
  targetAudience: string,
  originalPrompt: string,
  aiContent: string
): Promise<{ result: EvaluationResult; fallback: boolean }> {
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
      }),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const { _fallback, ...evaluationData } = data;
    return { result: evaluationData as EvaluationResult, fallback: !!_fallback };
  } catch (err) {
    console.error('[ContentFlow AI] Batch evaluation failed for item:', err);
    // Fallback to mock
    return { result: getMockResult(platform), fallback: true };
  }
}

function computeSummary(items: BatchItem[], platform: string): BatchSummary {
  const successful = items.filter((i) => i.result !== null);
  const results = successful.map((i) => i.result!);
  const totalCount = items.length;
  const successCount = successful.length;

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const averageOverall = avg(results.map((r) => r.triFlowScores.overallEffectiveness));
  const averagePlatformFit = avg(results.map((r) => r.triFlowScores.platformFit));
  const averageAudienceFit = avg(results.map((r) => r.triFlowScores.audienceFit));
  const averageCreatorGoalFit = avg(results.map((r) => r.triFlowScores.creatorGoalFit));

  // Top badcases across all items
  const badcaseMap = new Map<string, number>();
  for (const r of results) {
    for (const bc of r.badcases) {
      const label = bc.badcaseLabel || bc.type;
      badcaseMap.set(label, (badcaseMap.get(label) || 0) + 1);
    }
  }
  const topBadcases = Array.from(badcaseMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Best / worst
  let bestIdx = -1;
  let worstIdx = -1;
  let bestScore = -1;
  let worstScore = 101;
  for (const item of successful) {
    const s = item.result!.triFlowScores.overallEffectiveness;
    if (s > bestScore) {
      bestScore = s;
      bestIdx = item.index;
    }
    if (s < worstScore) {
      worstScore = s;
      worstIdx = item.index;
    }
  }

  // Next prompt advice
  const nextPromptAdvice: string[] = [];
  const allLabels = topBadcases.map((b) => b.label);
  const labelStr = allLabels.join('、');

  if (platform === '小红书') {
    if (allLabels.some((l) => l.includes('搜索') || l.includes('关键词'))) {
      nextPromptAdvice.push('搜索意图/关键词不足：建议在 Prompt 中明确要求搜索关键词匹配、避坑问题和决策场景覆盖');
    }
    if (allLabels.some((l) => l.includes('体验') || l.includes('真实') || l.includes('证据'))) {
      nextPromptAdvice.push('真实体验不足：建议在 Prompt 中加入使用场景、时间线、限制条件和适合/不适合人群描述');
    }
    if (allLabels.some((l) => l.includes('硬广') || l.includes('推销') || l.includes('品牌'))) {
      nextPromptAdvice.push('硬广感过强：建议 Prompt 改为第一人称经验分享，以"我用了 X 天发现…"代替产品卖点堆砌');
    }
    if (allLabels.some((l) => l.includes('收藏') || l.includes('清单'))) {
      nextPromptAdvice.push('收藏价值低：建议 Prompt 中要求输出对比表格、划重点清单或步骤总结');
    }
  } else {
    if (allLabels.some((l) => l.includes('Hook') || l.includes('钩子') || l.includes('开头'))) {
      nextPromptAdvice.push('Hook 弱：建议在 Prompt 中强制要求前三秒冲突/反差/痛点开场，提供 3 个备选方向');
    }
    if (allLabels.some((l) => l.includes('完播') || l.includes('节奏') || l.includes('悬念'))) {
      nextPromptAdvice.push('完播动机不足：建议 Prompt 中规定悬念递进结构和分段节奏，每 3-5 秒一个信息点');
    }
    if (allLabels.some((l) => l.includes('互动') || l.includes('评论') || l.includes('触发'))) {
      nextPromptAdvice.push('互动设计弱：建议 Prompt 中明确要求设计 2 个以上评论触发问题或观点冲突点');
    }
    if (allLabels.some((l) => l.includes('镜头') || l.includes('画面') || l.includes('视觉'))) {
      nextPromptAdvice.push('镜头感不足：建议 Prompt 中补充口播节奏和镜头分段描述');
    }
  }

  if (nextPromptAdvice.length === 0) {
    nextPromptAdvice.push(`当前高频问题集中在：${labelStr || '暂无显著模式'}。建议针对上述标签逐项优化 Prompt 约束。`);
  }

  const highRiskCount = results.filter(
    (r) => r.riskAssessment?.riskLevel === 'high'
  ).length;
  const reviewRequiredCount = results.filter(
    (r) => r.riskAssessment?.reviewRequired
  ).length;
  const lowConfidenceCount = results.filter(
    (r) => r.confidence?.level === 'low'
  ).length;
  const lowAgreementCount = results.filter(
    (r) => r.multiJudge?.agreement?.level === 'low'
  ).length;
  const judgeReviewRequiredCount = results.filter(
    (r) => r.multiJudge?.agreement?.reviewRequired
  ).length;

  return {
    totalCount,
    successCount,
    averageOverall,
    averagePlatformFit,
    averageAudienceFit,
    averageCreatorGoalFit,
    topBadcases,
    bestItemIndex: bestIdx,
    worstItemIndex: worstIdx,
    highRiskCount,
    reviewRequiredCount,
    lowConfidenceCount,
    lowAgreementCount,
    judgeReviewRequiredCount,
    nextPromptAdvice,
  };
}

// ── Page Component ───────────────────────────────────────────────────
export default function BatchPage() {
  const [platform, setPlatform] = useState<string>('小红书');
  const [contentGoal, setContentGoal] = useState<string>('种草');
  const [productTopic, setProductTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [batchContents, setBatchContents] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setSummary(null);
    setExpandedIndex(null);

    const contents = parseContents(batchContents);
    if (contents.length === 0) {
      setLoading(false);
      return;
    }

    const items: BatchItem[] = contents.map((content, i) => ({
      id: `batch-${Date.now()}-${i}`,
      index: i + 1,
      contentPreview: content.slice(0, 120) + (content.length > 120 ? '…' : ''),
      fullContent: content,
      result: null,
    }));
    setBatchItems(items);
    setProgress({ current: 0, total: contents.length });

    // Sequential evaluation with progress
    const results: BatchItem[] = [];
    for (let i = 0; i < contents.length; i++) {
      setProgress({ current: i + 1, total: contents.length });
      const { result, fallback } = await evaluateSingle(
        platform,
        contentGoal,
        productTopic,
        targetAudience,
        originalPrompt,
        contents[i]
      );
      const batchItem: BatchItem = {
        ...items[i],
        result,
        fallback,
      };
      results.push(batchItem);
      setBatchItems([...results]);
    }

    // Compute summary
    const batchSummary = computeSummary(results, platform);
    setSummary(batchSummary);

    // Save to dashboard history
    const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
    const allBadcaseLabels = batchSummary.topBadcases.map((b) => b.label);
    const totalBadcaseCount = batchSummary.topBadcases.reduce((sum, b) => sum + b.count, 0);

    addHistoryItem({
      id: generateId(),
      createdAt: new Date().toISOString(),
      source: 'batch',
      platform: apiPlatform,
      contentGoal,
      productTopic,
      targetAudience,
      overallEffectiveness: batchSummary.averageOverall,
      platformFit: batchSummary.averagePlatformFit,
      audienceFit: batchSummary.averageAudienceFit,
      creatorGoalFit: batchSummary.averageCreatorGoalFit,
      badcaseCount: totalBadcaseCount,
      badcaseTypes: allBadcaseLabels,
      confidenceLevel: results.filter((r) => r.result?.confidence?.level === 'low').length > results.length * 0.5
        ? 'low' : results.filter((r) => r.result?.confidence?.level === 'high').length > results.length * 0.5
          ? 'high' : 'medium',
      riskLevel: results.some((r) => r.result?.riskAssessment?.riskLevel === 'high')
        ? 'high' : results.some((r) => r.result?.riskAssessment?.riskLevel === 'medium')
          ? 'medium' : 'low',
      reviewRequired: results.some((r) => r.result?.riskAssessment?.reviewRequired),
      judgeAgreementLevel: results.filter((r) => r.result?.multiJudge?.agreement?.level === 'low').length > results.length * 0.5
        ? 'low'
        : results.filter((r) => r.result?.multiJudge?.agreement?.level === 'high').length > results.length * 0.5
          ? 'high'
          : 'medium',
      judgeReviewRequired: results.some((r) => r.result?.multiJudge?.agreement?.reviewRequired),
    });

    setLoading(false);
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            批量评测 Batch Evaluation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            一次性评估多条 AI 生成内容，聚合平均分、高频问题和下一轮 Prompt 优化方向
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          最多 {MAX_BATCH_ITEMS} 条 / 次
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Input Form ────────────────────────────────── */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-800 mb-5">批量配置</h2>

          {/* Platform */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">目标平台</label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button key={p} type="button" onClick={() => setPlatform(p)}
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
            <input type="text" value={productTopic} onChange={(e) => setProductTopic(e.target.value)}
              placeholder="例如：敏感肌护肤品、家用投影仪"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">目标受众</label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="例如：25-35岁职场女性、Z世代学生"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>

          {/* Original Prompt */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">原始 Prompt（可选）</label>
            <textarea value={originalPrompt} onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="粘贴原始 AI Prompt（所有内容共用）..." rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
          </div>

          {/* Batch Contents */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              批量 AI 生成内容
            </label>
            <textarea
              value={batchContents}
              onChange={(e) => setBatchContents(e.target.value)}
              placeholder={`第一条 AI 内容……

---

第二条 AI 内容……

---

第三条 AI 内容……`}
              rows={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none font-mono"
            />
            <p className="mt-1.5 text-[10px] text-slate-400">
              用 <code className="bg-slate-100 px-1 rounded">---</code> 或连续空行分隔每条内容。当前最多支持 {MAX_BATCH_ITEMS} 条。AI 评测结果仅供内容优化参考，不代表真实平台推荐结果或转化效果。批量评测会消耗 API 额度。
            </p>
          </div>

          <button type="button" onClick={handleRun} disabled={loading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {progress.total > 0 ? `评测中 ${progress.current} / ${progress.total}` : '准备中…'}
              </span>
            ) : ('开始批量评测')}
          </button>
        </div>

        {/* ── Right: Results ──────────────────────────────────── */}
        <div>
          {/* Empty state */}
          {!summary && !loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-3 text-sm text-slate-400">
                  粘贴多条 AI 内容，用 <code className="bg-slate-100 px-1 rounded">---</code> 分隔后点击「开始批量评测」
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-3 text-sm text-slate-500">
                  正在评测 {progress.current} / {progress.total}
                </p>
                <div className="mt-2 h-1 w-48 mx-auto overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {summary && (
            <div className="space-y-4">
              {/* ── Warnings ────────────────────────────────── */}
              {summary.totalCount > summary.successCount && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  {summary.totalCount - summary.successCount} 条内容评测失败，已使用备用结果
                </div>
              )}

              {/* ── 1. Batch Summary ──────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-[10px] font-bold text-purple-700">B</span>
                  批量评测概览
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '内容数量', value: `${summary.successCount}/${summary.totalCount}`, color: 'text-slate-900' },
                    { label: '平均综合分', value: summary.averageOverall.toString(), color: scoreColor(summary.averageOverall) },
                    { label: '平均平台适配', value: summary.averagePlatformFit.toString(), color: scoreColor(summary.averagePlatformFit) },
                    { label: '平均受众适配', value: summary.averageAudienceFit.toString(), color: scoreColor(summary.averageAudienceFit) },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
                      <span className={`mt-1 block text-xl font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
                {(summary.highRiskCount > 0 || summary.reviewRequiredCount > 0 || summary.lowConfidenceCount > 0 || summary.lowAgreementCount > 0 || summary.judgeReviewRequiredCount > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
                    {summary.highRiskCount > 0 && (
                      <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                        <span className="block text-[10px] font-medium text-red-400 uppercase tracking-wider">高风险内容</span>
                        <span className="mt-1 block text-xl font-bold text-red-500">{summary.highRiskCount}</span>
                      </div>
                    )}
                    {summary.reviewRequiredCount > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <span className="block text-[10px] font-medium text-amber-400 uppercase tracking-wider">需人工复核</span>
                        <span className="mt-1 block text-xl font-bold text-amber-600">{summary.reviewRequiredCount}</span>
                      </div>
                    )}
                    {summary.lowConfidenceCount > 0 && (
                      <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                        <span className="block text-[10px] font-medium text-rose-400 uppercase tracking-wider">低置信度</span>
                        <span className="mt-1 block text-xl font-bold text-rose-500">{summary.lowConfidenceCount}</span>
                      </div>
                    )}
                    {summary.lowAgreementCount > 0 && (
                      <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                        <span className="block text-[10px] font-medium text-purple-400 uppercase tracking-wider">评审低一致</span>
                        <span className="mt-1 block text-xl font-bold text-purple-500">{summary.lowAgreementCount}</span>
                      </div>
                    )}
                    {summary.judgeReviewRequiredCount > 0 && (
                      <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                        <span className="block text-[10px] font-medium text-red-400 uppercase tracking-wider">评审建议复核</span>
                        <span className="mt-1 block text-xl font-bold text-red-500">{summary.judgeReviewRequiredCount}</span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ── 2. Best / Worst ────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-700">★</span>
                  最佳 / 最弱内容
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.bestItemIndex > 0 && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                      <span className="text-[10px] font-medium text-emerald-600 uppercase">最佳 # {summary.bestItemIndex}</span>
                      <p className="mt-1 text-xs text-slate-700 line-clamp-3">
                        {batchItems.find((bi) => bi.index === summary.bestItemIndex)?.contentPreview || '—'}
                      </p>
                    </div>
                  )}
                  {summary.worstItemIndex > 0 && (
                    <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                      <span className="text-[10px] font-medium text-red-500 uppercase">最弱 # {summary.worstItemIndex}</span>
                      <p className="mt-1 text-xs text-slate-700 line-clamp-3">
                        {batchItems.find((bi) => bi.index === summary.worstItemIndex)?.contentPreview || '—'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── 3. Top Badcases ────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-100 text-[10px] font-bold text-red-700">T</span>
                  高频问题
                </h3>
                {summary.topBadcases.length === 0 ? (
                  <p className="text-xs text-slate-400">暂无问题数据。</p>
                ) : (
                  <div className="space-y-2">
                    {summary.topBadcases.map((b, i) => (
                      <div key={b.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md bg-red-100 text-[10px] font-bold text-red-600">{i + 1}</span>
                          <span className="truncate text-xs text-slate-700">{b.label}</span>
                        </div>
                        <span className="flex-shrink-0 text-xs font-medium text-slate-400">{b.count}次</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── 4. Next Prompt Advice ───────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">P</span>
                  下一轮 Prompt 优化建议
                </h3>
                <ul className="space-y-2">
                  {summary.nextPromptAdvice.map((advice, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />{advice}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 5. Individual Results ───────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700">I</span>
                  单条结果 ({summary.successCount} 条)
                </h3>
                <div className="space-y-2.5">
                  {batchItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden">
                      {/* Compact row */}
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(expandedIndex === item.index ? null : item.index)}
                        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">#{item.index}</span>
                            {item.fallback && (
                              <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[10px] text-amber-600">备用</span>
                            )}
                            {item.result?.riskAssessment?.riskLevel === 'high' && (
                              <span className="inline-flex rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[10px] text-red-600">高风险</span>
                            )}
                            {item.result?.riskAssessment?.riskLevel === 'medium' && (
                              <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[10px] text-amber-600">中风险</span>
                            )}
                            {item.result?.riskAssessment?.reviewRequired && (
                              <span className="inline-flex rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[10px] text-red-500">需复核</span>
                            )}
                            {item.result?.multiJudge?.agreement?.level && (
                              <span className={`inline-flex rounded border px-1 py-0.5 text-[10px] font-medium ${
                                item.result.multiJudge.agreement.level === 'high' ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                  : item.result.multiJudge.agreement.level === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-600'
                                    : 'border-red-200 bg-red-50 text-red-500'
                              }`}>
                                评审: {item.result.multiJudge.agreement.level === 'high' ? '一致' : item.result.multiJudge.agreement.level === 'medium' ? '中等' : '分歧'}
                              </span>
                            )}
                            {item.result?.multiJudge?.agreement?.reviewRequired && (
                              <span className="inline-flex rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[10px] text-red-500">评审需复核</span>
                            )}
                            {item.result && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {[
                                  { label: 'P', score: item.result.triFlowScores.platformFit },
                                  { label: 'A', score: item.result.triFlowScores.audienceFit },
                                  { label: 'C', score: item.result.triFlowScores.creatorGoalFit },
                                ].map(({ label, score }) => (
                                  <span key={label} className={`font-mono font-medium ${scoreColor(score)}`}>
                                    {label}:{score}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600 truncate">{item.contentPreview}</p>
                        </div>
                        <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                          {item.result && (
                            <span className={`text-sm font-bold ${scoreColor(item.result.triFlowScores.overallEffectiveness)}`}>
                              {item.result.triFlowScores.overallEffectiveness}
                            </span>
                          )}
                          <svg className={`h-3.5 w-3.5 text-slate-300 transition-transform ${expandedIndex === item.index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {expandedIndex === item.index && item.result && (
                        <div className="border-t border-slate-200 px-3.5 py-3 space-y-3 bg-white">
                          {/* Audience Persona */}
                          <div>
                            <span className={sectionLabel}>受众画像</span>
                            <p className="mt-1 text-xs text-slate-600">{item.result.audiencePersona.userIntent}</p>
                          </div>

                          {/* Badcases */}
                          <div>
                            <span className={sectionLabel}>问题归因 ({item.result.badcases.length})</span>
                            <div className="mt-1 space-y-1.5">
                              {item.result.badcases.map((bc, j) => (
                                <div key={j} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`inline-flex rounded border px-1 py-0.5 text-[10px] font-medium ${
                                      bc.layer === 'platform' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        : bc.layer === 'audience' ? 'bg-blue-100 text-blue-700 border-blue-200'
                                          : 'bg-purple-100 text-purple-700 border-purple-200'
                                    }`}>{bc.layer === 'platform' ? '平台层' : bc.layer === 'audience' ? '受众层' : '创作者层'}</span>
                                    <span className="text-[10px] font-medium text-slate-600">{bc.badcaseLabel || bc.type}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">
                                    <span className="font-medium text-slate-400">证据: </span>{bc.evidence}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-emerald-600">
                                    <span className="font-medium text-emerald-500">修复: </span>{bc.fix}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Prompt v2 */}
                          <div>
                            <span className={sectionLabel}>优化 Prompt v2</span>
                            <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[10px] leading-relaxed text-slate-700 font-mono max-h-32 overflow-y-auto">
                              {item.result.promptV2.optimizedPrompt}
                            </pre>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            <AddToDatasetButton
                              source="batch"
                              platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'}
                              contentGoal={contentGoal}
                              productTopic={productTopic || undefined}
                              targetAudience={targetAudience || undefined}
                              content={item.fullContent}
                              prompt={originalPrompt || undefined}
                              aiScores={{
                                platformFit: item.result.triFlowScores.platformFit,
                                audienceFit: item.result.triFlowScores.audienceFit,
                                creatorGoalFit: item.result.triFlowScores.creatorGoalFit,
                                overallEffectiveness: item.result.triFlowScores.overallEffectiveness,
                              }}
                              aiBadcaseLabels={item.result.badcases.map((bc) => bc.badcaseLabel || bc.type)}
                              confidenceLevel={item.result.confidence?.level}
                              confidenceScore={item.result.confidence?.score}
                              riskLevel={item.result.riskAssessment?.riskLevel}
                              reviewRequired={item.result.riskAssessment?.reviewRequired}
                              riskTypes={item.result.riskAssessment?.riskTypes}
                              judgeAgreementLevel={item.result.multiJudge?.agreement?.level}
                              judgeReviewRequired={item.result.multiJudge?.agreement?.reviewRequired}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
