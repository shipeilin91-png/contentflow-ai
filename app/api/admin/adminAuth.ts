import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/app/data/adminConfig';

export async function verifyAdminRequest(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    return {
      ok: false as const,
      response: Response.json({ message: '请先登录管理员账号。' }, { status: 401 }),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      ok: false as const,
      response: Response.json(
        { message: 'Supabase 尚未配置，后台数据不可用。' },
        { status: 500 }
      ),
    };
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
    return {
      ok: false as const,
      response: Response.json({ message: '请先登录管理员账号。' }, { status: 401 }),
    };
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return {
      ok: false as const,
      response: Response.json({ message: '当前账号无后台访问权限。' }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
