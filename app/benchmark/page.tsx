import {
  abTestBenchmarkCases,
  compareBenchmarkCases,
  evaluateBenchmarkCases,
  type BenchmarkCase,
} from '@/app/data/benchmarkCases';

const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
};

function CaseCard({ item }: { item: BenchmarkCase }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
          {PLATFORM_LABELS[item.platform] || item.platform}
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {item.expectedScoreRange}
        </span>
        {item.expectedRiskLevel && (
          <span className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {item.expectedRiskLevel} risk
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{item.contentGoal}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{item.productTopic}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.expectedBadcases.map((badcase) => (
          <span key={badcase} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
            {badcase}
          </span>
        ))}
      </div>
    </article>
  );
}

function Section({
  title,
  subtitle,
  cases,
}: {
  title: string;
  subtitle: string;
  cases: BenchmarkCase[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cases.map((item) => (
          <CaseCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function BenchmarkPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Benchmark Case Library
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
          本页展示 ContentFlow 的合成 benchmark 样例库，用于本地自动化测试内容评测、A/B 测试和 PGC/AIGC 对比能力。所有样例均为平台典型场景下的合成内容，不复制真实平台原文。
        </p>
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
          本地运行：<code className="font-mono">BENCHMARK_BASE_URL=http://localhost:3001 npm run benchmark</code>
        </div>
      </div>

      <div className="space-y-8">
        <Section
          title="内容评测 Evaluate"
          subtitle="单条 AIGC 内容质量、Badcase、风险和 Prompt v2 验证样例"
          cases={evaluateBenchmarkCases}
        />
        <Section
          title="A/B 测试 Ab Test"
          subtitle="Prompt A / Prompt B 双跑，验证 Prompt v2 是否更适配平台机制"
          cases={abTestBenchmarkCases}
        />
        <Section
          title="PGC/AIGC 对比 Compare"
          subtitle="合成 PGC 标杆与 AIGC 内容差距分析样例"
          cases={compareBenchmarkCases}
        />
      </div>
    </main>
  );
}
