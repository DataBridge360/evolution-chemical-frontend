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
  const userInitial = getUserInitial(user?.email);
  const userRoleLabel =
    user?.role === UserRole.OWNER
      ? 'Administrador principal'
      : user?.role === UserRole.COMPANY_ADMIN
        ? 'Administrador de empresa'
        : 'Usuario';
  const userName = user?.name?.trim() || user?.email?.split('@')[0] || 'Usuario';

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
    <div className="relative z-[220] flex items-center justify-end">
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="group flex items-center gap-2 rounded-full border border-[#bfc7d3] bg-white px-1.5 py-1 shadow-sm transition-colors hover:border-[#006096] hover:bg-[#eff4ff]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096] focus-visible:ring-offset-2"
          aria-label="Abrir menú de perfil"
          aria-expanded={showProfileMenu}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006096] text-xs font-bold uppercase text-white">
            {userInitial}
          </span>
          <span className="flex min-w-0 flex-col pr-1 text-left">
            <span className="max-w-32 truncate text-xs font-semibold leading-4 text-[#0b1c30]">
              {userName}
            </span>
            <span className="max-w-32 truncate text-[10px] font-medium leading-3 text-[#5f748b]">
              {userRoleLabel}
            </span>
          </span>
          <svg
            className={cn(
              'h-3.5 w-3.5 text-[#3f4851] transition-transform group-hover:text-[#006096]',
              showProfileMenu && 'rotate-180 text-[#006096]',
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
            <div className="fixed inset-0 z-[210]" onClick={() => setShowProfileMenu(false)} />
            <div className="absolute right-0 z-[230] mt-3 w-72 rounded-xl border border-[#bfc7d3] bg-white p-2 shadow-xl shadow-slate-200/70">
              <div className="flex items-center gap-3 border-b border-[#bfc7d3]/40 px-3 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006096] text-sm font-bold uppercase text-white">
                  {userInitial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0b1c30]">
                    {user?.name || user?.email || 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-[#3f4851]">{user?.email}</p>
                  <p className="mt-1 text-[11px] font-medium text-[#006096]">{userRoleLabel}</p>
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
        'dashboard-shell relative flex h-screen overflow-hidden bg-[#f8f9ff]',
        shouldEnter && 'dashboard-entering',
      )}
    >
      {/* Línea divisoria única que atraviesa toda la página */}
      <div className="absolute left-0 right-0 top-[65px] z-[250] border-b border-[#dbe4ef]" />

      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="bg-[#f8f9ff]/94 relative z-[200] px-6 py-3 backdrop-blur xl:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <DashboardHeader />
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-6 xl:px-8">{children}</div>
        </main>
      </div>
      <div className="dashboard-logout-fade" aria-hidden="true" />
      <LogoutTransitionStyles />
    </div>
  );
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
