'use client';

import { useState, useEffect, useRef } from 'react';
import { addHistoryItem, generateId } from '../utils/history';
import CalibrationPanel from '../components/CalibrationPanel';
import SaveSopButton from '../components/SaveSopButton';

// ── Constants ───────────────────────────────────────────────────────
const PLATFORMS = ['小红书', '抖音'] as const;
const GOALS = ['种草', '转化', '涨粉', '搜索沉淀'] as const;

// ── Result types ────────────────────────────────────────────────────
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

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

function sectionIcon(cls: string, letter: string) {
  return (
    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${cls}`}>
      {letter}
    </span>
  );
}

// ── Page Component ───────────────────────────────────────────────────
export default function ComparePage() {
  const [platform, setPlatform] = useState<string>('小红书');
  const [contentGoal, setContentGoal] = useState<string>('种草');
  const [productTopic, setProductTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [aigcContent, setAigcContent] = useState('');
  const [pgcContent, setPgcContent] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (result && !loading && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
      addHistoryItem({
        id: generateId(),
        createdAt: new Date().toISOString(),
        source: 'compare',
        platform: apiPlatform,
        contentGoal,
        productTopic,
        targetAudience,
        overallEffectiveness: 0,
        platformFit: 0,
        audienceFit: 0,
        creatorGoalFit: 0,
        badcaseCount: result.aigcWeaknesses.length,
        badcaseTypes: result.aigcWeaknesses.slice(0, 5),
      });
    }
  }, [result, loading, platform, contentGoal, productTopic, targetAudience]);

  const handleRun = async () => {
    hasSavedRef.current = false;
    setLoading(true);
    setIsFallback(false);
    setResult(null);

    const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: apiPlatform,
          contentGoal,
          productTopic,
          targetAudience,
          aigcContent,
          pgcContent,
        }),
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const { _fallback, ...compareData } = data;
      setResult(compareData as CompareResult);
      setIsFallback(!!_fallback);
    } catch (err) {
      console.error('[ContentFlow AI] Compare API call failed:', err);
      setResult(null);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            PGC/AIGC 对比分析
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            对比平台标杆内容与 AI 生成内容的差距，提炼可迁移结构，不做抄袭或洗稿
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {platform === '小红书' ? '小红书 分析' : '抖音 分析'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Input Form ────────────────────────────────── */}
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-800 mb-5">
            对比配置
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

          {/* AIGC Content */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              AI 生成内容
            </label>
            <textarea
              value={aigcContent}
              onChange={(e) => setAigcContent(e.target.value)}
              placeholder="粘贴 AI 生成的内容..."
              rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* PGC Content */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              PGC 标杆内容
            </label>
            <textarea
              value={pgcContent}
              onChange={(e) => setPgcContent(e.target.value)}
              placeholder="粘贴 PGC 标杆 / 高质量人工内容..."
              rows={5}
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
                对比分析中...
              </span>
            ) : (
              '开始对比分析'
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
                  粘贴 AIGC 和 PGC 内容后，点击「开始对比分析」
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
                <p className="mt-3 text-sm text-slate-500">正在分析 PGC 与 AIGC 差距...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Fallback indicator */}
              {isFallback && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>使用备用对比结果</span>
                </div>
              )}

              {/* ── 1. 核心差距 ──────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {sectionIcon('bg-amber-100 text-amber-700', 'G')}
                  核心差距总结
                </h3>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                  {result.gapSummary}
                </p>
              </section>

              {/* ── 2. PGC 优势 ────────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-emerald-100 text-emerald-700', 'S')}
                  PGC 优势点
                </h3>
                <ul className="space-y-2">
                  {result.pgcStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 border border-emerald-100 bg-emerald-50/50 rounded-lg px-3 py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 3. AIGC 短板 ────────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-red-100 text-red-700', 'W')}
                  AIGC 短板
                </h3>
                <ul className="space-y-2">
                  {result.aigcWeaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 border border-red-100 bg-red-50/50 rounded-lg px-3 py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 4. 可迁移规则 ───────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1">
                  {sectionIcon('bg-blue-100 text-blue-700', 'T')}
                  可迁移内容规则
                </h3>
                <p className="mb-3 text-[10px] text-slate-400 uppercase tracking-wider">
                  提炼结构与方法，不做逐字复制
                </p>
                <ul className="space-y-2">
                  {result.transferableRules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 border border-blue-100 bg-blue-50/40 rounded-lg px-3 py-2.5">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md bg-blue-100 text-[10px] font-bold text-blue-600">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 5. 平台洞察 ─────────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-purple-100 text-purple-700', 'P')}
                  平台化洞察
                  <span className="ml-auto inline-flex rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {platform}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {result.platformSpecificInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 border border-purple-100 bg-purple-50/40 rounded-lg px-3 py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 6. Prompt 优化建议 ───────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-indigo-100 text-indigo-700', 'O')}
                  Prompt 优化建议
                </h3>
                <ul className="space-y-2">
                  {result.promptOptimizationAdvice.map((advice, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                      {advice}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 7. SOP 沉淀潜力 ───────────────────────────────── */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  {sectionIcon('bg-emerald-100 text-emerald-700', 'S')}
                  SOP 沉淀潜力
                </h3>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      result.sopPotential.canBeSavedAsSop
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {result.sopPotential.canBeSavedAsSop ? '✓ 适合沉淀 SOP' : '暂不建议'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-2">
                    {result.sopPotential.suggestedSopName}
                  </p>
                  <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    可复用结构
                  </span>
                  <ul className="space-y-1.5">
                    {result.sopPotential.reusableStructure.map((rs, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                        {rs}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-100">
                  <SaveSopButton
                    label="保存可迁移规则为 SOP"
                    template={{
                      source: 'compare',
                      name: result.sopPotential.suggestedSopName || `${platform}｜PGC/AIGC 对比 SOP`,
                      platform: platform === '小红书' ? 'xiaohongshu' : 'douyin',
                      contentGoal,
                      targetAudience,
                      productTopic: productTopic || undefined,
                      structure: result.sopPotential.reusableStructure,
                      promptTemplate: result.promptOptimizationAdvice.join('\n'),
                      commonBadcases: result.aigcWeaknesses,
                      rubricFocus: result.platformSpecificInsights.slice(0, 5),
                    }}
                  />
                </div>
              </section>

              {/* Human Calibration */}
              <section className={cardClass}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-700">H</span>
                  人工校准 Human Calibration
                </h3>
                <CalibrationPanel
                  source="compare"
                  platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'}
                  productTopic={productTopic || undefined}
                  targetAudience={targetAudience || undefined}
                  buttons={[
                    'accurate',
                    'badcase_wrong',
                    'score_too_low',
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
