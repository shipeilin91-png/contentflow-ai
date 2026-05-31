import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            MVP 原型 · DeepSeek 驱动
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            ContentFlow AI
          </h1>
          <p className="mt-3 text-lg font-medium text-indigo-600">
            平台感知型 AIGC 内容策略评测与优化平台
          </p>
          <p className="mt-4 max-w-xl mx-auto text-base leading-relaxed text-slate-500">
            帮助内容团队判断 AI 生成内容是否适合目标平台、目标受众和创作者目标，
            并将评测结果转化为 Prompt 优化建议、A/B 验证和可复用 SOP。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/evaluate"
              className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              开始内容评测
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              查看质量看板
            </Link>
          </div>
        </div>
      </section>

      {/* ── Workflow ──────────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-slate-900">
              核心工作流
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              从内容评测到策略沉淀的完整闭环
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { step: '01', label: '受众画像', href: '/evaluate', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { step: '02', label: 'TriFlow 评测', href: '/evaluate', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { step: '03', label: '问题归因', href: '/evaluate', color: 'bg-red-50 text-red-700 border-red-200' },
              { step: '04', label: 'Prompt 优化', href: '/ab-test', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { step: '05', label: 'A/B 验证', href: '/ab-test', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { step: '06', label: 'SOP 沉淀', href: '/sop', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            ].map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className={`rounded-xl border ${item.color} p-4 text-center transition-all hover:shadow-sm hover:-translate-y-0.5`}
              >
                <span className="block text-2xl font-bold mb-1">{item.step}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Capabilities ─────────────────────────────────── */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-slate-900">
              核心能力
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              三层智能驱动平台化内容评测
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Platform Intelligence */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                平台智能 Platform Intelligence
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                根据小红书/抖音不同平台机制切换评测标准，识别搜索种草与推荐流短视频的场景差异，
                确保 AI 生成内容符合平台分发逻辑。
              </p>
            </div>

            {/* Audience Intelligence */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                受众智能 Audience Intelligence
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                构建精准受众画像，识别目标受众的用户意图、心理需求、信任障碍
                和内容偏好，让内容真正触达人心。
              </p>
            </div>

            {/* Creator Goal Intelligence */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                创作者目标智能 Creator Goal Intelligence
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                对齐创作目标——种草、转化、涨粉、搜索沉淀——
                判断内容是否真正服务于业务目标，不再为了做内容而做内容。
              </p>
            </div>
          </div>

          {/* TriFlow Framework */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">
              TriFlow 三方评测框架
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              平台-受众-创作者三维内容质量评估模型
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <h4 className="text-xs font-semibold text-emerald-800">
                  平台适配 Platform Fit
                </h4>
                <p className="mt-1.5 text-[11px] text-emerald-700/70 leading-relaxed">
                  内容格式、搜索可发现性和推荐系统兼容性。小红书需要搜索优化；
                  抖音需要钩子驱动的停留和完播。
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <h4 className="text-xs font-semibold text-blue-800">
                  受众适配 Audience Fit
                </h4>
                <p className="mt-1.5 text-[11px] text-blue-700/70 leading-relaxed">
                  心理需求匹配度、信任信号完整度、内容偏好契合度。
                  内容是否建立了真实的决策信心？
                </p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
                <h4 className="text-xs font-semibold text-purple-800">
                  创作者目标 Creator Goal Fit
                </h4>
                <p className="mt-1.5 text-[11px] text-purple-700/70 leading-relaxed">
                  内容执行与品牌目标的策略对齐。种草 → 转化 → 涨粉 → 搜索沉淀，
                  每个目标需要不同的内容策略。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
        ContentFlow AI &copy; {new Date().getFullYear()} · MVP 原型 · 平台感知型 AIGC 内容策略平台
      </footer>
    </div>
  );
}
