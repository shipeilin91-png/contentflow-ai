'use client';

import { useState, useEffect } from 'react';
import { sopTemplates } from '../data/sopTemplates';
import {
  getUserSopTemplates,
  deleteUserSopTemplate,
} from '../utils/sopStorage';
import type { UserSopTemplate } from '../types/sop';
import { SOP_SOURCE_LABEL_MAP } from '../types/sop';

const cardClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden';
const sectionLabel =
  'text-[10px] font-semibold text-slate-400 uppercase tracking-wider';

function platformLabel(p: 'xiaohongshu' | 'douyin') {
  return p === 'xiaohongshu' ? '小红书' : '抖音';
}
function platformBadgeColor(p: 'xiaohongshu' | 'douyin') {
  return p === 'xiaohongshu'
    ? 'border-rose-200 bg-rose-50 text-rose-600'
    : 'border-cyan-200 bg-cyan-50 text-cyan-600';
}

export default function SOPPage() {
  const [userSops, setUserSops] = useState<UserSopTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUserSops(getUserSopTemplates());
    setLoaded(true);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`确定删除 SOP「${name}」吗？`)
    ) {
      deleteUserSopTemplate(id);
      setUserSops(getUserSopTemplates());
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          SOP 模板库
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          平台感知型内容创作标准操作流程模板，覆盖小红书 &amp; 抖音主流内容场景
        </p>
      </div>

      {/* ── Built-in SOP Templates ────────────────────────────── */}
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        内置模板
      </h2>
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {sopTemplates.map((sop) => (
          <div key={sop.id} className={cardClass}>
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    sop.platform === '小红书'
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-600'
                  }`}
                >
                  {sop.platform}
                </span>
                <div className="flex gap-1">
                  {sop.suitableGoals.map((g) => (
                    <span
                      key={g}
                      className="inline-flex rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                {sop.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-400">受众:</span>{' '}
                {sop.targetAudience}
              </p>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-5">
              <div>
                <h3 className={`${sectionLabel} mb-2`}>内容结构</h3>
                <ol className="space-y-1.5">
                  {sop.contentStructure.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-600"
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-medium text-slate-500">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className={`${sectionLabel} mb-2`}>Prompt 模板</h3>
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-700 font-mono max-h-48 overflow-y-auto">
                  {sop.promptTemplate}
                </pre>
              </div>

              <div>
                <h3 className={`${sectionLabel} mb-2`}>常见问题</h3>
                <ul className="space-y-1.5">
                  {sop.commonBadcases.map((bc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-rose-600/80 bg-rose-50/50 rounded-lg px-3 py-2"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-[10px]">⚠</span>
                      {bc}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className={`${sectionLabel} mb-2`}>评测标准 Rubric</h3>
                <div className="space-y-2">
                  {sop.evaluationRubric.map((rubric, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                    >
                      <span className="text-xs font-semibold text-slate-700">
                        {rubric.category}
                      </span>
                      <ul className="mt-1.5 space-y-1">
                        {rubric.criteria.map((c, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-1.5 text-[11px] text-slate-500"
                          >
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-300" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── My SOP Templates ──────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        我的 SOP 模板 My SOP Templates
        {loaded && userSops.length > 0 && (
          <span className="text-xs font-normal text-slate-400">
            ({userSops.length})
          </span>
        )}
      </h2>

      {loaded && userSops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-xs text-slate-400">
            暂无自定义 SOP。你可以在内容评测、A/B 测试或 PGC 对比结果中点击「保存为 SOP」。
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {userSops.map((sop) => (
            <div key={sop.id} className={`${cardClass} border-indigo-200`}>
              {/* Header */}
              <div className="border-b border-slate-100 bg-indigo-50/30 px-5 py-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${platformBadgeColor(sop.platform)}`}
                    >
                      {platformLabel(sop.platform)}
                    </span>
                    <span className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
                      {SOP_SOURCE_LABEL_MAP[sop.source]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(sop.id, sop.name)}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  {sop.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-400">受众:</span>{' '}
                  {sop.targetAudience}
                  {sop.productTopic && (
                    <>
                      {' '}
                      · <span className="font-medium text-slate-400">产品:</span>{' '}
                      {sop.productTopic}
                    </>
                  )}
                </p>
                {sop.notes && (
                  <p className="mt-1 text-[10px] text-slate-400 italic">
                    {sop.notes}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-5">
                {/* Content Structure */}
                <div>
                  <h3 className={`${sectionLabel} mb-2`}>内容结构</h3>
                  <ol className="space-y-1.5">
                    {sop.structure.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-600"
                      >
                        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-medium text-slate-500">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Prompt Template */}
                <div>
                  <h3 className={`${sectionLabel} mb-2`}>Prompt 模板</h3>
                  <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-700 font-mono max-h-48 overflow-y-auto">
                    {sop.promptTemplate}
                  </pre>
                </div>

                {/* Common Badcases */}
                {sop.commonBadcases.length > 0 && (
                  <div>
                    <h3 className={`${sectionLabel} mb-2`}>常见问题</h3>
                    <ul className="space-y-1.5">
                      {sop.commonBadcases.map((bc, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-rose-600/80 bg-rose-50/50 rounded-lg px-3 py-2"
                        >
                          <span className="mt-0.5 flex-shrink-0 text-[10px]">⚠</span>
                          {bc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rubric Focus */}
                {sop.rubricFocus.length > 0 && (
                  <div>
                    <h3 className={`${sectionLabel} mb-2`}>评测重点</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sop.rubricFocus.map((rf, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-1 text-[10px] text-indigo-600"
                        >
                          {rf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
