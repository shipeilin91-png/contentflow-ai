'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/app/data/adminConfig';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';

type TableName =
  | 'evaluation_events'
  | 'badcase_events'
  | 'calibration_feedback'
  | 'prompt_versions'
  | 'sop_templates';

type Row = Record<string, unknown>;

interface AdminData {
  evaluations: Row[];
  badcases: Row[];
  calibrations: Row[];
  prompts: Row[];
  sops: Row[];
}

const EMPTY_DATA: AdminData = {
  evaluations: [],
  badcases: [],
  calibrations: [],
  prompts: [],
  sops: [],
};

const CALIBRATION_LABELS: Record<string, string> = {
  accurate: '判断准确',
  score_too_high: '评分偏高',
  score_too_low: '评分偏低',
  badcase_wrong: '问题归因不准确',
  prompt_useful: 'Prompt 建议有用',
  prompt_not_useful: 'Prompt 建议无用',
};

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function average(rows: Row[], key: string): number | null {
  const values = rows.map((row) => asNumber(row[key])).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDate(value: unknown): string {
  const raw = asString(value);
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function platformLabel(value: unknown): string {
  const platform = asString(value);
  if (platform === 'xiaohongshu') return '小红书';
  if (platform === 'douyin') return '抖音';
  return platform || '-';
}

function riskLabel(value: unknown): string {
  const risk = asString(value);
  if (risk === 'high') return '高风险';
  if (risk === 'medium') return '中风险';
  if (risk === 'low') return '低风险';
  return risk || '-';
}

function confidenceLabel(value: unknown): string {
  const confidence = asString(value);
  if (confidence === 'high') return '高置信';
  if (confidence === 'medium') return '中置信';
  if (confidence === 'low') return '低置信';
  return confidence || '-';
}

function MetricCard({ label, sublabel, value }: { label: string; sublabel: string; value: string | number }) {
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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<AdminData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setAuthChecked(true);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getUser().then(({ data: authData }) => {
      setUser(authData.user ?? null);
      setAuthChecked(true);
    });
  }, [configured]);

  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => {
    if (!configured || !authChecked || !isAdmin) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    const loadTable = async (table: TableName, order = true) => {
      let query = supabase.from(table).select('*').limit(500);
      if (order) query = query.order('created_at', { ascending: false });
      const { data: rows, error } = await query;
      if (error) {
        console.warn('[ContentFlow AI] Admin data query failed:', table);
        return { table, rows: [] as Row[], failed: true };
      }
      return { table, rows: (rows ?? []) as Row[], failed: false };
    };

    setLoading(true);
    Promise.all([
      loadTable('evaluation_events'),
      loadTable('badcase_events'),
      loadTable('calibration_feedback'),
      loadTable('prompt_versions'),
      loadTable('sop_templates'),
    ]).then((results) => {
      if (!active) return;
      setData({
        evaluations: results.find((result) => result.table === 'evaluation_events')?.rows ?? [],
        badcases: results.find((result) => result.table === 'badcase_events')?.rows ?? [],
        calibrations: results.find((result) => result.table === 'calibration_feedback')?.rows ?? [],
        prompts: results.find((result) => result.table === 'prompt_versions')?.rows ?? [],
        sops: results.find((result) => result.table === 'sop_templates')?.rows ?? [],
      });
      setWarnings(
        results
          .filter((result) => result.failed)
          .map((result) => `${result.table} 查询失败，已跳过该模块数据。`)
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [authChecked, configured, isAdmin]);

  const stats = useMemo(() => {
    const xhsCount = data.evaluations.filter((row) => row.platform === 'xiaohongshu').length;
    const douyinCount = data.evaluations.filter((row) => row.platform === 'douyin').length;

    const badcaseCounts = new Map<string, number>();
    data.badcases.forEach((row) => {
      const label =
        asString(row.badcase_label) ||
        asString(row.badcase_tag) ||
        '未分类问题';
      badcaseCounts.set(label, (badcaseCounts.get(label) ?? 0) + 1);
    });

    const calibrationCounts = Object.keys(CALIBRATION_LABELS).reduce<Record<string, number>>(
      (acc, key) => {
        acc[key] = data.calibrations.filter((row) => row.feedback_type === key).length;
        return acc;
      },
      {}
    );
    const useful = calibrationCounts.prompt_useful ?? 0;
    const notUseful = calibrationCounts.prompt_not_useful ?? 0;
    const usefulRate = useful + notUseful > 0 ? Math.round((useful / (useful + notUseful)) * 100) : null;

    return {
      xhsCount,
      douyinCount,
      averages: {
        overall: average(data.evaluations, 'overall_effectiveness'),
        platform: average(data.evaluations, 'platform_fit'),
        audience: average(data.evaluations, 'audience_fit'),
        creator: average(data.evaluations, 'creator_goal_fit'),
      },
      topBadcases: Array.from(badcaseCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      calibrationCounts,
      usefulRate,
      abPromptCount: data.prompts.filter((row) => row.source === 'ab-test').length,
      savedAsSopPromptCount: data.prompts.filter((row) => row.saved_as_sop === true).length,
      recentEvaluations: data.evaluations.slice(0, 10),
    };
  }, [data]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">管理后台 Admin Dashboard</h1>
          <p className="mt-3 text-sm text-amber-800">Supabase 尚未配置，后台数据不可用。</p>
        </section>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          正在检查管理员登录状态...
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">管理后台 Admin Dashboard</h1>
          <p className="mt-3 text-sm text-slate-500">请先登录管理员账号查看后台数据。</p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            去登录
          </Link>
        </section>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">管理后台 Admin Dashboard</h1>
          <p className="mt-3 text-sm text-slate-500">当前账号无后台访问权限。</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          管理后台 Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          查看真实用户使用数据、AI 评测质量反馈与 Prompt/SOP 沉淀情况。
        </p>
        <p className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-700">
          当前 MVP 后台基于前端 admin 白名单与当前 RLS 策略，默认展示管理员账号可访问的数据；后续可通过 profiles.role + server-side API 升级为全量后台。
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((warning) => (
            <p key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {warning}
            </p>
          ))}
        </div>
      )}

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          正在加载后台数据...
        </section>
      ) : (
        <div className="space-y-6">
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-900">总览指标 Overview</h2>
              <p className="text-xs text-slate-400">产品侧关键数据快照</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="总评测次数" sublabel="Total Evaluations" value={data.evaluations.length} />
              <MetricCard label="Prompt 保存数" sublabel="Prompt Versions" value={data.prompts.length} />
              <MetricCard label="SOP 保存数" sublabel="SOP Templates" value={data.sops.length} />
              <MetricCard label="人工校准次数" sublabel="Calibration Feedback" value={data.calibrations.length} />
              <MetricCard label="Badcase 记录数" sublabel="Badcase Events" value={data.badcases.length} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="平台分布 Platform Distribution" subtitle="evaluation_events by platform">
              {data.evaluations.length === 0 ? (
                <EmptyState text="暂无平台分布数据。" />
              ) : (
                <div className="space-y-3">
                  {[
                    { label: '小红书', count: stats.xhsCount },
                    { label: '抖音', count: stats.douyinCount },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="text-slate-400">{item.count} 次</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${data.evaluations.length > 0 ? (item.count / data.evaluations.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="平均评分 Average Scores" subtitle="TriFlow average score snapshot">
              {data.evaluations.length === 0 ? (
                <EmptyState text="暂无评分数据。" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: '平均综合有效性', value: stats.averages.overall },
                    { label: '平均平台适配', value: stats.averages.platform },
                    { label: '平均受众适配', value: stats.averages.audience },
                    { label: '平均创作者目标适配', value: stats.averages.creator },
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
              {stats.topBadcases.length === 0 ? (
                <EmptyState text="暂无 Badcase 数据。" />
              ) : (
                <div className="space-y-2">
                  {stats.topBadcases.map((item, index) => (
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
              {data.calibrations.length === 0 ? (
                <EmptyState text="暂无人工校准数据。" />
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(CALIBRATION_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800">{stats.calibrationCounts[key] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <span className="text-[11px] text-emerald-700">Prompt Useful Rate</span>
                    <div className="mt-1 text-xl font-semibold text-emerald-700">
                      {stats.usefulRate === null ? '暂无数据' : `${stats.usefulRate}%`}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="PromptOps 沉淀 PromptOps Assets" subtitle="Prompt versions and SOP templates">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Prompt 版本总数" sublabel="Prompt Versions" value={data.prompts.length} />
              <MetricCard label="A/B 来源 Prompt 数" sublabel="From A/B Test" value={stats.abPromptCount} />
              <MetricCard label="已沉淀为 SOP 的 Prompt 数" sublabel="Saved as SOP" value={stats.savedAsSopPromptCount} />
              <MetricCard label="SOP 总数" sublabel="SOP Templates" value={data.sops.length} />
            </div>
          </SectionCard>

          <SectionCard title="最近评测记录 Recent Evaluations" subtitle="Latest 10 evaluation_events">
            {stats.recentEvaluations.length === 0 ? (
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
                    {stats.recentEvaluations.map((row, index) => (
                      <tr key={`${asString(row.client_event_id) || index}`}>
                        <td className="whitespace-nowrap px-3 py-2">{formatDate(row.created_at)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{asString(row.source) || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2">{platformLabel(row.platform)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{asString(row.content_goal) || '-'}</td>
                        <td className="max-w-[180px] truncate px-3 py-2">{asString(row.product_topic) || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                          {asNumber(row.overall_effectiveness) === null
                            ? '-'
                            : `${asNumber(row.overall_effectiveness)}/100`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{riskLabel(row.risk_level)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{confidenceLabel(row.confidence_level)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{row.used_fallback ? '是' : '否'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs leading-relaxed text-slate-500 shadow-sm">
            当前后台用于作品集 MVP 阶段的数据观察，默认基于当前 Supabase RLS 和管理员账号可访问范围展示；不用于商业结算、不预测真实平台流量、不替代合规审核。
          </p>
        </div>
      )}
    </div>
  );
}
