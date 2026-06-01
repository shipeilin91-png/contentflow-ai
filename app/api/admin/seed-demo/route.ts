import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from '@/app/lib/supabase/admin';
import { verifyAdminRequest } from '../adminAuth';

type Platform = 'xiaohongshu' | 'douyin';

const DEMO_TOPICS = [
  '敏感肌通勤防晒霜',
  '高客单价抗老精华',
  '家用卧室投影仪',
  '居家减脂训练课',
  '学生党蓝牙耳机',
  '自律学习博主内容',
];

const SCORES = [35, 48, 62, 76, 82, 55];
const PLATFORMS: Platform[] = ['xiaohongshu', 'xiaohongshu', 'xiaohongshu', 'douyin', 'douyin', 'douyin'];
const SOURCES = ['evaluate', 'batch', 'ab-test', 'compare', 'evaluate', 'batch'];
const GOALS = ['种草', '转化', '搜索沉淀', '涨粉', '种草', '涨粉'];
const RISKS = ['high', 'medium', 'low', 'medium', 'low', 'high'];
const CONFIDENCE = ['low', 'medium', 'high', 'medium', 'high', 'low'];
const AGREEMENT = ['low', 'medium', 'high', 'medium', 'high', 'low'];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function buildEvaluationRows(userId: string) {
  return DEMO_TOPICS.map((topic, index) => {
    const score = SCORES[index];
    return {
      user_id: userId,
      client_event_id: `demo-eval-${userId}-${index + 1}`,
      source: SOURCES[index],
      platform: PLATFORMS[index],
      content_goal: GOALS[index],
      product_topic: `[DEMO] ${topic}`,
      target_audience: index < 3 ? '25-35 岁内容运营用户' : '18-30 岁短视频消费用户',
      overall_effectiveness: score,
      platform_fit: Math.min(100, score + 4),
      audience_fit: Math.max(0, score - 3),
      creator_goal_fit: Math.min(100, score + 1),
      badcase_count: index % 2 === 0 ? 2 : 1,
      badcase_types: ['[DEMO] 搜索意图缺失', '[DEMO] 真实体验不足'],
      confidence_level: CONFIDENCE[index],
      risk_level: RISKS[index],
      review_required: RISKS[index] === 'high',
      judge_agreement_level: AGREEMENT[index],
      judge_review_required: AGREEMENT[index] === 'low',
      used_fallback: index === 1 || index === 5,
      raw_result: { demo: true, phase: '4-5', topic },
      original_prompt: `[DEMO] 为${topic}生成平台内容`,
      ai_content: `[DEMO] ${topic} 的 AI 生成内容样例`,
      pgc_reference: index === 3 ? '[DEMO] PGC 标杆内容样例' : null,
      created_at: daysAgo(index),
    };
  });
}

const BADCASES = [
  ['搜索意图缺失', 'platform', 'search_intent_missing'],
  ['真实体验不足', 'audience', 'weak_real_experience'],
  ['收藏价值不足', 'platform', 'low_save_value'],
  ['硬广感过强', 'creator', 'hard_sell'],
  ['前三秒 Hook 弱', 'platform', 'weak_hook'],
  ['完播动机不足', 'platform', 'weak_completion_motive'],
  ['镜头感不足', 'creator', 'weak_visual_script'],
  ['互动触发弱', 'audience', 'weak_interaction_trigger'],
  ['夸大宣传', 'creator', 'exaggerated_promotion'],
  ['输入信息不足', 'audience', 'low_context_confidence'],
] as const;

function buildBadcaseRows(userId: string) {
  return BADCASES.map(([label, layer, type], index) => ({
    user_id: userId,
    evaluation_client_event_id: `demo-eval-${userId}-${(index % DEMO_TOPICS.length) + 1}`,
    badcase_index: index,
    platform: index < 4 ? 'xiaohongshu' : 'douyin',
    content_goal: GOALS[index % GOALS.length],
    product_topic: `[DEMO] ${DEMO_TOPICS[index % DEMO_TOPICS.length]}`,
    target_audience: '[DEMO] 内容运营演示受众',
    layer,
    type,
    badcase_label: `[DEMO] ${label}`,
    evidence: `[DEMO] 原文证据：这里展示“${label}”的样例证据。`,
    fix: `[DEMO] 修复建议：针对“${label}”补充更具体的平台信号和用户信任信息。`,
    raw_badcase: { demo: true, label },
    created_at: daysAgo(index),
  }));
}

function buildCalibrationRows(userId: string) {
  const types = [
    'accurate',
    'score_too_high',
    'score_too_low',
    'badcase_wrong',
    'prompt_useful',
    'prompt_not_useful',
  ];

  return types.map((feedbackType, index) => ({
    user_id: userId,
    client_feedback_id: `demo-calibration-${userId}-${index + 1}`,
    source: index % 2 === 0 ? 'evaluate' : 'ab-test',
    platform: PLATFORMS[index],
    product_topic: `[DEMO] ${DEMO_TOPICS[index]}`,
    target_audience: '[DEMO] 校准演示受众',
    feedback_type: feedbackType,
    note: `[DEMO] 人工校准反馈样例：${feedbackType}`,
    related_badcase_label: `[DEMO] ${BADCASES[index][0]}`,
    created_at: daysAgo(index),
    raw_feedback: { demo: true, feedbackType },
  }));
}

function buildPromptRows(userId: string) {
  return [
    {
      source: 'evaluate',
      name: '[DEMO] 小红书防晒 Prompt v2',
      platform: 'xiaohongshu',
      version_label: 'v2',
      saved_as_sop: false,
    },
    {
      source: 'ab-test',
      name: '[DEMO] 抖音反差 Hook 优胜 Prompt',
      platform: 'douyin',
      version_label: 'winner',
      saved_as_sop: true,
    },
    {
      source: 'compare',
      name: '[DEMO] PGC 结构迁移 Strategy Prompt',
      platform: 'xiaohongshu',
      version_label: 'strategy',
      saved_as_sop: false,
    },
    {
      source: 'evaluate',
      name: '[DEMO] 高客单价信任建立 Prompt',
      platform: 'xiaohongshu',
      version_label: 'v2',
      saved_as_sop: true,
    },
  ].map((item, index) => ({
    user_id: userId,
    client_prompt_id: `demo-prompt-${userId}-${index + 1}`,
    source: item.source,
    name: item.name,
    platform: item.platform,
    content_goal: GOALS[index],
    product_topic: `[DEMO] ${DEMO_TOPICS[index]}`,
    target_audience: '[DEMO] PromptOps 演示受众',
    version_label: item.version_label,
    prompt_text: `[DEMO] 优化后的 Prompt 内容样例 ${index + 1}`,
    parent_prompt_text: '[DEMO] 原始 Prompt 内容样例',
    change_reasons: ['[DEMO] 强化平台信号', '[DEMO] 补充信任证据'],
    linked_badcases: [`[DEMO] ${BADCASES[index][0]}`],
    expected_improvements: ['[DEMO] 提升内容适配度与人工复核通过率'],
    score_snapshot: { overallEffectiveness: SCORES[index] },
    saved_as_sop: item.saved_as_sop,
    notes: '[DEMO] 演示 Prompt 版本，不代表真实用户数据',
    created_at: daysAgo(index),
    raw_prompt_version: { demo: true },
  }));
}

function buildSopRows(userId: string) {
  return [
    ['小红书｜避坑种草 SOP', 'xiaohongshu', '种草'],
    ['抖音｜反差 Hook 短视频 SOP', 'douyin', '涨粉'],
    ['小红书｜高客单价信任建立 SOP', 'xiaohongshu', '转化'],
  ].map(([name, platform, goal], index) => ({
    user_id: userId,
    client_sop_id: `demo-sop-${userId}-${index + 1}`,
    source: index === 1 ? 'ab-test' : 'evaluate',
    name: `[DEMO] ${name}`,
    platform,
    content_goal: goal,
    product_topic: `[DEMO] ${DEMO_TOPICS[index]}`,
    target_audience: '[DEMO] SOP 演示受众',
    structure: ['[DEMO] 开场信号', '[DEMO] 证据展开', '[DEMO] 复核清单'],
    prompt_template: `[DEMO] ${name} Prompt Template`,
    common_badcases: [`[DEMO] ${BADCASES[index][0]}`],
    rubric_focus: ['[DEMO] 平台适配', '[DEMO] 受众信任', '[DEMO] 内容目标'],
    notes: '[DEMO] 演示 SOP 模板，不代表真实用户数据',
    created_at: daysAgo(index),
    raw_sop_template: { demo: true },
  }));
}

function buildUsageRows(userId: string) {
  const events = [
    'evaluate_run',
    'ab_test_run',
    'batch_run',
    'compare_run',
    'save_prompt',
    'save_sop',
    'calibration_submit',
    'evaluate_run',
    'save_prompt',
    'save_sop',
  ];

  return events.map((eventName, index) => ({
    user_id: userId,
    event_name: eventName,
    page_path:
      eventName === 'ab_test_run'
        ? '/ab-test'
        : eventName === 'batch_run'
          ? '/batch'
          : eventName === 'compare_run'
            ? '/compare'
            : eventName === 'save_sop'
              ? '/sop'
              : '/evaluate',
    platform: PLATFORMS[index % PLATFORMS.length],
    source: eventName.replace('_run', '').replace('save_', ''),
    content_goal: GOALS[index % GOALS.length],
    product_topic: `[DEMO] ${DEMO_TOPICS[index % DEMO_TOPICS.length]}`,
    metadata: { demo: true, eventName },
    created_at: daysAgo(index),
  }));
}

async function insertDemoRows(table: string, rows: unknown[]) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { error: true };
  const { error } = await adminClient.from(table).insert(rows);
  if (error) {
    console.warn('[ContentFlow AI] Demo seed insert failed:', table);
    return { error: true };
  }
  return { error: false };
}

export async function POST(request: Request) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.ok) return authResult.response;

  if (!isSupabaseAdminConfigured()) {
    return Response.json(
      { message: '后台服务端密钥尚未配置。' },
      { status: 500 }
    );
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return Response.json(
      { message: '后台服务端密钥尚未配置。' },
      { status: 500 }
    );
  }

  const { data: existing, error: existingError } = await adminClient
    .from('evaluation_events')
    .select('client_event_id')
    .eq('user_id', authResult.user.id)
    .filter('raw_result->>demo', 'eq', 'true')
    .limit(1);

  if (existingError) {
    console.warn('[ContentFlow AI] Demo seed precheck failed');
    return Response.json(
      { message: '演示数据检查失败，请稍后重试。' },
      { status: 500 }
    );
  }

  if (existing && existing.length > 0) {
    return Response.json({ skipped: true, message: 'Demo data already exists.' });
  }

  const userId = authResult.user.id;
  const inserts = await Promise.all([
    insertDemoRows('evaluation_events', buildEvaluationRows(userId)),
    insertDemoRows('badcase_events', buildBadcaseRows(userId)),
    insertDemoRows('calibration_feedback', buildCalibrationRows(userId)),
    insertDemoRows('prompt_versions', buildPromptRows(userId)),
    insertDemoRows('sop_templates', buildSopRows(userId)),
    insertDemoRows('usage_events', buildUsageRows(userId)),
  ]);

  if (inserts.some((result) => result.error)) {
    return Response.json(
      { message: '部分演示数据写入失败，请检查 Supabase 表结构。' },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    message: 'Demo data seeded.',
    inserted: {
      evaluationEvents: 6,
      badcaseEvents: 10,
      calibrationFeedback: 6,
      promptVersions: 4,
      sopTemplates: 3,
      usageEvents: 10,
    },
  });
}
