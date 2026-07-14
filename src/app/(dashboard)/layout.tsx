'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Header } from '@/src/components/layout/Header';
import { SidebarProvider, useSidebar } from '@/src/components/layout/SidebarContext';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="dashboard-shell relative min-h-screen bg-white">
      <Sidebar />
      <Header />
      <main className={cn('pt-14 transition-all duration-300', isCollapsed ? 'pl-16' : 'pl-56')}>
        <div className="mx-auto w-full max-w-[1440px] px-6 py-6 xl:px-8">{children}</div>
      </main>
      <div className="dashboard-logout-fade" aria-hidden="true" />
      <LogoutTransitionStyles />
    </div>
  );
}

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

    if (user?.role === UserRole.COMPANY_ADMIN) {
      router.push('/company/muestras');
      return;
    }

    if (user?.role !== UserRole.OWNER) {
      router.push('/auth/login');
      return;
    }

    if (window.sessionStorage.getItem('dashboard-enter-transition') === 'zoom-in') {
      window.sessionStorage.removeItem('dashboard-enter-transition');
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
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}

function LogoutTransitionStyles() {
  return (
    <style jsx global>{`
      .dashboard-shell {
        transform-origin: center;
        will-change: opacity;
      }

      body.logout-zooming .dashboard-shell {
        pointer-events: none;
      }

      .dashboard-shell.dashboard-entering {
        animation: dashboard-login-zoom-in 0.82s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .dashboard-logout-fade {
        pointer-events: none;
        position: fixed;
        inset: 0;
        z-index: 50;
        background: #ffffff;
        opacity: 0;
      }

      body.logout-zooming .dashboard-logout-fade {
        animation: dashboard-logout-fade-in 0.28s ease forwards;
      }

      @keyframes dashboard-login-zoom-in {
        0% {
          opacity: 0;
          transform: scale(0.935);
        }
        42% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes dashboard-logout-fade-in {
        to {
          opacity: 1;
        }
      }
    `}</style>
  );
}
