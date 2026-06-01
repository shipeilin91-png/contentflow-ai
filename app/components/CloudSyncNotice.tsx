'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/app/utils/cloudSync';
import { isSupabaseConfigured } from '@/app/lib/supabase/client';

export default function CloudSyncNotice() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      setLoggedIn(Boolean(user));
      setChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!checked && isSupabaseConfigured()) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 shadow-sm">
      {loggedIn
        ? '已登录，评测历史与沉淀资产将同步到云端。'
        : '当前为免费试用模式。登录后可将评测历史、Prompt 和 SOP 同步到云端。'}
    </div>
  );
}
