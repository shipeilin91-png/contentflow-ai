'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/evaluate', label: '内容评测' },
  { href: '/ab-test', label: 'A/B 测试' },
  { href: '/compare', label: 'PGC 对比' },
  { href: '/sop', label: 'SOP 模板' },
  { href: '/dashboard', label: '质量看板' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2.5 font-semibold text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">
            CF
          </span>
          <span className="text-sm tracking-tight">ContentFlow</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
