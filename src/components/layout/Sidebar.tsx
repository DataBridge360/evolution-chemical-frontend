'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';

type IconName = 'dashboard' | 'chromatography' | 'samples' | 'results' | 'companies';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Cromatografía', href: '/cromatografia', icon: 'chromatography', role: 'owner' },
  { name: 'Muestras', href: '/muestras', icon: 'samples' },
  { name: 'Análisis', href: '/analisis', icon: 'results' },
  { name: 'Empresas', href: '/empresas', icon: 'companies' },
] satisfies Array<{ name: string; href: string; icon: IconName; role?: string }>;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#bfc7d3] bg-white py-6 text-[#0b1c30] [font-family:Manrope,ui-sans-serif,system-ui,sans-serif]">
      <div className="mb-10 px-6">
        <div className="flex flex-col">
          <span className="text-[2rem] font-extrabold leading-none tracking-[-0.08em] text-[#0f2850]">
            EVOLUTION
          </span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#4d6075]">
            CHEMICAL S.R.L.
          </span>
          <div className="mt-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8b9bad]">
            <span>Análisis</span>
            <span>•</span>
            <span>Calidad</span>
            <span>•</span>
            <span>Precisión</span>
          </div>
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
                'mx-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm leading-5 transition-all duration-200',
                isActive
                  ? 'scale-[0.98] bg-[#006096] font-semibold text-white shadow-[0_4px_12px_rgba(0,96,150,0.2)]'
                  : 'font-normal text-[#3f4851] hover:bg-[#eff4ff] hover:text-[#006096]',
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
  }
}
