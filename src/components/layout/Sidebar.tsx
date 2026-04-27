'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Muestras', href: '/muestras' },
  { name: 'Resultados', href: '/resultados' },
  { name: 'Reportes', href: '/reportes' },
  { name: 'Empresas', href: '/empresas' },
  { name: 'Usuarios', href: '/usuarios' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-primary">Evolution Chemical</span>
          <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
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

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="mb-3 px-4">
          <p className="text-xs font-medium text-muted-foreground">Sesión Activa</p>
          <p className="mt-1 text-xs text-muted-foreground">Owner</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
