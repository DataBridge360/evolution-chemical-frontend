'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { WelcomeOverlay } from '@/src/components/layout/WelcomeOverlay';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';
import { type User, UserRole } from '@/src/types/user';

function DashboardHeader() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = authService.getCurrentUser();
  const userInitial = getUserInitial(user?.email);
  const userRoleLabel = user?.role === UserRole.OWNER ? 'Administrador Principal' : user?.role;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setShowProfileMenu(false);
    router.prefetch('/auth/login');
    void authService.logout().catch((error) => {
      console.error('Error al notificar cierre de sesión:', error);
    });
    window.sessionStorage.setItem('skip-login-boot-loader', 'true');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.replace('/auth/login');
  };

  return (
    <div className="pointer-events-none absolute right-6 top-6 z-50">
      <div className="pointer-events-auto relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="group flex h-11 items-center gap-2 rounded-full border border-blue-100 bg-white/95 py-1 pl-1 pr-2 shadow-lg shadow-slate-200/80 backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-blue-50/80 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Abrir menú de perfil"
          aria-expanded={showProfileMenu}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] via-[#0ea5e9] to-[#67e8f9] text-sm font-bold uppercase text-white shadow-sm shadow-blue-200">
            {userInitial}
          </span>
          <svg
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform group-hover:text-blue-700',
              showProfileMenu && 'rotate-180 text-blue-700',
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showProfileMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
            <div className="absolute right-0 z-20 mt-3 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
              <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] via-[#0ea5e9] to-[#67e8f9] text-sm font-bold uppercase text-white shadow-sm shadow-blue-200">
                  {userInitial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {user?.name || user?.email || 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-[11px] font-medium text-blue-700">{userRoleLabel}</p>
                </div>
              </div>
              <div className="p-1.5 pt-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-70"
                >
                  {isLoggingOut ? (
                    <LogoutSpinner />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
}

function getUserInitial(email?: string | null) {
  const trimmedEmail = email?.trim();

  if (!trimmedEmail) return 'U';

  return trimmedEmail.charAt(0).toUpperCase();
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [shouldEnter, setShouldEnter] = useState(false);
  const [welcomeText, setWelcomeText] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const timers: number[] = [];

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

      const name = window.sessionStorage.getItem('login-welcome-name') || getUserDisplayName(user);
      window.sessionStorage.removeItem('login-welcome-name');
      setWelcomeText(`Bienvenido ${name}`);
      timers.push(
        window.setTimeout(() => {
          setWelcomeText(null);
        }, 2300),
      );
    }

    setIsAuthorized(true);
    setIsValidating(false);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
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
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
      {welcomeText && <WelcomeOverlay text={welcomeText} />}
      <div className="dashboard-logout-fade" aria-hidden="true" />
      <LogoutTransitionStyles />
    </div>
  );
}

function getUserDisplayName(user: User | null) {
  if (user?.name?.trim()) return user.name.trim();

  const emailName = user?.email?.split('@')[0]?.trim();
  return emailName || 'Usuario';
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
