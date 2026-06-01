'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';

interface AdminAnalytics {
  overview: {
    totalEvaluations: number;
    totalBadcases: number;
    totalCalibration: number;
    totalPromptVersions: number;
    totalSopTemplates: number;
  };
  platformDistribution: {
    xiaohongshu: number;
    douyin: number;
  };
  averageScores: {
    overall: number | null;
    platformFit: number | null;
    audienceFit: number | null;
    creatorGoalFit: number | null;
  };
  topBadcases: {
    label: string;
    count: number;
  }[];
  calibrationStats: {
    accurate: number;
    scoreTooHigh: number;
    scoreTooLow: number;
    badcaseWrong: number;
    promptUseful: number;
    promptNotUseful: number;
    promptUsefulRate: number | null;
  };
  promptOps: {
    promptVersions: number;
    abTestPrompts: number;
    savedAsSopPrompts: number;
    sopTemplates: number;
  };
  recentEvaluations: {
    id: string;
    createdAt: string;
    source: string | null;
    platform: string | null;
    contentGoal: string | null;
    productTopic: string | null;
    overallScore: number | null;
    riskLevel: string | null;
    confidenceLevel: string | null;
    usedFallback: boolean | null;
  }[];
  usageAnalytics: {
    totalUsageEvents: number;
    eventCounts: {
      eventName: string;
      count: number;
    }[];
    recentUsageEvents: {
      id: string;
      createdAt: string;
      eventName: string;
      pagePath: string | null;
      platform: string | null;
      source: string | null;
      contentGoal: string | null;
      productTopic: string | null;
    }[];
  };
  dataScope: 'all_users';
  warnings?: string[];
}

type AdminStatus =
  | 'checking'
  | 'loading'
  | 'ready'
  | 'supabase_not_configured'
  | 'not_authenticated'
  | 'forbidden'
  | 'service_not_configured'
  | 'error';

const CALIBRATION_ITEMS = [
  { key: 'accurate', label: '判断准确' },
  { key: 'scoreTooHigh', label: '评分偏高' },
  { key: 'scoreTooLow', label: '评分偏低' },
  { key: 'badcaseWrong', label: '问题归因不准确' },
  { key: 'promptUseful', label: 'Prompt 建议有用' },
  { key: 'promptNotUseful', label: 'Prompt 建议无用' },
] as const;

const USAGE_EVENT_LABELS: Record<string, string> = {
  evaluate_run: '内容评测',
  ab_test_run: 'A/B 测试',
  batch_run: '批量评测',
  compare_run: 'PGC/AIGC 对比',
  save_prompt: '保存 Prompt',
  save_sop: '保存 SOP',
  calibration_submit: '人工校准',
};

function formatDate(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function platformLabel(value: string | null): string {
  if (value === 'xiaohongshu') return '小红书';
  if (value === 'douyin') return '抖音';
  return value || '-';
}

function riskLabel(value: string | null): string {
  if (value === 'high') return '高风险';
  if (value === 'medium') return '中风险';
  if (value === 'low') return '低风险';
  return value || '-';
}

function confidenceLabel(value: string | null): string {
  if (value === 'high') return '高置信';
  if (value === 'medium') return '中置信';
  if (value === 'low') return '低置信';
  return value || '-';
}

function MetricCard({
  label,
  sublabel,
  value,
}: {
  label: string;
  sublabel: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-[11px] font-medium text-slate-400">{sublabel}</span>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
      {text}
    </div>
  );
}

function StatusCard({
  title,
  message,
  action,
  tone = 'neutral',
}: {
  title: string;
  message: string;
  action?: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : tone === 'danger'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-slate-200 bg-white text-slate-500';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className={`rounded-2xl border p-6 shadow-sm ${toneClass}`}>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm">{message}</p>
        {action}
      </section>
    </div>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<AdminStatus>(() =>
    isSupabaseConfigured() ? 'checking' : 'supabase_not_configured'
  );
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus('supabase_not_configured');
      return;
    }
    const supabaseClient = supabase;

    let active = true;

    async function loadAnalytics() {
      setStatus('loading');

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!active) return;

      if (!session?.access_token) {
        setStatus('not_authenticated');
        return;
      }

      try {
        const response = await fetch('/api/admin/analytics', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!active) return;

        if (response.status === 401) {
          setStatus('not_authenticated');
          return;
        }

        if (response.status === 403) {
          setStatus('forbidden');
          return;
        }

        if (!response.ok) {
          setStatus(response.status === 500 ? 'service_not_configured' : 'error');
          return;
        }

        const payload = (await response.json()) as AdminAnalytics;
        setAnalytics(payload);
        setStatus('ready');
      } catch {
        if (!active) return;
        setStatus('error');
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [configured, refreshKey]);

  const callDemoTool = async (endpoint: '/api/admin/seed-demo' | '/api/admin/clear-demo') => {
    const isSeed = endpoint.includes('seed');
    const confirmed = window.confirm(
      isSeed
        ? '确认生成一组带 [DEMO] 标记的演示数据？'
        : '确认清理当前管理员账号下带 [DEMO] 标记的演示数据？'
    );
    if (!confirmed) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setDemoMessage('Supabase 尚未配置，无法执行演示工具。');
      return;
    }

    setDemoLoading(true);
    setDemoMessage('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setDemoMessage('请先登录管理员账号。');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setDemoMessage('请先登录管理员账号。');
        return;
      }
      if (response.status === 403) {
        setDemoMessage('当前账号无后台访问权限。');
        return;
      }
      if (!response.ok) {
        setDemoMessage(payload.message || '演示工具执行失败，请稍后重试。');
        return;
      }

      if (payload.skipped) {
        setDemoMessage('演示数据已存在。');
      } else {
        setDemoMessage(isSeed ? '演示数据已生成。' : '演示数据已清理。');
      }
      setRefreshKey((current) => current + 1);
    } catch {
      setDemoMessage('演示工具执行失败，请稍后重试。');
    } finally {
      setDemoLoading(false);
    }
  };

  if (status === 'supabase_not_configured') {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message="Supabase 尚未配置，后台数据不可用。"
        tone="warning"
      />
    );
  }

  if (status === 'checking' || status === 'loading') {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message={status === 'checking' ? '正在检查管理员登录状态...' : '正在加载全量后台数据...'}
      />
    );
  }

  if (status === 'not_authenticated') {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message="请先登录管理员账号查看后台数据。"
        action={
          <Link
            href="/login"
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            去登录
          </Link>
        }
      />
    );
  }

  if (status === 'forbidden') {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message="当前账号无后台访问权限。"
        tone="danger"
      />
    );
  }

  if (status === 'service_not_configured') {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message="后台服务端密钥尚未配置。"
        tone="warning"
      />
    );
  }

  if (status === 'error' || !analytics) {
    return (
      <StatusCard
        title="管理后台 Admin Dashboard"
        message="后台数据加载失败，请稍后重试。"
        tone="warning"
      />
    );
  }

  const totalPlatform =
    analytics.platformDistribution.xiaohongshu + analytics.platformDistribution.douyin;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          管理后台 Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          查看真实用户使用数据、AI 评测质量反馈与 Prompt/SOP 沉淀情况。
        </p>
        <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700">
          当前后台通过 server-side service role API 聚合全量产品数据，前端仅传递当前登录 session token 用于管理员身份校验。
        </p>
      </div>

      {analytics.warnings && analytics.warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {analytics.warnings.map((warning) => (
            <p key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <SectionCard title="管理员演示工具 Admin Demo Tools" subtitle="Demo seed data for portfolio validation">
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-slate-500">
              该功能仅用于作品集演示和本地验收，会生成带 [DEMO] 标记的样例数据，不代表真实用户行为。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => callDemoTool('/api/admin/seed-demo')}
                className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {demoLoading ? '处理中...' : '生成演示数据'}
              </button>
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => callDemoTool('/api/admin/clear-demo')}
                className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                清理演示数据
              </button>
            </div>
            {demoMessage && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {demoMessage}
              </p>
            )}
          </div>
        </SectionCard>

        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">总览指标 Overview</h2>
            <p className="text-xs text-slate-400">全量产品侧关键数据快照</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="总评测次数" sublabel="Total Evaluations" value={analytics.overview.totalEvaluations} />
            <MetricCard label="Prompt 保存数" sublabel="Prompt Versions" value={analytics.overview.totalPromptVersions} />
            <MetricCard label="SOP 保存数" sublabel="SOP Templates" value={analytics.overview.totalSopTemplates} />
            <MetricCard label="人工校准次数" sublabel="Calibration Feedback" value={analytics.overview.totalCalibration} />
            <MetricCard label="Badcase 记录数" sublabel="Badcase Events" value={analytics.overview.totalBadcases} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="平台分布 Platform Distribution" subtitle="evaluation_events by platform">
            {totalPlatform === 0 ? (
              <EmptyState text="暂无平台分布数据。" />
            ) : (
              <div className="space-y-3">
                {[
                  { label: '小红书', count: analytics.platformDistribution.xiaohongshu },
                  { label: '抖音', count: analytics.platformDistribution.douyin },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <span className="text-slate-400">{item.count} 次</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${totalPlatform > 0 ? (item.count / totalPlatform) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="平均评分 Average Scores" subtitle="TriFlow average score snapshot">
            {analytics.overview.totalEvaluations === 0 ? (
              <EmptyState text="暂无评分数据。" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: '平均综合有效性', value: analytics.averageScores.overall },
                  { label: '平均平台适配', value: analytics.averageScores.platformFit },
                  { label: '平均受众适配', value: analytics.averageScores.audienceFit },
                  { label: '平均创作者目标适配', value: analytics.averageScores.creatorGoalFit },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[11px] text-slate-400">{item.label}</span>
                    <div className="mt-1 text-xl font-semibold text-slate-900">
                      {item.value === null ? '-' : `${item.value}/100`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="高频 Badcase Top Badcases" subtitle="Top issue labels from badcase_events">
            {analytics.topBadcases.length === 0 ? (
              <EmptyState text="暂无 Badcase 数据。" />
            ) : (
              <div className="space-y-2">
                {analytics.topBadcases.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-[10px] font-semibold text-rose-600">
                        {index + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="人工校准概览 Calibration Quality" subtitle="Human feedback quality signals">
            {analytics.overview.totalCalibration === 0 ? (
              <EmptyState text="暂无人工校准数据。" />
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {CALIBRATION_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-800">{analytics.calibrationStats[item.key]}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <span className="text-[11px] text-emerald-700">Prompt Useful Rate</span>
                  <div className="mt-1 text-xl font-semibold text-emerald-700">
                    {analytics.calibrationStats.promptUsefulRate === null
                      ? '暂无数据'
                      : `${analytics.calibrationStats.promptUsefulRate}%`}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="PromptOps 沉淀 PromptOps Assets" subtitle="Prompt versions and SOP templates">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Prompt 版本总数" sublabel="Prompt Versions" value={analytics.promptOps.promptVersions} />
            <MetricCard label="A/B 来源 Prompt 数" sublabel="From A/B Test" value={analytics.promptOps.abTestPrompts} />
            <MetricCard label="已沉淀为 SOP 的 Prompt 数" sublabel="Saved as SOP" value={analytics.promptOps.savedAsSopPrompts} />
            <MetricCard label="SOP 总数" sublabel="SOP Templates" value={analytics.promptOps.sopTemplates} />
          </div>
        </SectionCard>

        <SectionCard title="用户行为分析 Usage Analytics" subtitle="Core product usage paths">
          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            记录登录用户在核心功能中的使用行为，用于观察真实产品路径，不用于额度限制或商业结算。
          </p>
          {analytics.usageAnalytics.totalUsageEvents === 0 ? (
            <EmptyState text="暂无用户行为数据。登录后完成评测、保存 Prompt/SOP 或提交人工校准后，这里会出现记录。" />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <MetricCard
                  label="总行为事件数"
                  sublabel="Total Usage Events"
                  value={analytics.usageAnalytics.totalUsageEvents}
                />
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">功能使用次数 Top Events</span>
                    <span className="text-[10px] text-slate-400">Top 10</span>
                  </div>
                  <div className="space-y-2">
                    {analytics.usageAnalytics.eventCounts.map((item) => (
                      <div key={item.eventName}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">
                            {USAGE_EVENT_LABELS[item.eventName] || item.eventName}
                            <span className="ml-1 text-[10px] font-normal text-slate-400">{item.eventName}</span>
                          </span>
                          <span className="text-slate-400">{item.count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${analytics.usageAnalytics.totalUsageEvents > 0
                                ? (item.count / analytics.usageAnalytics.totalUsageEvents) * 100
                                : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">时间</th>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">eventName</th>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">pagePath</th>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">platform</th>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">contentGoal</th>
                      <th className="whitespace-nowrap px-3 py-2 font-medium">productTopic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {analytics.usageAnalytics.recentUsageEvents.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap px-3 py-2">{formatDate(row.createdAt)}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {USAGE_EVENT_LABELS[row.eventName] || row.eventName}
                          <span className="ml-1 text-[10px] text-slate-400">{row.eventName}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{row.pagePath || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2">{platformLabel(row.platform)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{row.contentGoal || '-'}</td>
                        <td className="max-w-[180px] truncate px-3 py-2">{row.productTopic || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="最近评测记录 Recent Evaluations" subtitle="Latest 10 evaluation_events">
          {analytics.recentEvaluations.length === 0 ? (
            <EmptyState text="暂无评测记录。" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">时间</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">source</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">platform</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">content_goal</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">product_topic</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">overall_score</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">risk</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">confidence</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">fallback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {analytics.recentEvaluations.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap px-3 py-2">{formatDate(row.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{row.source || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{platformLabel(row.platform)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{row.contentGoal || '-'}</td>
                      <td className="max-w-[180px] truncate px-3 py-2">{row.productTopic || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                        {row.overallScore === null ? '-' : `${row.overallScore}/100`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{riskLabel(row.riskLevel)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{confidenceLabel(row.confidenceLevel)}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {row.usedFallback === null ? '-' : row.usedFallback ? '是' : '否'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs leading-relaxed text-slate-500 shadow-sm">
          当前后台通过 server-side service role API 聚合全量产品数据；service role key 仅存在服务端环境变量中，不会暴露给前端。后台仅用于作品集 MVP 阶段的数据观察，不用于商业结算、不预测真实平台流量、不替代合规审核。
        </p>
      </div>
    </div>
  );
}
