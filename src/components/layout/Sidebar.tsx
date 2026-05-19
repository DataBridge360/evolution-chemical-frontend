'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Cromatografía', href: '/cromatografia', role: 'owner' },
  { name: 'Muestras', href: '/muestras' },
  { name: 'Análisis', href: '/analisis' },
  { name: 'Empresas', href: '/empresas' },
  { name: 'Usuarios', href: '/usuarios' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border bg-card px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-5 w-5 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">Evolution Chemical</span>
            <span className="text-[10px] text-muted-foreground">Sistema de Gestión</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'block px-4 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-accent',
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
