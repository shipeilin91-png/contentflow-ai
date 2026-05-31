'use client';

import { useState, useEffect } from 'react';
import {
  getEvalDatasetItems,
  updateEvalDatasetItem,
  deleteEvalDatasetItem,
} from '../utils/evalDatasetStorage';
import type { EvalDatasetItem, HumanLabel } from '../types/evalDataset';
import {
  USABILITY_LABEL_MAP,
  SOURCE_LABEL_MAP,
  computeAgreementRate,
} from '../types/evalDataset';

// ── Style tokens ────────────────────────────────────────────────────
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const statCardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';
const sectionLabel = 'text-xs font-medium text-slate-400 uppercase tracking-wider';

export default function EvalDatasetPage() {
  const [items, setItems] = useState<EvalDatasetItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Editing form state
  const [editUsability, setEditUsability] = useState<HumanLabel['usability']>('usable');
  const [editScore, setEditScore] = useState('');
  const [editBadcaseLabels, setEditBadcaseLabels] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    setItems(getEvalDatasetItems());
    setLoaded(true);
  }, []);

  const refresh = () => setItems(getEvalDatasetItems());

  const startEdit = (item: EvalDatasetItem) => {
    setEditingId(item.id);
    setEditUsability(item.humanLabel?.usability || 'usable');
    setEditScore(
      item.humanLabel?.humanScore !== undefined
        ? String(item.humanLabel.humanScore)
        : ''
    );
    setEditBadcaseLabels(
      (item.humanLabel?.expectedBadcaseLabels || []).join(', ')
    );
    setEditNote(item.humanLabel?.note || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const scoreNum = editScore.trim() ? parseInt(editScore, 10) : undefined;
    const labels = editBadcaseLabels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateEvalDatasetItem(id, {
      humanLabel: {
        usability: editUsability,
        humanScore: scoreNum !== undefined && !isNaN(scoreNum) ? scoreNum : undefined,
        expectedBadcaseLabels: labels.length > 0 ? labels : undefined,
        note: editNote.trim() || undefined,
      },
    });
    setEditingId(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm('确定删除该评测集样本吗？')
    ) {
      deleteEvalDatasetItem(id);
      refresh();
    }
  };

  // ── Computed ───────────────────────────────────────────────────
  const total = items.length;
  const annotated = items.filter((d) => d.humanLabel?.usability).length;
  const usableCount = items.filter(
    (d) => d.humanLabel?.usability === 'usable'
  ).length;
  const needsRevisionCount = items.filter(
    (d) => d.humanLabel?.usability === 'needs_revision'
  ).length;
  const unusableCount = items.filter(
    (d) => d.humanLabel?.usability === 'unusable'
  ).length;
  const agreement = computeAgreementRate(items);

  function scoreColor(score: number) {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  }

  function platformLabel(p: 'xiaohongshu' | 'douyin') {
    return p === 'xiaohongshu' ? '小红书' : '抖音';
  }

  function usabilityColor(u: HumanLabel['usability']) {
    switch (u) {
      case 'usable':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'needs_revision':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'unusable':
        return 'border-red-200 bg-red-50 text-red-600';
    }
  }

  // ── Empty State ────────────────────────────────────────────────
  if (loaded && items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            评测集管理 Eval Dataset
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            沉淀可复用的内容评测样本，记录 AI 判断与人工标签，用于验证 LLM-as-a-Judge 的稳定性
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20">
          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-slate-600">暂无评测集样本</h3>
          <p className="mt-1 text-xs text-slate-400">
            在内容评测或批量评测结果中点击「加入评测集」
          </p>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          评测集管理 Eval Dataset
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          沉淀可复用的内容评测样本，记录 AI 判断与人工标签，用于验证 LLM-as-a-Judge 的稳定性
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">样本总数</span>
          <span className="mt-1.5 block text-2xl font-bold text-slate-900">{total}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">已标注</span>
          <span className="mt-1.5 block text-2xl font-bold text-indigo-600">{annotated}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">可用</span>
          <span className="mt-1.5 block text-2xl font-bold text-emerald-600">{usableCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">需修改</span>
          <span className="mt-1.5 block text-2xl font-bold text-amber-600">{needsRevisionCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">不可用</span>
          <span className="mt-1.5 block text-2xl font-bold text-red-500">{unusableCount}</span>
        </div>
        <div className={statCardClass}>
          <span className="block text-xs font-medium text-slate-400">AI/人工一致率</span>
          <span className={`mt-1.5 block text-2xl font-bold ${agreement.rate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {agreement.total > 0 ? `${agreement.rate}%` : '—'}
          </span>
        </div>
      </div>

      {/* ── Sample List ────────────────────────────────────────── */}
      <div className="space-y-3">
        {items.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} className={cardClass}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {platformLabel(item.platform)}
                  </span>
                  <span className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600">
                    {SOURCE_LABEL_MAP[item.source]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.contentGoal} · {item.productTopic || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {item.aiScores && (
                    <span className={`text-sm font-bold ${scoreColor(item.aiScores.overallEffectiveness)}`}>
                      {item.aiScores.overallEffectiveness}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* Content preview */}
              <p className="text-xs text-slate-600 line-clamp-3 mb-3">
                {item.content.slice(0, 300)}
                {item.content.length > 300 ? '…' : ''}
              </p>

              {/* AI info row */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mb-3">
                {item.prompt && (
                  <span>Prompt: {item.prompt.slice(0, 80)}…</span>
                )}
                {item.targetAudience && (
                  <span>受众: {item.targetAudience}</span>
                )}
                {item.aiBadcaseLabels && item.aiBadcaseLabels.length > 0 && (
                  <span>AI 标签: {item.aiBadcaseLabels.join(', ')}</span>
                )}
              </div>

              {/* Human label section */}
              {!isEditing && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.humanLabel?.usability ? (
                      <>
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${usabilityColor(item.humanLabel.usability)}`}>
                          {USABILITY_LABEL_MAP[item.humanLabel.usability]}
                        </span>
                        {item.humanLabel.humanScore !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            人工评分: {item.humanLabel.humanScore}
                          </span>
                        )}
                        {item.humanLabel.note && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {item.humanLabel.note}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400">未标注</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {item.humanLabel?.usability ? '编辑标签' : '添加人工标签'}
                  </button>
                </div>
              )}

              {/* Edit form */}
              {isEditing && (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div>
                    <label className={`${sectionLabel} block mb-1.5`}>可用性</label>
                    <select
                      value={editUsability}
                      onChange={(e) => setEditUsability(e.target.value as HumanLabel['usability'])}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    >
                      <option value="usable">可用</option>
                      <option value="needs_revision">需要修改</option>
                      <option value="unusable">不可用</option>
                    </select>
                  </div>

                  <div>
                    <label className={`${sectionLabel} block mb-1.5`}>人工评分 (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editScore}
                      onChange={(e) => setEditScore(e.target.value)}
                      placeholder="0-100"
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div>
                    <label className={`${sectionLabel} block mb-1.5`}>期望 Badcase 标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={editBadcaseLabels}
                      onChange={(e) => setEditBadcaseLabels(e.target.value)}
                      placeholder="搜索意图缺失, 真实体验不足"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div>
                    <label className={`${sectionLabel} block mb-1.5`}>备注</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="补充说明..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-4 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      保存人工标签
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
