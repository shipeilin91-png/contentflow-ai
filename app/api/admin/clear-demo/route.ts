import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from '@/app/lib/supabase/admin';
import { verifyAdminRequest } from '../adminAuth';

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

  const userId = authResult.user.id;
  const deletes = await Promise.all([
    adminClient
      .from('badcase_events')
      .delete()
      .eq('user_id', userId)
      .or('evidence.ilike.%[DEMO]%,fix.ilike.%[DEMO]%,badcase_label.ilike.%[DEMO]%'),
    adminClient
      .from('calibration_feedback')
      .delete()
      .eq('user_id', userId)
      .ilike('note', '%[DEMO]%'),
    adminClient
      .from('prompt_versions')
      .delete()
      .eq('user_id', userId)
      .or('notes.ilike.%[DEMO]%,name.ilike.%[DEMO]%'),
    adminClient
      .from('sop_templates')
      .delete()
      .eq('user_id', userId)
      .or('notes.ilike.%[DEMO]%,name.ilike.%[DEMO]%'),
    adminClient
      .from('usage_events')
      .delete()
      .eq('user_id', userId)
      .filter('metadata->>demo', 'eq', 'true'),
    adminClient
      .from('evaluation_events')
      .delete()
      .eq('user_id', userId)
      .filter('raw_result->>demo', 'eq', 'true'),
  ]);

  if (deletes.some((result) => result.error)) {
    console.warn('[ContentFlow AI] Demo clear failed');
    return Response.json(
      { message: '部分演示数据清理失败，请稍后重试。' },
      { status: 500 }
    );
  }

  return Response.json({ success: true, message: 'Demo data cleared.' });
}
