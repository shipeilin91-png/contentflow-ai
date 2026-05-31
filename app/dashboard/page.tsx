'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHistoryItems, clearHistory } from '../utils/history';
import type { EvaluationHistoryItem } from '../types/history';
import {
  getCalibrationFeedbacks,
  getCalibrationStats,
  clearCalibrationFeedbacks,
} from '../utils/calibration';
import type { CalibrationFeedback } from '../types/calibration';
import { CALIBRATION_LABEL_MAP } from '../types/calibration';
import { getUserSopTemplates } from '../utils/sopStorage';
import { getPromptVersions } from '../utils/promptRegistryStorage';
import {
  getEvalDatasetItems,
} from '../utils/evalDatasetStorage';
import { computeAgreementRate } from '../types/evalDataset';

type BadcaseFreq = { type: string; count: number };

// ── Shared style tokens ─────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const statCardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

export default function DashboardPage() {
  const [items, setItems] = useState<EvaluationHistoryItem[]>([]);
  const [calItems, setCalItems] = useState<CalibrationFeedback[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(getHistoryItems());
    setCalItems(getCalibrationFeedbacks());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (typeof window !== 'undefined' && window.confirm('确认清空所有评测历史？此操作不可撤销。')) {
      clearHistory();
      setItems([]);
    }
  };

  const handleClearCalibration = () => {
    if (typeof window !== 'undefined' && window.confirm('确定要清空所有人工校准反馈吗？')) {
      clearCalibrationFeedbacks();
      setCalItems([]);
    }
  };

  // ── Evaluation stats ────────────────────────────────────────────
  const totalEvaluations = items.length;

  const avgOverall =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.overallEffectiveness, 0) / items.length)
      : 0;
  const avgPlatformFit =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.platformFit, 0) / items.length)
      : 0;
  const avgAudienceFit =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.audienceFit, 0) / items.length)
      : 0;

  const xhsCount = items.filter((i) => i.platform === 'xiaohongshu').length;
  const dyCount = items.filter((i) => i.platform === 'douyin').length;

  const badcaseFreq: BadcaseFreq[] = (() => {
    const map = new Map<string, number>();
    for (const item of items) {
      for (const t of item.badcaseTypes) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  const abItems = items.filter((i) => i.source === 'ab-test');
  const abCount = abItems.length;
  const abV2Wins = abItems.filter((i) => i.recommendedVersion === 'Prompt v2').length;
  const abAvgDelta =
    abItems.length > 0
      ? Math.round(abItems.reduce((sum, i) => sum + (i.improvementDelta || 0), 0) / abItems.length)
      : 0;

  const recentItems = items.slice(0, 10);

  // ── Calibration stats ───────────────────────────────────────────
  const calStats = getCalibrationStats();
  const recentCal = calItems.slice(0, 5);

  // ── SOP stats ──────────────────────────────────────────────────
  const userSops = getUserSopTemplates();
  const sopTotal = userSops.length;
  const sopXhs = userSops.filter((s) => s.platform === 'xiaohongshu').length;
  const sopDy = userSops.filter((s) => s.platform === 'douyin').length;
  const sopRecent = userSops.slice(0, 3);

  // ── Batch stats ────────────────────────────────────────────────
  const batchItems = items.filter((i) => i.source === 'batch');
  const batchCount = batchItems.length;
  const batchLastAvg =
    batchItems.length > 0 ? batchItems[0].overallEffectiveness : 0;
  const batchTopBadcases = (() => {
    const map = new Map<string, number>();
    for (const item of batchItems) {
      for (const t of item.badcaseTypes) {
        map.set(t, (map.get(t) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  })();

  // ── Eval Dataset stats ─────────────────────────────────────────
  const datasetItems = getEvalDatasetItems();
  const datasetTotal = datasetItems.length;
  const datasetAnnotated = datasetItems.filter(
    (d) => d.humanLabel?.usability
  ).length;
  const datasetAgreement = computeAgreementRate(datasetItems);
  const datasetRecent = datasetItems.slice(0, 3);

  // ── Risk & Review stats ────────────────────────────────────────
  const highRiskItems = items.filter((i) => i.riskLevel === 'high').length;
  const reviewRequiredItems = items.filter((i) => i.reviewRequired).length;
  const lowConfidenceItems = items.filter(
    (i) => i.confidenceLevel === 'low'
  ).length;
  const hasRiskData = items.some(
    (i) => i.riskLevel !== undefined || i.confidenceLevel !== undefined
  );

  // ── Multi-Judge stats ──────────────────────────────────────────
  const judgeHighAgreement = items.filter(
    (i) => i.judgeAgreementLevel === 'high'
  ).length;
  const judgeMediumAgreement = items.filter(
    (i) => i.judgeAgreementLevel === 'medium'
  ).length;
  const judgeLowAgreement = items.filter(
    (i) => i.judgeAgreementLevel === 'low'
  ).length;
  const judgeReviewCount = items.filter(
    (i) => i.judgeReviewRequired
  ).length;
  const hasJudgeData = items.some(
    (i) => i.judgeAgreementLevel !== undefined
  );

  // ── Prompt Registry stats ──────────────────────────────────────
  const promptVersions = getPromptVersions();
  const promptTotal = promptVersions.length;
  const promptWinners = promptVersions.filter(
    (p) => p.abTestResult?.winner === true
  ).length;
  const promptAvgDelta =
    promptVersions.filter((p) => p.abTestResult?.improvementDelta !== undefined).length > 0
      ? Math.round(
          promptVersions.reduce(
            (sum, p) => sum + (p.abTestResult?.improvementDelta || 0),
            0
          ) /
            promptVersions.filter(
              (p) => p.abTestResult?.improvementDelta !== undefined
            ).length
        )
      : 0;
  const promptRecent = promptVersions.slice(0, 3);

  // ── Helpers ────────────────────────────────────────────────────
  function scoreColor(score: number) {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  }
  function platformLabel(p: 'xiaohongshu' | 'douyin') {
    return p === 'xiaohongshu' ? '小红书' : '抖音';
  }
  function platformBadgeColor(p: 'xiaohongshu' | 'douyin') {
    return p === 'xiaohongshu'
      ? 'border-rose-200 bg-rose-50 text-rose-600'
      : 'border-cyan-200 bg-cyan-50 text-cyan-600';
  }
  function sourceLabel(s: 'evaluate' | 'ab-test' | 'compare' | 'batch') {
    if (s === 'evaluate') return '内容评测';
    if (s === 'compare') return 'PGC 对比';
    if (s === 'batch') return '批量评测';
    return 'A/B 测试';
  }
  function sourceBadgeColor(s: 'evaluate' | 'ab-test' | 'compare' | 'batch') {
    if (s === 'evaluate') return 'border-indigo-200 bg-indigo-50 text-indigo-600';
    if (s === 'compare') return 'border-emerald-200 bg-emerald-50 text-emerald-600';
    if (s === 'batch') return 'border-purple-200 bg-purple-50 text-purple-600';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }

  // ── Empty State ────────────────────────────────────────────────
  if (loaded && items.length === 0 && calItems.length === 0 && sopTotal === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">质量看板 Quality Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">沉淀本地评测历史，观察平台表现、平均分、高频问题和 Prompt 优化效果</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20">
          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-slate-600">暂无评测历史</h3>
          <p className="mt-1 text-xs text-slate-400">开始评测后，历史记录将自动保存在本地浏览器中</p>
          <div className="mt-6 flex gap-3">
            <Link href="/evaluate" className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              去内容评测
            </Link>
            <Link href="/ab-test" className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              去 A/B 测试
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">质量看板 Quality Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {totalEvaluations} 条评测记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearCalibration}
            className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            清空校准
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            清空历史
          </button>
        </div>
      </div>

      {/* ── 1. Overview Cards ────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">评测总数</span>
          <span className="mt-1.5 block text-2xl font-bold text-slate-900">{totalEvaluations}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">平均综合分</span>
          <span className={`mt-1.5 block text-2xl font-bold ${scoreColor(avgOverall)}`}>{avgOverall}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">平均平台适配</span>
          <span className={`mt-1.5 block text-2xl font-bold ${scoreColor(avgPlatformFit)}`}>{avgPlatformFit}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">平均受众适配</span>
          <span className={`mt-1.5 block text-2xl font-bold ${scoreColor(avgAudienceFit)}`}>{avgAudienceFit}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── 2. Platform Distribution ───────────────────────── */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800">平台分布</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: '小红书', count: xhsCount, color: 'bg-rose-400' },
              { label: '抖音', count: dyCount, color: 'bg-cyan-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 w-12">{label}</span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{
                        width: totalEvaluations > 0
                          ? `${Math.round((count / totalEvaluations) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-slate-700">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Top Badcase Types ───────────────────────────── */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800">高频问题</h3>
          {badcaseFreq.length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">暂无问题数据。</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {badcaseFreq.map((bf, i) => (
                <div key={bf.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md bg-rose-100 text-[10px] font-bold text-rose-600">
                      {i + 1}
                    </span>
                    <span className="truncate text-xs text-slate-600">{bf.type}</span>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-slate-400">{bf.count}次</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. Prompt Optimization Summary ──────────────────── */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800">Prompt 优化概览</h3>
          {abCount === 0 ? (
            <div className="mt-4">
              <p className="text-xs text-slate-400">
                暂无 A/B 测试数据。完成一次{' '}
                <Link href="/ab-test" className="text-indigo-600 underline underline-offset-2">A/B 测试</Link>{' '}
                后即可查看优化趋势。
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">A/B 测试次数</span>
                <span className="text-xs font-bold text-slate-900">{abCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">V2 胜率</span>
                <span className="text-xs font-bold text-emerald-600">
                  {abCount > 0 ? Math.round((abV2Wins / abCount) * 100) : 0}%{' '}
                  <span className="text-slate-400 font-normal">({abV2Wins}/{abCount})</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">平均提升</span>
                <span className={`text-xs font-bold ${
                  abAvgDelta > 0 ? 'text-emerald-600' : abAvgDelta < 0 ? 'text-red-500' : 'text-slate-500'
                }`}>
                  {abAvgDelta > 0 ? '+' : ''}{abAvgDelta} 综合分
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Recent History ──────────────────────────────── */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800">最近评测记录</h3>
          {recentItems.length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">暂无评测记录。</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sourceBadgeColor(item.source)}`}>
                        {sourceLabel(item.source)}
                      </span>
                      <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${platformBadgeColor(item.platform)}`}>
                        {platformLabel(item.platform)}
                      </span>
                      {item.recommendedVersion && (
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                          item.recommendedVersion === 'Prompt v2'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          {item.recommendedVersion}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-700">
                      {item.productTopic || '(未命名)'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {item.contentGoal} · {item.targetAudience || '通用受众'}
                    </p>
                  </div>
                  <div className="ml-3 flex flex-shrink-0 items-center gap-3">
                    {(item.source === 'evaluate' || item.source === 'ab-test') && item.overallEffectiveness > 0 && (
                      <div className="text-right">
                        <span className={`text-sm font-bold ${scoreColor(item.overallEffectiveness)}`}>
                          {item.overallEffectiveness}
                        </span>
                        <span className="block text-[10px] text-slate-400">综合</span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-600">{item.badcaseCount}</span>
                      <span className="block text-[10px] text-slate-400">问题</span>
                    </div>
                    {item.improvementDelta !== undefined && (
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          item.improvementDelta > 0 ? 'text-emerald-600' : item.improvementDelta < 0 ? 'text-red-500' : 'text-slate-500'
                        }`}>
                          {item.improvementDelta > 0 ? '+' : ''}{item.improvementDelta}
                        </span>
                        <span className="block text-[10px] text-slate-400">Δ</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 w-14 text-right">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Batch Summary ───────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          批量评测概览 Batch Summary
        </h2>
        {batchCount === 0 ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无批量评测数据。你可以在「批量评测」页面一次性评估多条 AI 内容。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">批量评测次数</span>
              <span className="mt-1.5 block text-2xl font-bold text-slate-900">{batchCount}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">最近一次平均分</span>
              <span className={`mt-1.5 block text-2xl font-bold ${scoreColor(batchLastAvg)}`}>{batchLastAvg}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">批量高频问题 Top3</span>
              <div className="mt-1.5 space-y-0.5">
                {batchTopBadcases.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  batchTopBadcases.map((b) => (
                    <p key={b.type} className="text-[10px] font-medium text-slate-700 truncate">
                      {b.type} ({b.count}次)
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Eval Dataset Summary ────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          评测集概览 Eval Dataset Summary
        </h2>
        {datasetTotal === 0 ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无评测集样本。你可以在内容评测或批量评测结果中点击「加入评测集」。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">样本总数</span>
              <span className="mt-1.5 block text-2xl font-bold text-slate-900">{datasetTotal}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">已标注</span>
              <span className="mt-1.5 block text-2xl font-bold text-indigo-600">{datasetAnnotated}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">AI/人工一致率</span>
              <span className={`mt-1.5 block text-2xl font-bold ${datasetAgreement.rate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {datasetAgreement.total > 0 ? `${datasetAgreement.rate}%` : '—'}
              </span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">最近样本</span>
              <div className="mt-1.5 space-y-0.5">
                {datasetRecent.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  datasetRecent.map((d) => (
                    <p key={d.id} className="text-[10px] font-medium text-slate-700 truncate">
                      {d.productTopic || d.contentGoal || '(未命名)'}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 8. Multi-Judge Summary ────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          多评审一致性概览 Multi-Judge Summary
        </h2>
        {!hasJudgeData ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无多评审一致性数据。后续评测会自动记录 Judge 分歧和复核建议。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">高一致</span>
              <span className="mt-1.5 block text-2xl font-bold text-emerald-600">{judgeHighAgreement}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">中等一致</span>
              <span className="mt-1.5 block text-2xl font-bold text-amber-600">{judgeMediumAgreement}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">低一致</span>
              <span className={`mt-1.5 block text-2xl font-bold ${judgeLowAgreement > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {judgeLowAgreement}
              </span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">建议人工复核</span>
              <span className={`mt-1.5 block text-2xl font-bold ${judgeReviewCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {judgeReviewCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 9. Risk & Review Summary ─────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          风险与复核概览 Risk &amp; Review Summary
        </h2>
        {!hasRiskData ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无风险分层数据。后续评测会自动记录置信度与风险分层。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">高风险记录</span>
              <span className={`mt-1.5 block text-2xl font-bold ${highRiskItems > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {highRiskItems}
              </span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">建议人工复核</span>
              <span className={`mt-1.5 block text-2xl font-bold ${reviewRequiredItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {reviewRequiredItems}
              </span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">低置信度</span>
              <span className={`mt-1.5 block text-2xl font-bold ${lowConfidenceItems > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {lowConfidenceItems}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 10. Prompt Registry Summary ────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Prompt 版本概览 Prompt Registry
        </h2>
        {promptTotal === 0 ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无 Prompt 版本记录。在内容评测或 A/B 测试结果中保存 Prompt 到版本库。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">Prompt 版本总数</span>
              <span className="mt-1.5 block text-2xl font-bold text-slate-900">{promptTotal}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">A/B 优胜数</span>
              <span className="mt-1.5 block text-2xl font-bold text-emerald-600">{promptWinners}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">平均提升</span>
              <span className={`mt-1.5 block text-2xl font-bold ${promptAvgDelta > 0 ? 'text-emerald-600' : promptAvgDelta < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {promptAvgDelta > 0 ? '+' : ''}{promptAvgDelta}
              </span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">最近版本</span>
              <div className="mt-1.5 space-y-0.5">
                {promptRecent.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  promptRecent.map((p) => (
                    <p key={p.id} className="text-[10px] font-medium text-slate-700 truncate">
                      {p.name}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 11. SOP Summary ───────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          SOP 沉淀概览 SOP Summary
        </h2>
        {sopTotal === 0 ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无自定义 SOP。完成一次评测后，可以保存 Prompt 或可迁移规则为 SOP。
            </p>
          </div>
        ) : (
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">自定义 SOP 总数</span>
              <span className="mt-1.5 block text-2xl font-bold text-slate-900">{sopTotal}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">小红书 SOP</span>
              <span className="mt-1.5 block text-2xl font-bold text-rose-500">{sopXhs}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">抖音 SOP</span>
              <span className="mt-1.5 block text-2xl font-bold text-cyan-500">{sopDy}</span>
            </div>
            <div className={statCardClass}>
              <span className="block text-xs font-medium text-slate-400">最近保存</span>
              <div className="mt-1.5 space-y-0.5">
                {sopRecent.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  sopRecent.map((s) => (
                    <p key={s.id} className="text-[11px] font-medium text-slate-700 truncate">
                      {s.name}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 12. Calibration Summary ───────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          人工校准概览 Calibration Summary
        </h2>

        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={statCardClass}>
            <span className="block text-xs font-medium text-slate-400">反馈总数</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{calStats.total}</span>
          </div>
          <div className={statCardClass}>
            <span className="block text-xs font-medium text-slate-400">判断准确</span>
            <span className="mt-1.5 block text-2xl font-bold text-emerald-600">{calStats.accurateCount}</span>
          </div>
          <div className={statCardClass}>
            <span className="block text-xs font-medium text-slate-400">Prompt 建议有用率</span>
            <span className={`mt-1.5 block text-2xl font-bold ${calStats.promptUsefulRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {calStats.promptUsefulRate}%
            </span>
          </div>
          <div className={statCardClass}>
            <span className="block text-xs font-medium text-slate-400">问题归因不准确</span>
            <span className="mt-1.5 block text-2xl font-bold text-rose-500">{calStats.badcaseWrong}</span>
          </div>
        </div>

        {calStats.total === 0 ? (
          <div className={cardClass}>
            <p className="text-xs text-slate-400">
              暂无人工校准数据。完成一次内容评测后，可以在结果区标记 AI 判断是否准确。
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Detailed stats */}
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">校准细节</h3>
              <div className="space-y-2.5">
                {[
                  { label: '判断准确', value: calStats.accurateCount, color: 'text-emerald-600' },
                  { label: '评分偏高', value: calStats.scoreTooHigh, color: 'text-amber-600' },
                  { label: '评分偏低', value: calStats.scoreTooLow, color: 'text-amber-600' },
                  { label: '问题归因不准确', value: calStats.badcaseWrong, color: 'text-rose-500' },
                  { label: 'Prompt 建议有用', value: calStats.promptUseful, color: 'text-emerald-600' },
                  { label: 'Prompt 建议无用', value: calStats.promptNotUseful, color: 'text-slate-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{label}</span>
                    <span className={`text-xs font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent calibration feedback */}
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">最近校准记录</h3>
              {recentCal.length === 0 ? (
                <p className="text-xs text-slate-400">暂无校准记录。</p>
              ) : (
                <div className="space-y-2">
                  {recentCal.map((cal) => (
                    <div
                      key={cal.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {CALIBRATION_LABEL_MAP[cal.feedbackType]}
                        </span>
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sourceBadgeColor(cal.source)}`}>
                          {sourceLabel(cal.source)}
                        </span>
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${platformBadgeColor(cal.platform)}`}>
                          {platformLabel(cal.platform)}
                        </span>
                      </div>
                      {cal.productTopic && (
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {cal.productTopic}
                        </p>
                      )}
                      {cal.note && (
                        <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                          {cal.note}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">{formatDate(cal.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
