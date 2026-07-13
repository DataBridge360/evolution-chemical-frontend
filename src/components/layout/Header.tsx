'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  TestTubes,
  BarChart3,
  Building2,
  Trash2,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils/cn';
import { authService } from '@/src/modules/auth/services/AuthService';
import { UserRole } from '@/src/types/user';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { useSidebar } from './SidebarContext';

// ── Breadcrumb mapping ──────────────────────────────────────────────────────

const ROUTE_MAP: Record<string, { label: string; icon?: LucideIcon }> = {
  '/dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  '/cromatografia': { label: 'Cromatografía', icon: FlaskConical },
  '/muestras': { label: 'Muestras', icon: TestTubes },
  '/analisis': { label: 'Análisis', icon: BarChart3 },
  '/empresas': { label: 'Empresas', icon: Building2 },
  '/papelera': { label: 'Papelera', icon: Trash2 },
  '/reportes': { label: 'Reportes' },
  '/usuarios': { label: 'Usuarios' },
};

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; icon?: LucideIcon }[] = [{ label: 'Menu Principal' }];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const firstPath = `/${segments[0]}`;
    const route = ROUTE_MAP[firstPath];
    if (route) crumbs.push(route);
  }
  return crumbs;
}

// ── Search data ─────────────────────────────────────────────────────────────

interface SearchItem {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

const QUICK_ROUTES: SearchItem[] = [
  { id: 'r-dash', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Páginas' },
  { id: 'r-croma', label: 'Cromatografía', href: '/cromatografia', icon: FlaskConical, section: 'Páginas' },
  { id: 'r-analisis', label: 'Análisis', href: '/analisis', icon: BarChart3, section: 'Páginas' },
  { id: 'r-empresas', label: 'Empresas', href: '/empresas', icon: Building2, section: 'Páginas' },
  { id: 'r-muestras', label: 'Muestras', href: '/muestras', icon: TestTubes, section: 'Páginas' },
  { id: 'r-papelera', label: 'Papelera', href: '/papelera', icon: Trash2, section: 'Páginas' },
];

// ── Header ──────────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  // User menu
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: companies = [] } = useCompanies();
  const user = authService.getCurrentUser();

  // ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!searchFocused) return;
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchFocused]);

  // Close on route change
  useEffect(() => {
    setSearchFocused(false);
    setQuery('');
  }, [pathname]);

  // ── Filter out user's own company ────────────────────────────────────────
  const filteredCompanies = useMemo(
    () => companies.filter((c) => c.company_id !== user?.company_id),
    [companies, user?.company_id],
  );

  // ── Search results (empresas first, then pages) ────────────────────────
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const buildCompanyResults = (list: typeof filteredCompanies): SearchItem[] =>
      list.flatMap((c) => [
        {
          id: `c-${c.company_id}-croma`,
          label: c.name,
          subtitle: 'Cromatografías',
          href: `/analisis/${c.localidad}/${c.company_id}/croma`,
          icon: FlaskConical,
          section: 'Empresas',
        },
        {
          id: `c-${c.company_id}-hist`,
          label: c.name,
          subtitle: 'Histórico',
          href: `/analisis/${c.localidad}/${c.company_id}/historico`,
          icon: Building2,
          section: 'Empresas',
        },
      ]);

    if (!q) {
      // Empty query: show first 4 companies + pages
      return [...buildCompanyResults(filteredCompanies.slice(0, 4)), ...QUICK_ROUTES];
    }

    const matchedCompanies = filteredCompanies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
    const matchedRoutes = QUICK_ROUTES.filter((r) => r.label.toLowerCase().includes(q));

    return [...buildCompanyResults(matchedCompanies), ...matchedRoutes];
  }, [query, filteredCompanies]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  const showDropdown = searchFocused && results.length > 0;

  const navigate = useCallback(
    (href: string) => {
      setSearchFocused(false);
      setQuery('');
      inputRef.current?.blur();
      router.push(href);
    },
    [router],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) navigate(item.href);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    },
    [showDropdown, results, activeIndex, navigate],
  );

  // ── User display ───────────────────────────────────────────────────────
  const userInitial = (user?.email?.trim()?.[0] || 'U').toUpperCase();
  const userName = user?.name?.trim() || user?.email?.split('@')[0] || 'Usuario';
  const userRoleLabel =
    user?.role === UserRole.OWNER
      ? 'Administrador'
      : user?.role === UserRole.COMPANY_ADMIN
        ? 'Admin empresa'
        : 'Usuario';

  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowMenu(false);
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

  // ── Group results by section ────────────────────────────────────────────
  const sections = useMemo(() => {
    const map = new Map<string, (SearchItem & { gIdx: number })[]>();
    let gIdx = 0;
    for (const r of results) {
      if (!map.has(r.section)) map.set(r.section, []);
      map.get(r.section)!.push({ ...r, gIdx });
      gIdx++;
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [results]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 flex h-14 items-center border-b border-[#e5e7eb] bg-white transition-all duration-300',
        isCollapsed ? 'left-16' : 'left-56',
      )}
    >
      <div className="flex w-full items-center px-6">
        {/* Breadcrumbs */}
        <div className="hidden shrink-0 items-center gap-2 text-sm lg:flex">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#a3a3a3]">/</span>}
              {crumb.icon && (
                <crumb.icon
                  className={cn(
                    'h-4 w-4',
                    i === breadcrumbs.length - 1 ? 'text-[#0b1c30]' : 'text-[#a3a3a3]',
                  )}
                />
              )}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? 'font-medium text-[#0b1c30]'
                    : 'font-light text-[#737373]'
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </div>

        {/* ── Search bar (centered) ────────────────────────────────────── */}
        <div ref={searchContainerRef} className="relative mx-auto w-full max-w-[30rem]">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border bg-[#fafafa] px-3 transition-colors',
              searchFocused
                ? 'border-[#006096]/40 bg-white ring-1 ring-[#006096]/10'
                : 'border-[#e5e5e5] hover:border-[#d4d4d4]',
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-[#a3a3a3]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar empresa, página o acción..."
              className="h-8 flex-1 bg-transparent text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {!searchFocused && (
              <kbd className="hidden rounded border border-[#e5e5e5] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#a3a3a3] sm:inline-block">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white shadow-lg shadow-black/5">
              <div className="max-h-[340px] overflow-y-auto">
                {sections.map((section) => (
                  <div key={section.name}>
                    <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                      {section.name}
                    </p>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.gIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.href)}
                          onMouseEnter={() => setActiveIndex(item.gIdx)}
                          className={cn(
                            'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                            isActive ? 'bg-[#f5f5f5]' : 'bg-white',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-[#006096]' : 'text-[#a3a3a3]',
                            )}
                          />
                          <span
                            className={cn(
                              'truncate text-sm',
                              isActive ? 'font-medium text-[#0a0a0a]' : 'text-[#525252]',
                            )}
                          >
                            {item.label}
                            {item.subtitle && (
                              <span className="ml-1.5 text-xs font-normal text-[#a3a3a3]">
                                → {item.subtitle}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative ml-auto shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[#f5f5f5]"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4 text-[#525252]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#006096] ring-2 ring-white" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
                <div className="border-b border-[#e5e7eb] px-4 py-2.5">
                  <p className="text-sm font-semibold text-[#0b1c30]">Notificaciones</p>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006096]/10">
                      <Bell className="h-3.5 w-3.5 text-[#006096]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0a0a0a]">Novedades</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#737373]">
                        Próximamente vas a poder enterarte de actualizaciones del sistema o
                        solicitudes de tus clientes acá.
                      </p>
                      <p className="mt-2 text-[10px] font-medium text-[#006096]">
                        — Equipo de Desarrollo, Evolution Chemical
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[#f5f5f5]"
            aria-label="Abrir menú de perfil"
            aria-expanded={showMenu}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006096] text-xs font-semibold text-white">
              {userInitial}
            </span>
            <span className="hidden text-sm font-medium text-[#0b1c30] sm:block">{userName}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-[#a3a3a3] transition-transform',
                showMenu && 'rotate-180',
              )}
            />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-[#e5e7eb] bg-white p-1 shadow-lg">
                <div className="border-b border-[#e5e7eb] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#0b1c30]">{userName}</p>
                  <p className="text-xs text-[#737373]">{user?.email}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#006096]">{userRoleLabel}</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {isLoggingOut ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
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
