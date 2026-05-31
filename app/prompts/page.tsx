'use client';

import { useState, useEffect } from 'react';
import {
  getPromptVersions,
  updatePromptVersion,
  deletePromptVersion,
} from '../utils/promptRegistryStorage';
import type { PromptVersionItem } from '../types/promptRegistry';
import { PROMPT_SOURCE_LABEL_MAP } from '../types/promptRegistry';

// ── Style tokens ────────────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const statCardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

type Filter = { platform: string; source: string; search: string };

export default function PromptsPage() {
  const [items, setItems] = useState<PromptVersionItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>({
    platform: 'all',
    source: 'all',
    search: '',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getPromptVersions());
    setLoaded(true);
  }, []);

  const refresh = () => setItems(getPromptVersions());

  const handleDelete = (id: string, name: string) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`确定删除 Prompt「${name}」吗？`)
    ) {
      deletePromptVersion(id);
      refresh();
    }
  };

  const handleToggleSop = (item: PromptVersionItem) => {
    updatePromptVersion(item.id, { savedAsSop: !item.savedAsSop });
    refresh();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback silently
    }
  };

  // ── Filtered items ─────────────────────────────────────────────
  const filtered = items.filter((item) => {
    if (filter.platform !== 'all' && item.platform !== filter.platform)
      return false;
    if (filter.source !== 'all' && item.source !== filter.source)
      return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !item.promptText.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────
  const total = items.length;
  const xhsCount = items.filter((i) => i.platform === 'xiaohongshu').length;
  const dyCount = items.filter((i) => i.platform === 'douyin').length;
  const winnerCount = items.filter(
    (i) => i.abTestResult?.winner === true
  ).length;
  const sopCount = items.filter((i) => i.savedAsSop).length;

  function platformLabel(p: 'xiaohongshu' | 'douyin') {
    return p === 'xiaohongshu' ? '小红书' : '抖音';
  }
  function platformBadgeColor(p: 'xiaohongshu' | 'douyin') {
    return p === 'xiaohongshu'
      ? 'border-rose-200 bg-rose-50 text-rose-600'
      : 'border-cyan-200 bg-cyan-50 text-cyan-600';
  }

  // ── Empty State ────────────────────────────────────────────────
  if (loaded && items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Prompt 版本库 Prompt Registry
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            记录 Prompt 的迭代来源、优化原因、关联 badcase 和评测表现，帮助团队从临时调参转向可追踪的 PromptOps
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20">
          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-slate-600">暂无 Prompt 版本记录</h3>
          <p className="mt-1 text-xs text-slate-400">
            在内容评测或 A/B 测试结果中保存 Prompt 到版本库
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Prompt 版本库 Prompt Registry
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          记录 Prompt 的迭代来源、优化原因、关联 badcase 和评测表现
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">Prompt 总数</span>
          <span className="mt-1.5 block text-2xl font-bold text-slate-900">{total}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">小红书</span>
          <span className="mt-1.5 block text-2xl font-bold text-rose-500">{xhsCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">抖音</span>
          <span className="mt-1.5 block text-2xl font-bold text-cyan-500">{dyCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">A/B 优胜</span>
          <span className="mt-1.5 block text-2xl font-bold text-emerald-600">{winnerCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">已沉淀 SOP</span>
          <span className="mt-1.5 block text-2xl font-bold text-indigo-600">{sopCount}</span>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filter.platform}
          onChange={(e) => setFilter({ ...filter, platform: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          <option value="all">全部平台</option>
          <option value="xiaohongshu">小红书</option>
          <option value="douyin">抖音</option>
        </select>

        <select
          value={filter.source}
          onChange={(e) => setFilter({ ...filter, source: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        >
          <option value="all">全部来源</option>
          <option value="evaluate">内容评测</option>
          <option value="ab-test">A/B 测试</option>
          <option value="compare">PGC 对比</option>
          <option value="manual">手动创建</option>
        </select>

        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="搜索名称或内容..."
          className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
      </div>

      {/* ── Prompt List ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className={cardClass}>
              {/* Compact row */}
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${platformBadgeColor(item.platform)}`}>
                      {platformLabel(item.platform)}
                    </span>
                    <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
                      {PROMPT_SOURCE_LABEL_MAP[item.source]}
                    </span>
                    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {item.versionLabel}
                    </span>
                    {item.savedAsSop && (
                      <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                        已沉淀 SOP
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {item.contentGoal} · {item.targetAudience || '通用'}
                    {item.productTopic ? ` · ${item.productTopic}` : ''}
                    {item.scoreSnapshot?.overallEffectiveness !== undefined && (
                      <span className="ml-2 font-medium text-slate-500">
                        评分: {item.scoreSnapshot.overallEffectiveness}
                      </span>
                    )}
                    {item.abTestResult?.improvementDelta !== undefined && (
                      <span className={`ml-2 font-medium ${item.abTestResult.improvementDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        Δ{item.abTestResult.improvementDelta > 0 ? '+' : ''}{item.abTestResult.improvementDelta}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.promptText)}
                    className="text-[10px] font-medium text-slate-400 hover:text-sky-600 transition-colors"
                    title="复制 Prompt"
                  >
                    复制
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSop(item)}
                    className={`text-[10px] font-medium transition-colors ${item.savedAsSop ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                    title={item.savedAsSop ? '取消 SOP 标记' : '标记为已沉淀 SOP'}
                  >
                    {item.savedAsSop ? 'SOP ✓' : 'SOP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* Linked badges */}
              {item.linkedBadcases && item.linkedBadcases.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  <span className="text-[10px] text-slate-400">关联问题:</span>
                  {item.linkedBadcases.slice(0, 5).map((b, i) => (
                    <span key={i} className="inline-flex rounded border border-rose-100 bg-rose-50/50 px-1.5 py-0.5 text-[10px] text-rose-600">
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {/* Expand button */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex items-center gap-1 text-[10px] font-medium text-sky-600 hover:text-sky-700"
              >
                {isExpanded ? '收起详情' : '查看详情'}
                <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Detail */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <span className={`${sectionLabel} block mb-1.5`}>Prompt 内容</span>
                    <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-700 font-mono max-h-48 overflow-y-auto">
                      {item.promptText}
                    </pre>
                  </div>

                  {item.parentPromptText && (
                    <div>
                      <span className={`${sectionLabel} block mb-1.5`}>父版本 Prompt</span>
                      <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-500 font-mono max-h-32 overflow-y-auto">
                        {item.parentPromptText}
                      </pre>
                    </div>
                  )}

                  {item.changeReasons && item.changeReasons.length > 0 && (
                    <div>
                      <span className={`${sectionLabel} block mb-1.5`}>优化原因</span>
                      <ul className="space-y-1">
                        {item.changeReasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-sky-400" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.expectedImprovements && item.expectedImprovements.length > 0 && (
                    <div>
                      <span className={`${sectionLabel} block mb-1.5`}>预期提升</span>
                      <ul className="space-y-1">
                        {item.expectedImprovements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />{imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.notes && (
                    <div>
                      <span className={`${sectionLabel} block mb-1.5`}>备注</span>
                      <p className="text-xs text-slate-600">{item.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && items.length > 0 && (
        <div className="mt-8 text-center text-xs text-slate-400">
          没有符合条件的 Prompt 版本
        </div>
      )}
    </div>
  );
}
