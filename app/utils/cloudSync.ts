'use client';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { EvaluationResult } from '@/app/data/mockResults';
import type { EvaluationHistoryItem } from '@/app/types/history';
import type { CalibrationFeedback } from '@/app/types/calibration';
import type { PromptVersionItem } from '@/app/types/promptRegistry';
import type { UserSopTemplate } from '@/app/types/sop';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';

type CloudSkippedReason = 'not_authenticated' | 'supabase_not_configured';

export type CloudSyncResult =
  | { success: true }
  | { success: false; error: 'write_failed' }
  | { skipped: true; reason: CloudSkippedReason };

type JsonRecord = Record<string, unknown>;
type AuthContext =
  | { skipped: true; reason: CloudSkippedReason }
  | { supabase: SupabaseClient; user: User };

function isSkippedContext(
  context: AuthContext
): context is { skipped: true; reason: CloudSkippedReason } {
  return 'skipped' in context;
}

export interface EvaluationCloudPayload extends EvaluationHistoryItem {
  usedFallback?: boolean;
  rawResult?: EvaluationResult;
  originalPrompt?: string;
  aiContent?: string;
  pgcReference?: string;
  badcases?: EvaluationResult['badcases'];
}

async function getAuthenticatedContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return { skipped: true as const, reason: 'supabase_not_configured' as const };
  }

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return { skipped: true as const, reason: 'supabase_not_configured' as const };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn('[ContentFlow AI] Cloud sync auth check failed');
    return { skipped: true as const, reason: 'not_authenticated' as const };
  }

  if (!user) {
    return { skipped: true as const, reason: 'not_authenticated' as const };
  }

  return { supabase, user };
}

async function insertCloudRow(table: string, row: JsonRecord): Promise<CloudSyncResult> {
  try {
    const context = await getAuthenticatedContext();
    if (isSkippedContext(context)) return context;

    const { error } = await context.supabase.from(table).insert({
      user_id: context.user.id,
      ...row,
    });

    if (error) {
      console.warn('[ContentFlow AI] Cloud sync write failed:', table);
      return { success: false, error: 'write_failed' };
    }

    return { success: true };
  } catch {
    console.warn('[ContentFlow AI] Cloud sync skipped after an unexpected write error:', table);
    return { success: false, error: 'write_failed' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const context = await getAuthenticatedContext();
    if (isSkippedContext(context)) return null;
    return context.user;
  } catch {
    return null;
  }
}

export async function saveEvaluationToCloud(
  payload: EvaluationCloudPayload
): Promise<CloudSyncResult> {
  const eventResult = await insertCloudRow('evaluation_events', {
    client_event_id: payload.id,
    source: payload.source,
    platform: payload.platform,
    content_goal: payload.contentGoal,
    product_topic: payload.productTopic,
    target_audience: payload.targetAudience,
    overall_effectiveness: payload.overallEffectiveness,
    platform_fit: payload.platformFit,
    audience_fit: payload.audienceFit,
    creator_goal_fit: payload.creatorGoalFit,
    badcase_count: payload.badcaseCount,
    badcase_types: payload.badcaseTypes,
    confidence_level: payload.confidenceLevel,
    risk_level: payload.riskLevel,
    review_required: payload.reviewRequired,
    judge_agreement_level: payload.judgeAgreementLevel,
    judge_review_required: payload.judgeReviewRequired,
    used_fallback: Boolean(payload.usedFallback),
    raw_result: payload.rawResult,
    original_prompt: payload.originalPrompt,
    ai_content: payload.aiContent,
    pgc_reference: payload.pgcReference,
    created_at: payload.createdAt,
  });

  if ('skipped' in eventResult) return eventResult;

  await Promise.all(
    (payload.badcases ?? []).map((badcase, index) =>
      insertCloudRow('badcase_events', {
        evaluation_client_event_id: payload.id,
        badcase_index: index,
        platform: payload.platform,
        content_goal: payload.contentGoal,
        product_topic: payload.productTopic,
        target_audience: payload.targetAudience,
        layer: badcase.layer,
        type: badcase.type,
        badcase_label: badcase.badcaseLabel,
        evidence: badcase.evidence,
        fix: badcase.fix,
        raw_badcase: badcase,
        created_at: payload.createdAt,
      })
    )
  );

  return eventResult;
}

export async function saveCalibrationToCloud(
  payload: CalibrationFeedback
): Promise<CloudSyncResult> {
  return insertCloudRow('calibration_feedback', {
    client_feedback_id: payload.id,
    source: payload.source,
    platform: payload.platform,
    product_topic: payload.productTopic,
    target_audience: payload.targetAudience,
    feedback_type: payload.feedbackType,
    note: payload.note,
    related_badcase_label: payload.relatedBadcaseLabel,
    related_score_type: payload.relatedScoreType,
    created_at: payload.createdAt,
    raw_feedback: payload,
  });
}

export async function savePromptVersionToCloud(
  payload: PromptVersionItem
): Promise<CloudSyncResult> {
  return insertCloudRow('prompt_versions', {
    client_prompt_id: payload.id,
    source: payload.source,
    name: payload.name,
    platform: payload.platform,
    content_goal: payload.contentGoal,
    product_topic: payload.productTopic,
    target_audience: payload.targetAudience,
    version_label: payload.versionLabel,
    prompt_text: payload.promptText,
    parent_prompt_text: payload.parentPromptText,
    change_reasons: payload.changeReasons,
    linked_badcases: payload.linkedBadcases,
    expected_improvements: payload.expectedImprovements,
    score_snapshot: payload.scoreSnapshot,
    ab_test_result: payload.abTestResult,
    saved_as_sop: payload.savedAsSop,
    notes: payload.notes,
    created_at: payload.createdAt,
    raw_prompt_version: payload,
  });
}

export async function saveSopTemplateToCloud(
  payload: UserSopTemplate
): Promise<CloudSyncResult> {
  return insertCloudRow('sop_templates', {
    client_sop_id: payload.id,
    source: payload.source,
    name: payload.name,
    platform: payload.platform,
    content_goal: payload.contentGoal,
    product_topic: payload.productTopic,
    target_audience: payload.targetAudience,
    structure: payload.structure,
    prompt_template: payload.promptTemplate,
    common_badcases: payload.commonBadcases,
    rubric_focus: payload.rubricFocus,
    notes: payload.notes,
    created_at: payload.createdAt,
    raw_sop_template: payload,
  });
}
