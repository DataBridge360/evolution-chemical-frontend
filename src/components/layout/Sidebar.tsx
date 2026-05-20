'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';

type IconName = 'dashboard' | 'chromatography' | 'samples' | 'results' | 'companies' | 'users';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Cromatografía', href: '/cromatografia', icon: 'chromatography', role: 'owner' },
  { name: 'Muestras', href: '/muestras', icon: 'samples' },
  { name: 'Análisis', href: '/analisis', icon: 'results' },
  { name: 'Empresas', href: '/empresas', icon: 'companies' },
  { name: 'Usuarios', href: '/usuarios', icon: 'users' },
] satisfies Array<{ name: string; href: string; icon: IconName; role?: string }>;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-2 border-r border-blue-200 bg-white px-3 py-6 text-[#191c1e] shadow-md [font-family:'Hanken_Grotesk',sans-serif]">
      <div className="mb-12 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d4ed8] via-[#0ea5e9] to-[#67e8f9] text-sm font-bold text-white shadow-sm shadow-blue-200">
          EL
        </div>
        <div>
          <h1 className="text-[18px] font-semibold leading-6 text-[#1d4ed8]">Evolution Lab</h1>
          <p className="text-xs font-normal leading-4 text-slate-500">Management Portal</p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-[10px] text-sm transition-all duration-200',
                isActive
                  ? 'scale-[0.98] bg-gradient-to-r from-[#1d4ed8] to-[#0ea5e9] font-bold text-white shadow-sm shadow-blue-200'
                  : 'font-medium text-slate-600 hover:bg-blue-50 hover:text-[#1d4ed8]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <SidebarIcon name={item.icon} className="h-6 w-6 shrink-0" />
              <span className="leading-5 tracking-[0.01em]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarIcon({ name, className }: { name: IconName; className?: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 13h7V4H4v9zm9 7h7V4h-7v16zM4 20h7v-5H4v5z"
          />
        </svg>
      );
    case 'chromatography':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v5.3a4 4 0 01-.72 2.29l-3.05 4.35A4 4 0 008.5 21h7a4 4 0 003.27-6.06l-3.05-4.35A4 4 0 0115 8.3V3M8 3h8M7.6 15h8.8"
          />
        </svg>
      );
    case 'samples':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 4h4m-2 0v5m-4 4h8m-9.5 7h11a2 2 0 001.82-2.83L15 9H9l-4.32 8.17A2 2 0 006.5 20z"
          />
        </svg>
      );
    case 'results':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 19V5m4 14v-6m4 6V8m4 11v-9m4 9V4M4 19h16"
          />
        </svg>
      );
    case 'companies':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 21h16M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1"
          />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11a4 4 0 10-8 0 4 4 0 008 0zm-9 9a7 7 0 0110 0m1-8a3 3 0 012.5 4.65M3.5 16.65A3 3 0 016 12"
          />
        </svg>
      );
  }
}
