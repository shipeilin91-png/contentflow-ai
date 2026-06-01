import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/app/data/adminConfig';
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from '@/app/lib/supabase/admin';

type TableName =
  | 'evaluation_events'
  | 'badcase_events'
  | 'calibration_feedback'
  | 'prompt_versions'
  | 'sop_templates';

type Row = Record<string, unknown>;

const PAGE_SIZE = 1000;

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

async function verifyUserFromToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { error: 'supabase_not_configured' as const };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    return { error: 'not_authenticated' as const };
  }

  return { user };
}

async function fetchAllRows(table: TableName): Promise<{ rows: Row[]; failed: boolean }> {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { rows: [], failed: true };

  const rows: Row[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await adminClient
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.warn('[ContentFlow AI] Admin analytics query failed:', table);
      return { rows, failed: true };
    }

    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, failed: false };
}

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    return Response.json({ message: '请先登录管理员账号。' }, { status: 401 });
  }

  const authResult = await verifyUserFromToken(token);
  if ('error' in authResult) {
    const status = authResult.error === 'not_authenticated' ? 401 : 500;
    return Response.json(
      {
        message:
          authResult.error === 'not_authenticated'
            ? '请先登录管理员账号。'
            : 'Supabase 尚未配置，后台数据不可用。',
      },
      { status }
    );
  }

  const email = authResult.user.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return Response.json({ message: '当前账号无后台访问权限。' }, { status: 403 });
  }

  if (!isSupabaseAdminConfigured()) {
    return Response.json(
      { message: '后台服务端密钥尚未配置。' },
      { status: 500 }
    );
  }

  const warnings: string[] = [];
  const [evaluationsResult, badcasesResult, calibrationsResult, promptsResult, sopsResult] =
    await Promise.all([
      fetchAllRows('evaluation_events'),
      fetchAllRows('badcase_events'),
      fetchAllRows('calibration_feedback'),
      fetchAllRows('prompt_versions'),
      fetchAllRows('sop_templates'),
    ]);

  const tableResults: Array<{ name: TableName; failed: boolean }> = [
    { name: 'evaluation_events', failed: evaluationsResult.failed },
    { name: 'badcase_events', failed: badcasesResult.failed },
    { name: 'calibration_feedback', failed: calibrationsResult.failed },
    { name: 'prompt_versions', failed: promptsResult.failed },
    { name: 'sop_templates', failed: sopsResult.failed },
  ];
  tableResults.forEach((result) => {
    if (result.failed) warnings.push(`${result.name} 查询失败，已跳过该模块数据。`);
  });

  const evaluations = evaluationsResult.rows;
  const badcases = badcasesResult.rows;
  const calibrations = calibrationsResult.rows;
  const prompts = promptsResult.rows;
  const sops = sopsResult.rows;

  const badcaseCounts = new Map<string, number>();
  badcases.forEach((row) => {
    const label =
      asString(row.badcase_label) ||
      asString(row.badcase_tag) ||
      '未分类问题';
    badcaseCounts.set(label, (badcaseCounts.get(label) ?? 0) + 1);
  });

  const calibrationCount = (type: string) =>
    calibrations.filter((row) => row.feedback_type === type).length;
  const promptUseful = calibrationCount('prompt_useful');
  const promptNotUseful = calibrationCount('prompt_not_useful');
  const promptUsefulRate =
    promptUseful + promptNotUseful > 0
      ? Math.round((promptUseful / (promptUseful + promptNotUseful)) * 100)
      : null;

  return Response.json({
    overview: {
      totalEvaluations: evaluations.length,
      totalBadcases: badcases.length,
      totalCalibration: calibrations.length,
      totalPromptVersions: prompts.length,
      totalSopTemplates: sops.length,
    },
    platformDistribution: {
      xiaohongshu: evaluations.filter((row) => row.platform === 'xiaohongshu').length,
      douyin: evaluations.filter((row) => row.platform === 'douyin').length,
    },
    averageScores: {
      overall: average(evaluations, 'overall_effectiveness'),
      platformFit: average(evaluations, 'platform_fit'),
      audienceFit: average(evaluations, 'audience_fit'),
      creatorGoalFit: average(evaluations, 'creator_goal_fit'),
    },
    topBadcases: Array.from(badcaseCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    calibrationStats: {
      accurate: calibrationCount('accurate'),
      scoreTooHigh: calibrationCount('score_too_high'),
      scoreTooLow: calibrationCount('score_too_low'),
      badcaseWrong: calibrationCount('badcase_wrong'),
      promptUseful,
      promptNotUseful,
      promptUsefulRate,
    },
    promptOps: {
      promptVersions: prompts.length,
      abTestPrompts: prompts.filter((row) => row.source === 'ab-test').length,
      savedAsSopPrompts: prompts.filter((row) => row.saved_as_sop === true).length,
      sopTemplates: sops.length,
    },
    recentEvaluations: evaluations.slice(0, 10).map((row, index) => ({
      id: asString(row.client_event_id) || asString(row.id) || String(index),
      createdAt: asString(row.created_at),
      source: asString(row.source) || null,
      platform: asString(row.platform) || null,
      contentGoal: asString(row.content_goal) || null,
      productTopic: asString(row.product_topic) || null,
      overallScore: asNumber(row.overall_effectiveness),
      riskLevel: asString(row.risk_level) || null,
      confidenceLevel: asString(row.confidence_level) || null,
      usedFallback: typeof row.used_fallback === 'boolean' ? row.used_fallback : null,
    })),
    dataScope: 'all_users',
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}
