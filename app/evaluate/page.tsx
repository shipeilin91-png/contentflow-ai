'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { getMockResult, type EvaluationResult } from '../data/mockResults';
import { addHistoryItem, generateId } from '../utils/history';
import CalibrationPanel from '../components/CalibrationPanel';
import SaveSopButton from '../components/SaveSopButton';
import AddToDatasetButton from '../components/AddToDatasetButton';
import SavePromptButton from '../components/SavePromptButton';
import { SCORE_BANDS, getScoreBand, scoreColor, scoreBg } from '../data/scoreScale';
import { RISK_LABEL_MAP } from '../data/riskTaxonomy';
import {
  XHS_DEFAULT_STRUCTURE,
  DY_DEFAULT_STRUCTURE,
  XHS_DEFAULT_RUBRIC,
  DY_DEFAULT_RUBRIC,
} from '../types/sop';

const PLATFORMS = ['小红书', '抖音'] as const;
const GOALS = ['种草', '转化', '涨粉', '搜索沉淀'] as const;
type SectionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
type ResultLanguage = 'zh' | 'en';

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400';

// ── Helpers ─────────────────────────────────────────────────────────
function layerBadge(layer: string) {
  switch (layer) {
    case 'platform': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'audience': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'creator': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
function sectionIcon(cls: string, letter: string) {
  return <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${cls}`}>{letter}</span>;
}

function riskLabel(riskType: string) {
  return RISK_LABEL_MAP[riskType] || '其他风险';
}

function sectionTitle(title: string, subtitle: string) {
  return (
    <span className="flex flex-col leading-tight">
      <span>{title}</span>
      <span className="mt-0.5 text-[10px] font-normal text-slate-400">{subtitle}</span>
    </span>
  );
}

function summarizeResult(result: EvaluationResult): string {
  const topBadcases = result.badcases
    .slice(0, 2)
    .map((bc) => bc.badcaseLabel || bc.type)
    .filter(Boolean)
    .join('、');

  if (result.triFlowScores.overallEffectiveness >= 75) {
    return topBadcases
      ? `整体方向可用，主要需要继续校准 ${topBadcases}。建议发布前结合真实素材和平台语境做人工复核。`
      : '整体方向可用，建议发布前结合真实素材和平台语境做人工复核。';
  }

  return topBadcases
    ? `当前内容的主要短板集中在 ${topBadcases}。建议先按问题归因修正结构和信任信号，再进入发布前复核。`
    : '当前内容仍需要优化平台适配、受众信任和创作者目标路径，再进入发布前复核。';
}

function looksEnglish(text?: string) {
  if (!text) return false;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
  return latinCount >= 12 && latinCount > cjkCount * 1.2;
}

function zhText(text: string | undefined, fallback: string) {
  if (!text) return fallback;
  return looksEnglish(text) ? fallback : text;
}

function zhArray(items: string[] | undefined, fallback: string[]) {
  const safeItems = items && items.length > 0 ? items : fallback;
  return safeItems.map((item, index) => zhText(item, fallback[index] || fallback[0] || '暂无中文说明'));
}

function getChineseReport(result: EvaluationResult, platform: string): EvaluationResult {
  const fallback = getMockResult(platform);
  return {
    ...result,
    audiencePersona: {
      userIntent: zhText(result.audiencePersona.userIntent, fallback.audiencePersona.userIntent),
      psychologicalNeeds: zhArray(result.audiencePersona.psychologicalNeeds, fallback.audiencePersona.psychologicalNeeds),
      trustBarriers: zhArray(result.audiencePersona.trustBarriers, fallback.audiencePersona.trustBarriers),
      dislikedExpressions: zhArray(result.audiencePersona.dislikedExpressions, fallback.audiencePersona.dislikedExpressions),
      contentPreference: zhText(result.audiencePersona.contentPreference, fallback.audiencePersona.contentPreference),
    },
    badcases: result.badcases.map((bc, index) => {
      const fallbackBadcase = fallback.badcases[index] || fallback.badcases[0];
      return {
        ...bc,
        type: zhText(bc.type, fallbackBadcase.type),
        evidence: zhText(bc.evidence, fallbackBadcase.evidence),
        fix: zhText(bc.fix, fallbackBadcase.fix),
        badcaseLabel: zhText(bc.badcaseLabel || bc.type, fallbackBadcase.badcaseLabel || fallbackBadcase.type),
      };
    }),
    promptV2: {
      optimizedPrompt: zhText(result.promptV2.optimizedPrompt, fallback.promptV2.optimizedPrompt),
      changeReasons: zhArray(result.promptV2.changeReasons, fallback.promptV2.changeReasons),
      expectedImprovements: zhArray(result.promptV2.expectedImprovements, fallback.promptV2.expectedImprovements),
    },
    confidence: result.confidence
      ? {
          ...result.confidence,
          reasons: zhArray(result.confidence.reasons, fallback.confidence?.reasons || ['评测置信度需要结合输入完整度判断']),
        }
      : undefined,
    riskAssessment: result.riskAssessment
      ? {
          ...result.riskAssessment,
          reasons: zhArray(result.riskAssessment.reasons, fallback.riskAssessment?.reasons || ['当前风险判断仅用于内容优化参考']),
        }
      : undefined,
    multiJudge: result.multiJudge
      ? {
          judges: result.multiJudge.judges.map((judge, index) => {
            const fallbackJudge = fallback.multiJudge?.judges[index] || fallback.multiJudge?.judges[0];
            return {
              ...judge,
              name: zhText(judge.name, fallbackJudge?.name || '评审员'),
              keyConcern: zhText(judge.keyConcern, fallbackJudge?.keyConcern || '需要进一步复核关键问题'),
              evidence: zhText(judge.evidence, fallbackJudge?.evidence || '需要结合原文证据复核'),
              recommendation: zhText(judge.recommendation, fallbackJudge?.recommendation || '建议人工复核后再发布'),
            };
          }),
          agreement: {
            ...result.multiJudge.agreement,
            summary: zhText(result.multiJudge.agreement.summary, fallback.multiJudge?.agreement.summary || '评审维度存在分歧，建议人工复核。'),
          },
        }
      : undefined,
  };
}

function AccordionSection({
  letter,
  title,
  subtitle,
  iconClass,
  open,
  onToggle,
  children,
}: {
  letter: SectionKey;
  title: string;
  subtitle: string;
  iconClass: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
        <h3 className="flex items-center gap-3 text-sm font-semibold text-slate-800">
          {sectionIcon(iconClass, letter)}
          {sectionTitle(title, subtitle)}
        </h3>
        <svg className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </section>
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
  const [openSection, setOpenSection] = useState<SectionKey | null>('B');
  const [resultLanguage, setResultLanguage] = useState<ResultLanguage>('zh');
  const [copied, setCopied] = useState(false);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (result && !loading && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
      addHistoryItem({
        id: generateId(), createdAt: new Date().toISOString(), source: 'evaluate',
        platform: apiPlatform, contentGoal, productTopic, targetAudience,
        overallEffectiveness: result.triFlowScores.overallEffectiveness,
        platformFit: result.triFlowScores.platformFit,
        audienceFit: result.triFlowScores.audienceFit,
        creatorGoalFit: result.triFlowScores.creatorGoalFit,
        badcaseCount: result.badcases.length,
        badcaseTypes: result.badcases.map((bc) => bc.badcaseLabel || bc.type),
        confidenceLevel: result.confidence?.level,
        riskLevel: result.riskAssessment?.riskLevel,
        reviewRequired: result.riskAssessment?.reviewRequired,
        judgeAgreementLevel: result.multiJudge?.agreement?.level,
        judgeReviewRequired: result.multiJudge?.agreement?.reviewRequired,
      });
    }
  }, [result, loading, platform, contentGoal, productTopic, targetAudience]);

  const handleRun = async () => {
    hasSavedRef.current = false;
    setLoading(true); setIsFallback(false);
    const apiPlatform = platform === '小红书' ? 'xiaohongshu' : 'douyin';
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: apiPlatform, contentGoal, productTopic, targetAudience, originalPrompt, aiContent, pgcReference: pgcReference || undefined }),
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
    } finally { setLoading(false); }
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSection((current) => (current === key ? null : key));
  };

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* silent */ }
  };

  const report = result
    ? resultLanguage === 'zh'
      ? getChineseReport(result, platform)
      : result
    : null;
  const overall = report?.triFlowScores.overallEffectiveness ?? 0;
  const band = getScoreBand(overall);
  const hasConfidence = !!report?.confidence;
  const hasRisk = !!report?.riskAssessment;
  const hasMultiJudge = !!report?.multiJudge;
  const summaryText = report ? summarizeResult(report) : '';

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">内容评测工作台</h1>
          <p className="mt-1 text-sm text-slate-500">TriFlow 平台-受众-创作者三方内容有效性评测</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {platform === '小红书' ? '搜索驱动 种草平台' : '推荐流 短视频平台'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Input Form ───────────────────────────────── */}
        <div>
          <div className={`${cardClass} lg:sticky lg:top-20`}>
            <h2 className="text-sm font-semibold text-slate-800 mb-5">配置面板</h2>
            {/* Platform */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">目标平台</label>
              <div className="flex gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} type="button" onClick={() => { setPlatform(p); setResult(null); }}
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
            {/* Product Topic */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">产品 / 主题</label>
              <input type="text" value={productTopic} onChange={(e) => setProductTopic(e.target.value)}
                placeholder="例如：敏感肌护肤品、家用投影仪"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
            </div>
            {/* Target Audience */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">目标受众</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="例如：25-35岁职场女性、Z世代学生"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
            </div>
            {/* Original Prompt */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">原始 Prompt</label>
              <textarea value={originalPrompt} onChange={(e) => setOriginalPrompt(e.target.value)}
                placeholder="粘贴原始 AI Prompt..." rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
            </div>
            {/* AI Content */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">AI 生成内容</label>
              <textarea value={aiContent} onChange={(e) => setAiContent(e.target.value)}
                placeholder="粘贴 AI 生成的内容..." rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
            </div>
            {/* PGC Reference */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">PGC 标杆内容（可选）</label>
              <textarea value={pgcReference} onChange={(e) => setPgcReference(e.target.value)}
                placeholder="可选：粘贴一篇高互动 PGC 内容作为参考..." rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
            </div>
            <button type="button" onClick={handleRun} disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  评测中...
                </span>
              ) : ('开始评测')}
            </button>

            {/* Config summary card */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
              <span className={`${sectionLabel} block mb-2`}>当前评测配置</span>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between"><span className="text-slate-400">平台</span><span className="font-medium">{platform}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">目标</span><span className="font-medium">{contentGoal}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">产品/主题</span><span className="font-medium truncate ml-4 max-w-[180px]">{productTopic || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">目标受众</span><span className="font-medium truncate ml-4 max-w-[180px]">{targetAudience || '—'}</span></div>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">评测结果仅用于内容优化参考，不代表真实平台推荐结果或转化预测。</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ─────────────────────────────────── */}
        <div>
          {/* Empty state */}
          {!result && !loading && (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20">
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-3 text-sm text-slate-400">填写表单后点击「开始评测」查看结果</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="mt-3 text-sm text-slate-500">正在进行 TriFlow 三方评测...</p>
              </div>
            </div>
          )}

          {result && report && (
            <div className="space-y-4">
              {/* Fallback */}
              {isFallback && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>使用备用评测结果（未连接 API）</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <span className="block text-sm font-semibold text-slate-800">结果语言</span>
                  <span className="text-[10px] text-slate-400">Result Language</span>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {[
                    { key: 'zh' as const, label: '中文' },
                    { key: 'en' as const, label: 'English' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setResultLanguage(item.key)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${resultLanguage === item.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Evaluation Summary ─────────────────────── */}
              <section className={`rounded-2xl border p-5 shadow-sm ${band.bg}`}>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">
                  {sectionTitle('评测摘要', 'Evaluation Summary')}
                </h3>
                <div className="flex flex-wrap items-end gap-4 mb-3">
                  <div>
                    <span className="block text-[10px] font-medium text-slate-400">综合有效性</span>
                    <span className={`mt-1 block text-3xl font-bold tracking-tight ${band.color}`}>{overall}/100</span>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${band.color} ${band.bg.includes('red') ? 'bg-red-100' : band.bg.includes('orange') ? 'bg-orange-100' : band.bg.includes('amber') ? 'bg-amber-100' : 'bg-emerald-100'}`}>{band.label}</span>
                    <p className="mt-1 text-xs text-slate-600 max-w-sm">{band.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {hasRisk ? (
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${report.riskAssessment!.riskLevel === 'high' ? 'bg-red-100 text-red-600' : report.riskAssessment!.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      风险等级：{report.riskAssessment!.riskLevel === 'high' ? '高风险' : report.riskAssessment!.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">风险等级：未返回</span>
                  )}
                  {hasMultiJudge && (
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${report.multiJudge!.agreement.level === 'high' ? 'bg-emerald-100 text-emerald-700' : report.multiJudge!.agreement.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                      评审一致性：{report.multiJudge!.agreement.level === 'high' ? '高一致' : report.multiJudge!.agreement.level === 'medium' ? '中等一致' : '低一致'}
                    </span>
                  )}
                  <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${(report.riskAssessment?.reviewRequired || report.multiJudge?.agreement?.reviewRequired) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    人工复核：{(report.riskAssessment?.reviewRequired || report.multiJudge?.agreement?.reviewRequired) ? '建议复核' : '暂无强制复核'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{summaryText}</p>
                <p className="mt-3 text-[10px] text-slate-400">评分范围：0-100。分数越高代表越适配当前平台、受众和内容目标；评分仅用于内容优化参考，不代表真实平台推荐结果或转化预测。</p>
              </section>

              <AccordionSection letter="A" title="受众画像" subtitle="Audience Persona" iconClass="bg-blue-100 text-blue-700" open={openSection === 'A'} onToggle={() => toggleSection('A')}>
                <div className="space-y-3 text-sm">
                  <div><span className={sectionLabel}>用户意图 <span className="text-slate-300">User Intent</span></span><p className="mt-0.5 text-xs text-slate-700">{report.audiencePersona.userIntent}</p></div>
                  <div><span className={sectionLabel}>心理需求 <span className="text-slate-300">Psychological Needs</span></span><ul className="mt-1 space-y-1">{report.audiencePersona.psychologicalNeeds.map((n,i)=><li key={i} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-blue-400"/>{n}</li>)}</ul></div>
                  <div><span className={sectionLabel}>信任障碍 <span className="text-slate-300">Trust Barriers</span></span><ul className="mt-1 space-y-1">{report.audiencePersona.trustBarriers.map((t,i)=><li key={i} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400"/>{t}</li>)}</ul></div>
                  <div><span className={sectionLabel}>内容偏好 <span className="text-slate-300">Content Preference</span></span><p className="mt-0.5 text-xs text-slate-700">{report.audiencePersona.contentPreference}</p></div>
                </div>
              </AccordionSection>

              <AccordionSection letter="B" title="TriFlow 三方评分" subtitle="Platform / Audience / Creator Goal" iconClass="bg-indigo-100 text-indigo-700" open={openSection === 'B'} onToggle={() => toggleSection('B')}>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-xs font-medium text-slate-600">评分标准：评分范围 0-100</p>
                  <div className="mt-2 grid gap-1 text-[10px] text-slate-500 sm:grid-cols-2">
                    {SCORE_BANDS.map((scoreBand) => (
                      <span key={scoreBand.label}>{scoreBand.min}-{scoreBand.max}：{scoreBand.label}，{scoreBand.label === '明显不合格' ? '需要重写' : scoreBand.label === '较弱' ? '需要大幅修改' : scoreBand.label === '基本可用' ? '仍需优化' : scoreBand.label === '表现良好' ? '可进入发布前复核' : '建议结合实际素材复核'}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: '平台适配', key: 'platformFit' as const, subtitle: 'Platform Fit' },
                    { label: '受众适配', key: 'audienceFit' as const, subtitle: 'Audience Fit' },
                    { label: '创作者目标', key: 'creatorGoalFit' as const, subtitle: 'Creator Goal' },
                    { label: '综合有效性', key: 'overallEffectiveness' as const, subtitle: 'Overall' },
                  ].map(({ label, key, subtitle }) => {
                    const s = report.triFlowScores[key];
                    const b = getScoreBand(s);
                    return (
                      <div key={key} className={`rounded-xl border p-3.5 ${scoreBg(s)}`}>
                        <span className="block text-xs font-medium text-slate-500">{label} <span className="text-[10px] text-slate-400">{subtitle}</span></span>
                        <span className={`mt-1 block text-2xl font-bold tracking-tight ${scoreColor(s)}`}>{s}/100</span>
                        <span className={`block mt-0.5 text-[10px] font-medium ${scoreColor(s)}`}>{b.label}</span>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{b.description}</p>
                      </div>
                    );
                  })}
                </div>
              </AccordionSection>

              <AccordionSection letter="C" title="问题归因" subtitle="Badcase Diagnosis" iconClass="bg-red-100 text-red-700" open={openSection === 'C'} onToggle={() => toggleSection('C')}>
                <div className="space-y-2.5">
                  {report.badcases.map((bc, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">{bc.badcaseLabel || bc.type}</span>
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${layerBadge(bc.layer)}`}>问题层级：{bc.layer === 'platform' ? '平台层' : bc.layer === 'audience' ? '受众层' : '创作者层'}</span>
                        <span className="text-[10px] text-slate-400">问题类型：{bc.type}</span>
                      </div>
                      <div className="mb-2 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2">
                        <span className="text-[10px] font-medium text-slate-500">原文证据</span>
                        <p className="mt-0.5 text-xs text-slate-600">{bc.evidence}</p>
                      </div>
                      <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2">
                        <span className="text-[10px] font-medium text-sky-600">修复建议</span>
                        <p className="mt-0.5 text-xs text-emerald-700">{bc.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>

              <AccordionSection letter="D" title="Prompt v2 优化建议" subtitle="Prompt Optimizer" iconClass="bg-emerald-100 text-emerald-700" open={openSection === 'D'} onToggle={() => toggleSection('D')}>
                <div className="relative">
                  <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 pr-24 text-xs leading-relaxed text-slate-700 font-mono">{report.promptV2.optimizedPrompt}</pre>
                  <button type="button" onClick={() => handleCopy(report.promptV2.optimizedPrompt)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-50">
                    {copied ? '已复制' : '复制 Prompt'}
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div><span className={sectionLabel}>变更原因 <span className="text-slate-300">Change Reasons</span></span><ul className="mt-2 space-y-1.5">{report.promptV2.changeReasons.map((r,i)=><li key={i} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400"/>{r}</li>)}</ul></div>
                  <div><span className={sectionLabel}>预期改进 <span className="text-slate-300">Expected Improvements</span></span><ul className="mt-2 space-y-1.5">{report.promptV2.expectedImprovements.map((imp,i)=><li key={i} className="flex items-start gap-2 text-xs text-emerald-700"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400"/>{imp}</li>)}</ul></div>
                </div>
              </AccordionSection>

              <AccordionSection letter="E" title="多评审一致性" subtitle="Multi-Judge Evaluation" iconClass={hasMultiJudge ? (report.multiJudge!.agreement.level === 'high' ? 'bg-emerald-100 text-emerald-700' : report.multiJudge!.agreement.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-600'} open={openSection === 'E'} onToggle={() => toggleSection('E')}>
                {hasMultiJudge ? (
                  <>
                  <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${report.multiJudge!.agreement.level === 'high' ? 'bg-emerald-100 text-emerald-700' : report.multiJudge!.agreement.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{report.multiJudge!.agreement.level === 'high' ? '高一致' : report.multiJudge!.agreement.level === 'medium' ? '中等一致' : '低一致'}</span>
                      <span className="text-[10px] text-slate-400">分差: {report.multiJudge!.agreement.scoreSpread}</span>
                      {report.multiJudge!.agreement.reviewRequired && <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">建议人工复核</span>}
                    </div>
                    <p className="text-xs text-slate-600">{report.multiJudge!.agreement.summary}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {report.multiJudge!.judges.map((judge) => (
                      <div key={judge.judgeType} className={`rounded-xl border p-3 ${judge.judgeType === 'risk' && judge.verdict === 'high_risk' ? 'border-red-200 bg-red-50/60' : judge.judgeType === 'platform' ? 'border-emerald-100 bg-emerald-50/30' : judge.judgeType === 'audience' ? 'border-blue-100 bg-blue-50/30' : judge.judgeType === 'creator' ? 'border-purple-100 bg-purple-50/30' : 'border-slate-100 bg-slate-50/30'}`}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500">{judge.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${scoreColor(judge.score)}`}>{judge.score}/100</span>
                            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${judge.verdict === 'pass' ? 'bg-emerald-100 text-emerald-700' : judge.verdict === 'high_risk' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{judge.verdict === 'pass' ? '通过' : judge.verdict === 'high_risk' ? '高风险' : '需修改'}</span>
                          </div>
                        </div>
                        <p className="mb-1 text-[10px] text-slate-500"><span className="font-medium text-slate-400">关键担忧: </span>{judge.keyConcern}</p>
                        <p className="mb-1 text-[10px] text-slate-400"><span className="font-medium text-slate-400">证据: </span>{judge.evidence}</p>
                        <p className="text-[10px] text-sky-600"><span className="font-medium text-sky-500">建议: </span>{judge.recommendation}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-slate-400">多评审机制用于辅助识别评测分歧和复核优先级，不代表真实平台分发结果、法律意见或商业转化预测。</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">当前评测结果未返回多评审数据，旧结果仍可正常查看其他模块。</p>
                )}
              </AccordionSection>

              <AccordionSection letter="F" title="评测置信度" subtitle="Confidence" iconClass={hasConfidence ? (report.confidence!.level === 'high' ? 'bg-emerald-100 text-emerald-700' : report.confidence!.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-600'} open={openSection === 'F'} onToggle={() => toggleSection('F')}>
                {hasConfidence ? (
                  <>
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.confidence!.level === 'high' ? 'bg-emerald-100 text-emerald-700' : report.confidence!.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{report.confidence!.level === 'high' ? '高置信' : report.confidence!.level === 'medium' ? '中置信' : '低置信'}</span>
                    <span className="text-sm font-bold text-slate-700">{report.confidence!.score}/100</span>
                  </div>
                  <ul className="space-y-1.5">{report.confidence!.reasons.map((r,i)=><li key={i} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"/>{r}</li>)}</ul>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">当前评测结果未返回置信度数据。</p>
                )}
              </AccordionSection>

              <AccordionSection letter="G" title="风险分层" subtitle="Risk Assessment" iconClass={hasRisk ? (report.riskAssessment!.riskLevel === 'high' ? 'bg-red-100 text-red-700' : report.riskAssessment!.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') : 'bg-slate-100 text-slate-600'} open={openSection === 'G'} onToggle={() => toggleSection('G')}>
                {hasRisk ? (
                  <>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.riskAssessment!.riskLevel === 'high' ? 'bg-red-100 text-red-600' : report.riskAssessment!.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{report.riskAssessment!.riskLevel === 'high' ? '高风险' : report.riskAssessment!.riskLevel === 'medium' ? '中风险' : '低风险'}</span>
                    {report.riskAssessment!.reviewRequired && <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">建议人工复核</span>}
                    {(report.riskAssessment!.riskTypes ?? []).map((rt) => (
                      <span key={rt} className="inline-flex rounded border border-rose-100 bg-rose-50/50 px-1.5 py-0.5 text-[10px] text-rose-600">{riskLabel(rt)}</span>
                    ))}
                  </div>
                  <ul className="mb-3 space-y-1.5">{report.riskAssessment!.reasons.map((r,i)=><li key={i} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"/>{r}</li>)}</ul>
                  <p className="text-[10px] leading-relaxed text-slate-400">风险分层仅用于内容优化与人工复核参考，不代表法律意见、平台审核结果或真实转化预测。</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">当前评测结果未返回风险分层数据。</p>
                )}
              </AccordionSection>

              <AccordionSection letter="H" title="保存与校准" subtitle="Actions & Calibration" iconClass="bg-sky-100 text-sky-700" open={openSection === 'H'} onToggle={() => toggleSection('H')}>
                <div className="space-y-4">
                  <div>
                    <span className={sectionLabel}>保存与沉淀 <span className="text-slate-300">Actions</span></span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SaveSopButton template={{ source: 'evaluate', name: `${platform}｜${contentGoal}｜${targetAudience || '通用受众'} SOP`, platform: platform === '小红书' ? 'xiaohongshu' : 'douyin', contentGoal, targetAudience, productTopic: productTopic || undefined, structure: platform === '小红书' ? XHS_DEFAULT_STRUCTURE : DY_DEFAULT_STRUCTURE, promptTemplate: report.promptV2.optimizedPrompt, commonBadcases: report.badcases.map((bc) => bc.badcaseLabel || bc.type), rubricFocus: platform === '小红书' ? XHS_DEFAULT_RUBRIC : DY_DEFAULT_RUBRIC }} />
                      <AddToDatasetButton source="evaluate" platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'} contentGoal={contentGoal} productTopic={productTopic || undefined} targetAudience={targetAudience || undefined} content={aiContent} prompt={originalPrompt || undefined} aiScores={{ platformFit: report.triFlowScores.platformFit, audienceFit: report.triFlowScores.audienceFit, creatorGoalFit: report.triFlowScores.creatorGoalFit, overallEffectiveness: report.triFlowScores.overallEffectiveness }} aiBadcaseLabels={report.badcases.map((bc) => bc.badcaseLabel || bc.type)} confidenceLevel={report.confidence?.level} riskLevel={report.riskAssessment?.riskLevel} riskTypes={report.riskAssessment?.riskTypes} judgeAgreementLevel={report.multiJudge?.agreement?.level} />
                      <SavePromptButton label="保存到版本库" item={{ source: 'evaluate', name: `${platform}｜${contentGoal}｜${targetAudience || '通用受众'} Prompt v2`, platform: platform === '小红书' ? 'xiaohongshu' : 'douyin', contentGoal, productTopic: productTopic || undefined, targetAudience, versionLabel: 'v2', promptText: report.promptV2.optimizedPrompt, parentPromptText: originalPrompt || undefined, changeReasons: report.promptV2.changeReasons, linkedBadcases: report.badcases.map((bc) => bc.badcaseLabel || bc.type), expectedImprovements: report.promptV2.expectedImprovements, scoreSnapshot: { platformFit: report.triFlowScores.platformFit, audienceFit: report.triFlowScores.audienceFit, creatorGoalFit: report.triFlowScores.creatorGoalFit, overallEffectiveness: report.triFlowScores.overallEffectiveness } }} />
                    </div>
                  </div>
                  <div>
                    <span className={sectionLabel}>人工校准 <span className="text-slate-300">Human Calibration</span></span>
                    <div className="mt-2">
                      <CalibrationPanel source="evaluate" platform={platform === '小红书' ? 'xiaohongshu' : 'douyin'} productTopic={productTopic || undefined} targetAudience={targetAudience || undefined} buttons={['accurate','score_too_high','score_too_low','badcase_wrong','prompt_useful','prompt_not_useful']} />
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
