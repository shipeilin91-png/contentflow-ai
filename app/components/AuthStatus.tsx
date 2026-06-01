'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';
import { ADMIN_EMAILS } from '@/app/data/adminConfig';

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
        登录状态...
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex flex-shrink-0 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
      >
        登录 / 保存云端数据
      </Link>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {user.email && ADMIN_EMAILS.includes(user.email) && (
        <Link
          href="/admin"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Admin
        </Link>
      )}
      <span className="hidden max-w-[160px] truncate text-xs font-medium text-slate-600 md:inline">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        退出登录
      </button>
    </div>
  );
}
