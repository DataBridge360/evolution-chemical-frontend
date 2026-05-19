'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shouldEnter, setShouldEnter] = useState(false);

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

    if (window.sessionStorage.getItem('dashboard-enter-transition') === 'zoom-in') {
      window.sessionStorage.removeItem('dashboard-enter-transition');
      setShouldEnter(true);
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
    <div
      className={cn(
        'dashboard-shell relative flex h-screen overflow-hidden bg-muted/30',
        shouldEnter && 'dashboard-entering',
      )}
    >
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
              if (isLoggingOut) return;

              try {
                setIsLoggingOut(true);
                router.prefetch('/auth/login');
                await authService.logout();
                window.sessionStorage.setItem('skip-login-boot-loader', 'true');
                document.body.classList.add('logout-zooming');
                await wait(300);
                router.replace('/auth/login');
                window.setTimeout(() => document.body.classList.remove('logout-zooming'), 600);
              } catch (error) {
                setIsLoggingOut(false);
                document.body.classList.remove('logout-zooming');
                console.error('Error al cerrar sesión:', error);
              }
            }}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-70"
          >
            {isLoggingOut && <LogoutSpinner />}
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6">{children}</div>
      </main>
      <div className="dashboard-logout-fade" aria-hidden="true" />
      <LogoutTransitionStyles />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function LogoutSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
      aria-hidden="true"
    />
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
        position: absolute;
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
