import { sopTemplates } from '../data/sopTemplates';

const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden';
const sectionLabel = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider';

export default function SOPPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          SOP 模板库
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          平台感知型内容创作标准操作流程模板，覆盖小红书 &amp; 抖音主流内容场景
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              {/* Content Structure */}
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

              {/* Prompt Template */}
              <div>
                <h3 className={`${sectionLabel} mb-2`}>Prompt 模板</h3>
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-700 font-mono max-h-48 overflow-y-auto">
                  {sop.promptTemplate}
                </pre>
              </div>

              {/* Common Badcases */}
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

              {/* Evaluation Rubric */}
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
    </div>
  );
}
