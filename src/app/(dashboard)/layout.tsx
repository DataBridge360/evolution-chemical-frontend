'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';

function DashboardHeader() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
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
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-end px-6">
        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition-colors hover:bg-muted"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">
                {user?.role === UserRole.OWNER ? 'Owner' : user?.role}
              </p>
              <p className="text-[10px] text-muted-foreground">Sesión Activa</p>
            </div>
            <svg
              className={`h-3 w-3 text-muted-foreground transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-card shadow-lg">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === UserRole.OWNER ? 'Administrador Principal' : user?.role}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {isLoggingOut ? (
                      <LogoutSpinner />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    )}
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [shouldEnter, setShouldEnter] = useState(false);

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
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
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
      className="h-4 w-4 animate-spin rounded-full border-2 border-destructive/30 border-t-destructive"
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
