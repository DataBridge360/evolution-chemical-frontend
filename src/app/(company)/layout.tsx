'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();

    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Solo company_admin puede acceder
    if (user?.role !== UserRole.COMPANY_ADMIN) {
      router.push('/dashboard'); // Owner va al dashboard
      return;
    }

    setIsAuthorized(true);
    setIsValidating(false);
  }, [router]);

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Validando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar simplificado para company */}
      <div className="flex h-full w-64 flex-col border-r border-border bg-white">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-primary">Evolution Chemical</span>
            <span className="text-xs text-muted-foreground">Portal de Compañía</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <a
            href="/company/muestras"
            className="block bg-primary px-4 py-2.5 text-sm font-medium text-white"
          >
            Muestras
          </a>
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={async () => {
              await authService.logout();
              router.push('/auth/login');
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
