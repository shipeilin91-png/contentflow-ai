'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/app/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase 环境变量未配置，本地仍可免费使用全部功能。');
      return;
    }

    setLoading(true);
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/evaluate` : undefined;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);

    if (signInError) {
      setError('登录邮件发送失败，请稍后重试或检查邮箱地址。');
      return;
    }

    setMessage('已发送登录链接，请检查邮箱并点击链接完成登录。');
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/evaluate" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          返回内容评测
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          登录 / 保存云端数据
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          登录不是使用门槛，只用于保存评测历史、Prompt 和 SOP。ContentFlow 当前阶段完全免费，未登录也可以完整使用全部评测功能。
        </p>

        {!configured ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            Supabase 环境变量未配置。本地仍可免费使用全部功能；配置
            <span className="mx-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</span>
            和
            <span className="mx-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            后即可启用登录与云端同步。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                邮箱
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送 Magic Link'}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
