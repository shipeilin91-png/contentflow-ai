'use client';

import { useMemo, useState } from 'react';
import {
  abTestBenchmarkCases,
  benchmarkCases,
  compareBenchmarkCases,
  evaluateBenchmarkCases,
  type AbTestBenchmarkCase,
  type BenchmarkCase,
  type CompareBenchmarkCase,
  type EvaluateBenchmarkCase,
} from '@/app/data/benchmarkCases';

type FilterKey = 'all' | 'evaluate' | 'ab-test' | 'compare' | 'xiaohongshu' | 'douyin';

const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
};

const MODULE_LABELS: Record<string, string> = {
  evaluate: '内容评测',
  'ab-test': 'A/B 测试',
  compare: 'PGC 对比',
};

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'evaluate', label: '内容评测' },
  { key: 'ab-test', label: 'A/B 测试' },
  { key: 'compare', label: 'PGC 对比' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'douyin', label: '抖音' },
];

function TextBlock({ title, subtitle, text }: { title: string; subtitle?: string; text?: string }) {
  if (!text) return null;

  return (
    <div>
      <div className="mb-1">
        <h4 className="text-xs font-semibold text-slate-800">{title}</h4>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        {text}
      </div>
    </div>
  );
}

function TagList({ items, tone = 'slate' }: { items: string[]; tone?: 'slate' | 'indigo' | 'emerald' | 'rose' }) {
  const classes = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-md px-2 py-1 text-[11px] ${classes[tone]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
      <span className="text-[11px] text-slate-400">{label}</span>
      <p className="mt-1 text-xs font-medium text-slate-700">{value}</p>
    </div>
  );
}

function EvaluateDetails({ item }: { item: EvaluateBenchmarkCase }) {
  return (
    <div className="space-y-4">
      <DetailRow label="目标受众 Target Audience" value={item.targetAudience} />
      <TextBlock title="原始 Prompt" subtitle="Original Prompt" text={item.originalPrompt} />
      <TextBlock title="AI 生成内容" subtitle="AI Content" text={item.aiContent} />
      <TextBlock title="PGC 标杆内容" subtitle="PGC Reference" text={item.pgcReference} />
      <div className="grid gap-3 md:grid-cols-3">
        <DetailRow label="预期评分区间" value={item.expectedScoreRange} />
        <DetailRow label="预期风险等级" value={item.expectedRiskLevel ? RISK_LABELS[item.expectedRiskLevel] : '-'} />
        <DetailRow label="备注 Notes" value={item.notes} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-800">预期 Badcase</h4>
        <TagList items={item.expectedBadcases} tone="rose" />
      </div>
    </div>
  );
}

function AbTestDetails({ item }: { item: AbTestBenchmarkCase }) {
  return (
    <div className="space-y-4">
      <DetailRow label="目标受众 Target Audience" value={item.targetAudience} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-3">
          <h4 className="text-xs font-semibold text-slate-800">版本 A Prompt A</h4>
          <TextBlock title="Prompt A" text={item.promptA} />
          <TextBlock title="Content A" text={item.contentA} />
        </div>
        <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
          <h4 className="text-xs font-semibold text-indigo-800">版本 B Prompt B</h4>
          <TextBlock title="Prompt B" text={item.promptB} />
          <TextBlock title="Content B" text={item.contentB} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <span className="text-[11px] text-emerald-700">Expected Winner</span>
          <p className="mt-1 text-lg font-semibold text-emerald-700">{item.expectedWinner}</p>
        </div>
        <DetailRow label="预期评分区间" value={item.expectedScoreRange} />
        <DetailRow label="备注 Notes" value={item.notes} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-800">Expected Improvement Areas</h4>
        <TagList items={item.expectedImprovementAreas} tone="emerald" />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-800">预期 Badcase</h4>
        <TagList items={item.expectedBadcases} tone="rose" />
      </div>
    </div>
  );
}

function CompareDetails({ item }: { item: CompareBenchmarkCase }) {
  return (
    <div className="space-y-4">
      <DetailRow label="目标受众 Target Audience" value={item.targetAudience} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TextBlock title="AI Content" subtitle="AIGC content under test" text={item.aiContent} />
        <TextBlock title="PGC Reference" subtitle="Synthetic benchmark reference" text={item.pgcReference} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold text-slate-800">Expected Transferable Patterns</h4>
          <TagList items={item.expectedTransferablePatterns} tone="emerald" />
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold text-slate-800">Expected AIGC Weaknesses</h4>
          <TagList items={item.expectedAigcWeaknesses} tone="rose" />
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold text-slate-800">预期 Badcase</h4>
        <TagList items={item.expectedBadcases} tone="rose" />
      </div>
      <DetailRow label="备注 Notes" value={item.notes} />
    </div>
  );
}

function CaseDetails({ item }: { item: BenchmarkCase }) {
  if (item.module === 'evaluate') return <EvaluateDetails item={item} />;
  if (item.module === 'ab-test') return <AbTestDetails item={item} />;
  return <CompareDetails item={item} />;
}

function CaseCard({
  item,
  expanded,
  onToggle,
}: {
  item: BenchmarkCase;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} className="block w-full p-4 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            {PLATFORM_LABELS[item.platform] || item.platform}
          </span>
          <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            {MODULE_LABELS[item.module] || item.module}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {item.expectedScoreRange}
          </span>
          {item.expectedRiskLevel && (
            <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              {RISK_LABELS[item.expectedRiskLevel] || item.expectedRiskLevel}
            </span>
          )}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-1 text-xs text-slate-500">{item.contentGoal}</p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{item.productTopic}</p>
        <div className="mt-3">
          <TagList items={item.expectedBadcases} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-400">{item.id}</span>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {expanded ? '收起详情' : '查看详情'}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4">
          <CaseDetails item={item} />
        </div>
      )}
    </article>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-[11px] text-slate-400">{sublabel}</span>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

function AnalysisGuide() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Benchmark 分析报告 Benchmark Analysis</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500">
          本页面展示的是测试样例库。实际跑分结果由本地脚本生成，默认不会提交到 GitHub。运行 benchmark 后，可在
          benchmark-results/ 目录查看自动生成的数据分析报告。
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-xs font-semibold text-slate-800">运行命令 Commands</h3>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">{`npm run dev

# 另开终端，端口替换为 npm run dev 实际显示的 Local 地址
BENCHMARK_BASE_URL=http://localhost:3001 npm run benchmark`}</pre>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <h3 className="text-xs font-semibold text-indigo-900">报告位置 Report Files</h3>
          <ul className="mt-3 space-y-1.5 text-xs text-indigo-800">
            <li>benchmark-results/latest-cases.md：全部 case 输入输出详情报告</li>
            <li>benchmark-results/latest-summary.md</li>
            <li>benchmark-results/latest-analysis.md：基于全部 case 的数据分析报告</li>
            <li>benchmark-results/benchmark-analysis-data.json：结构化指标</li>
            <li>benchmark-results/latest.csv</li>
            <li>benchmark-results/latest.json</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-800">
          latest-cases.md 可查看每条样例的原始输入与 ContentFlow 输出；latest-analysis.md 中包含总体评分表现、高频 Badcase、平台差异分析、A/B 测试提升率、风险识别分析，以及可用于简历/作品集的指标候选。
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          benchmark-results/ 已被 .gitignore 排除，所以本地跑出来的 latest-analysis.md 不会自动出现在 Vercel。若需要公开展示某次分析，请手动整理到 docs/benchmark/ 或 README 中。
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        这些数据来自合成 benchmark 测试集，不代表真实用户线上数据，也不代表真实平台推荐效果或转化预测。
      </p>
    </section>
  );
}

export default function BenchmarkPage() {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filteredCases = useMemo(() => {
    return benchmarkCases.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'xiaohongshu' || activeFilter === 'douyin') return item.platform === activeFilter;
      return item.module === activeFilter;
    });
  }, [activeFilter]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Benchmark Case Library
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
          本页展示 ContentFlow 的合成 benchmark 样例库，用于本地自动化测试内容评测、A/B 测试和 PGC/AIGC 对比能力。所有样例均为平台典型场景下的合成内容，不复制真实平台原文。
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="总 case 数" sublabel="Total Cases" value={benchmarkCases.length} />
        <StatCard label="Evaluate" sublabel="Content Evaluation" value={evaluateBenchmarkCases.length} />
        <StatCard label="A/B Test" sublabel="Prompt Validation" value={abTestBenchmarkCases.length} />
        <StatCard label="Compare" sublabel="PGC/AIGC Compare" value={compareBenchmarkCases.length} />
        <StatCard label="小红书" sublabel="XiaoHongShu" value={benchmarkCases.filter((item) => item.platform === 'xiaohongshu').length} />
        <StatCard label="抖音" sublabel="Douyin" value={benchmarkCases.filter((item) => item.platform === 'douyin').length} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              setActiveFilter(filter.key);
              setExpandedCaseId(null);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'border-indigo-200 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <AnalysisGuide />

      <section className="mt-8 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Benchmark Cases</h2>
          <p className="mt-1 text-xs text-slate-500">
            当前筛选显示 {filteredCases.length} 条。点击卡片或“查看详情”展开完整输入与预期结果。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredCases.map((item) => (
            <CaseCard
              key={item.id}
              item={item}
              expanded={expandedCaseId === item.id}
              onToggle={() => setExpandedCaseId((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
