'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Atom,
  CircleAlert,
  FlaskConical,
  Orbit,
  RefreshCcw,
  ScanSearch,
} from 'lucide-react';

import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { type AnalysisStatus } from '@/src/modules/chromatography/types';

type ActionTone = 'primary' | 'secondary' | 'ghost';

export interface RecentChromatographyAction {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  tone?: ActionTone;
}

export interface RecentChromatographyItem {
  id: string;
  reportNumber: string;
  client: string;
  dateLabel: string;
  status: AnalysisStatus | (string & {});
  fieldName?: string;
  sampleLabel?: string;
  actions?: RecentChromatographyAction[];
}

export interface RecentChromatographyPanelProps {
  items: RecentChromatographyItem[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  eyebrow?: string;
  description?: string;
  historyHref?: string;
  historyLabel?: string;
  onHistoryClick?: () => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  calculated: 'border-sky-200 bg-sky-50 text-sky-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  reported: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  calculated: 'Calculado',
  approved: 'Aprobado',
  reported: 'Informado',
};

export function RecentChromatographyPanel({
  items,
  isLoading = false,
  error,
  title = 'Cromatografía reciente',
  eyebrow = 'Laboratorio',
  description = 'Lecturas recientes del cromatógrafo listas para seguimiento operativo y apertura de informe.',
  historyHref,
  historyLabel = 'Ver historial completo',
  onHistoryClick,
  onRetry,
  emptyTitle = 'Todavía no hay corridas recientes',
  emptyDescription = 'Cuando el laboratorio procese nuevos cromatogramas, van a aparecer acá con acceso directo a sus acciones.',
  className,
}: RecentChromatographyPanelProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-[#cfe0f2] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(73,139,255,0.16),transparent_34%),linear-gradient(180deg,rgba(242,248,255,0.82),rgba(255,255,255,0)_38%)]" />
      <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full border border-[#c5daf4]/70 opacity-70" />
      <div className="recent-chem-pulse pointer-events-none absolute right-14 top-16 h-3 w-3 rounded-full bg-[#7fb1ff]/70 shadow-[0_0_0_6px_rgba(127,177,255,0.12)]" />

      <div className="relative border-b border-[#d9e6f3] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe0f2] bg-[#f5f9ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6da8]">
                <FlaskConical className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <div className="hidden h-px w-16 bg-gradient-to-r from-[#96c0f4] to-transparent sm:block" />
            </div>

            <div className="flex items-start gap-4">
              <div className="relative mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6e4f4] bg-[#f6faff] text-[#1f67a7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:flex">
                <Atom className="recent-chem-orbit h-5 w-5" />
                <Orbit className="absolute h-8 w-8 text-[#91bcf3]/70" strokeWidth={1.3} />
              </div>

              <div className="min-w-0">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#11253d]">
                  {title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a6d82]">{description}</p>
              </div>
            </div>
          </div>

          {(historyHref || onHistoryClick) && (
            <PanelLink href={historyHref} onClick={onHistoryClick} className="shrink-0">
              {historyLabel}
              <ArrowRight className="h-4 w-4" />
            </PanelLink>
          )}
        </div>
      </div>

      <div className="relative">
        <DesktopHeader />

        <div className="divide-y divide-[#edf3f9]">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={onRetry} />
          ) : items.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          ) : (
            items.map((item) => <Row key={item.id} item={item} />)
          )}
        </div>
      </div>

      <style jsx>{`
        .recent-chem-orbit {
          animation: recent-chem-orbit 10s linear infinite;
          transform-origin: 50% 50%;
        }

        .recent-chem-pulse {
          animation: recent-chem-pulse 2.8s ease-in-out infinite;
        }

        @keyframes recent-chem-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes recent-chem-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.66;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}

function DesktopHeader() {
  return (
    <div className="hidden grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_auto] items-center gap-4 border-b border-[#edf3f9] bg-[#fbfdff]/90 px-7 py-3 md:grid">
      <HeaderLabel>Informe</HeaderLabel>
      <HeaderLabel>Cliente y muestra</HeaderLabel>
      <HeaderLabel>Fecha</HeaderLabel>
      <HeaderLabel>Estado</HeaderLabel>
      <HeaderLabel className="text-right">Acciones</HeaderLabel>
    </div>
  );
}

function HeaderLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7f94]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-5 py-5 sm:px-7">
      <div className="rounded-[22px] border border-[#e4edf7] bg-[#fcfdff] p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3 text-[#446f9c]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef5ff]">
            <ScanSearch className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#17304d]">Sincronizando corridas recientes</p>
            <p className="text-sm text-[#61758a]">
              Preparando la última actividad cromatográfica para el tablero.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-[#edf3f9] bg-white/90 p-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_auto]"
            >
              <SkeletonBlock className="h-10 w-32" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3.5 w-24" />
              </div>
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
              <div className="flex justify-start gap-2 md:justify-end">
                <SkeletonBlock className="h-9 w-24" />
                <SkeletonBlock className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[linear-gradient(110deg,rgba(229,238,247,0.9),rgba(245,249,255,1),rgba(229,238,247,0.9))] bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="px-5 py-7 sm:px-7">
      <div className="flex flex-col gap-4 rounded-[22px] border border-[#f2d0d0] bg-[#fff8f8] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#bf4b4b] shadow-[inset_0_0_0_1px_rgba(191,75,75,0.12)]">
            <CircleAlert className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#7e2626]">No se pudo preparar el panel</p>
            <p className="mt-1 text-sm leading-6 text-[#985353]">{error}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 rounded-xl border-[#d8b7b7] bg-white px-4 text-[#7e2626] hover:bg-[#fff0f0]"
            onClick={onRetry}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <div className="rounded-[24px] border border-dashed border-[#d6e4f4] bg-[linear-gradient(180deg,#fbfdff_0%,#f6faff_100%)] p-6 sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#d9e7f6] bg-white text-[#286dad] shadow-[0_12px_28px_rgba(40,109,173,0.08)]">
            <FlaskConical className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#132741]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#627489]">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ item }: { item: RecentChromatographyItem }) {
  const statusStyle = STATUS_STYLES[item.status] ?? 'border-slate-200 bg-slate-50 text-slate-700';
  const statusLabel = STATUS_LABELS[item.status] ?? item.status;

  return (
    <article className="group relative px-5 py-4 transition-colors duration-200 hover:bg-[#f9fbff] sm:px-7">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#d7e5f5] bg-white px-3 py-2 shadow-[0_10px_24px_rgba(17,37,61,0.04)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#eff6ff_0%,#dcecff_100%)] text-[#1e67a8]">
              <Atom className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#15304e]">{item.reportNumber}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[#6e8297]">Corrida</p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#15304e]">{item.client}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#627489]">
            {item.fieldName ? <span className="truncate">{item.fieldName}</span> : null}
            {item.sampleLabel ? (
              <>
                {item.fieldName ? <span className="h-1 w-1 rounded-full bg-[#9dbce0]" /> : null}
                <span className="truncate">{item.sampleLabel}</span>
              </>
            ) : null}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f94] md:hidden">
            Fecha
          </div>
          <p className="mt-1 text-sm text-[#43576d] md:mt-0">{item.dateLabel}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f94] md:hidden">
            Estado
          </div>
          <span
            className={cn(
              'mt-1 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] md:mt-0',
              statusStyle,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {item.actions?.length ? (
            item.actions.map((action, index) => (
              <ActionControl key={`${item.id}-${action.label}-${index}`} action={action} />
            ))
          ) : (
            <span className="text-sm text-[#8a9bad]">Sin acciones</span>
          )}
        </div>
      </div>
    </article>
  );
}

function ActionControl({ action }: { action: RecentChromatographyAction }) {
  const tone = action.tone ?? 'secondary';
  const className = cn(
    buttonVariants({
      variant: tone === 'ghost' ? 'ghost' : tone === 'primary' ? 'default' : 'outline',
      size: 'sm',
    }),
    'h-9 rounded-xl px-3 text-sm',
    tone === 'primary' &&
      'bg-[#0d67a8] text-white shadow-[0_12px_24px_rgba(13,103,168,0.22)] hover:bg-[#09578d]',
    tone === 'secondary' &&
      'border-[#d4e3f2] bg-white text-[#1b4d79] hover:bg-[#f5f9ff] hover:text-[#0d67a8]',
    tone === 'ghost' && 'text-[#607489] hover:bg-[#f3f7fb] hover:text-[#15304e]',
    action.disabled && 'cursor-not-allowed opacity-50',
  );

  const content = (
    <>
      {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
      <span>{action.label}</span>
    </>
  );

  if (action.href && !action.disabled) {
    return (
      <Link href={action.href} className={className} title={action.title}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={action.onClick}
      title={action.title}
      disabled={action.disabled}
    >
      {content}
    </button>
  );
}

function PanelLink({
  href,
  onClick,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const styles = cn(
    'inline-flex h-10 items-center gap-2 rounded-xl border border-[#d4e3f2] bg-white px-4 text-sm font-medium text-[#1e598d] transition-colors hover:bg-[#f5f9ff] hover:text-[#0d67a8]',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={styles} onClick={onClick}>
      {children}
    </button>
  );
}
