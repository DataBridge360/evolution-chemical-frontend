'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();

    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Company Admin debe ir a su vista
    if (user?.role === UserRole.COMPANY_ADMIN) {
      router.push('/company/muestras');
      return;
    }

    // Solo owner puede acceder al dashboard
    if (user?.role !== UserRole.OWNER) {
      router.push('/auth/login');
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
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
