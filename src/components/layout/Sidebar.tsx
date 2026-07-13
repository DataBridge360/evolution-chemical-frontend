'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  TestTubes,
  BarChart3,
  Building2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils/cn';
import { useSidebar } from './SidebarContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section: string;
  role?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Principal' },
  { name: 'Cromatografía', href: '/cromatografia', icon: FlaskConical, section: 'Principal', role: 'owner' },
  { name: 'Muestras', href: '/muestras', icon: TestTubes, section: 'Gestión' },
  { name: 'Análisis', href: '/analisis', icon: BarChart3, section: 'Gestión' },
  { name: 'Empresas', href: '/empresas', icon: Building2, section: 'Gestión' },
  { name: 'Papelera', href: '/papelera', icon: Trash2, section: 'Sistema' },
];

const sections = ['Principal', 'Gestión', 'Sistema'];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-[#e5e7eb] bg-[#f9fafb] transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-56',
        )}
      >
        {/* Logo + toggle */}
        <div className="flex h-14 items-center justify-between border-b border-[#e5e7eb] px-4">
          {isCollapsed ? (
            <span className="mx-auto text-lg font-extrabold tracking-tight text-[#0f2850]">E</span>
          ) : (
            <div className="flex flex-col">
              <span className="text-base font-extrabold leading-none tracking-tight text-[#0f2850]">
                EVOLUTION
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#8b9bad]">
                Chemical S.R.L.
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#525252] shadow-sm transition-colors hover:bg-[#f0f0f0] hover:text-[#0b1c30]',
              isCollapsed && 'mx-auto',
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
          {sections.map((section) => {
            const items = navigation.filter((item) => item.section === section);
            if (items.length === 0) return null;

            return (
              <div key={section} className={cn(section !== 'Principal' ? 'mt-6' : '')}>
                {!isCollapsed && (
                  <span className="mb-2 block px-3 text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">
                    {section}
                  </span>
                )}
                {isCollapsed && section !== 'Principal' && (
                  <div className="mx-3 mb-2 border-t border-[#e5e7eb]" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                    const linkContent = (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                          isCollapsed && 'justify-center px-0',
                          isActive
                            ? 'border border-[#e5e7eb] bg-white font-medium text-[#0b1c30] shadow-sm'
                            : 'text-[#525252] hover:bg-[#f0f0f0] hover:text-[#0b1c30]',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-[#006096]' : 'text-[#737373]',
                          )}
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return linkContent;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

      </aside>
    </TooltipProvider>
  );
}
