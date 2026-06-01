'use client';

import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';

type UsageSkippedReason = 'not_authenticated' | 'supabase_not_configured';

export type UsageTrackingResult =
  | { success: true }
  | { success: false; error: 'write_failed' }
  | { skipped: true; reason: UsageSkippedReason };

export interface UsageEventPayload {
  eventName: string;
  pagePath?: string;
  platform?: string;
  source?: string;
  contentGoal?: string;
  productTopic?: string;
  metadata?: Record<string, unknown>;
}

export async function trackUsageEvent(
  payload: UsageEventPayload
): Promise<UsageTrackingResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { skipped: true, reason: 'supabase_not_configured' };
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return { skipped: true, reason: 'supabase_not_configured' };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { skipped: true, reason: 'not_authenticated' };
    }

    const { error } = await supabase.from('usage_events').insert({
      user_id: user.id,
      event_name: payload.eventName,
      page_path: payload.pagePath,
      platform: payload.platform,
      source: payload.source,
      content_goal: payload.contentGoal,
      product_topic: payload.productTopic,
      metadata: payload.metadata,
    });

    if (error) {
      console.warn('[ContentFlow AI] Usage event tracking failed:', payload.eventName);
      return { success: false, error: 'write_failed' };
    }

    return { success: true };
  } catch {
    console.warn('[ContentFlow AI] Usage event tracking skipped after an unexpected error');
    return { success: false, error: 'write_failed' };
  }
}
