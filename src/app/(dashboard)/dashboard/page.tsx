'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Upload,
} from 'lucide-react';

import { formatDateAR, formatDateTimeAR } from '@/src/lib/dateUtils';
import { authService } from '@/src/modules/auth/services/AuthService';
import { useAnalysesList } from '@/src/modules/chromatography/hooks/useAnalysesList';
import { type ChromatographicAnalysis } from '@/src/modules/chromatography/types';

export default function DashboardPage() {
  // Usar hook con cache para análisis
  const { data: recentAnalyses = [], isLoading: isLoadingRecentAnalyses } = useAnalysesList();

  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [isWelcomeExiting, setIsWelcomeExiting] = useState(false);
  const [welcomeLabel, setWelcomeLabel] = useState('');

  const user = authService.getCurrentUser();
  const name = getDisplayName(user?.name, user?.email);

  useEffect(() => {
    const storedName = window.sessionStorage.getItem('login-welcome-name');
    const alreadySeen = window.sessionStorage.getItem('dashboard-welcome-seen') === 'true';

    if (!storedName && alreadySeen) return;

    setWelcomeLabel(`Bienvenido ${storedName || name}!`);
    setShowWelcomeOverlay(true);
    setIsWelcomeExiting(false);

    const timeout = window.setTimeout(() => {
      setIsWelcomeExiting(true);
    }, 2350);

    return () => window.clearTimeout(timeout);
  }, [name]);

  useEffect(() => {
    if (!showWelcomeOverlay || !isWelcomeExiting) return;

    const timeout = window.setTimeout(() => {
      setShowWelcomeOverlay(false);
      setIsWelcomeExiting(false);
      window.sessionStorage.removeItem('login-welcome-name');
      window.sessionStorage.setItem('dashboard-welcome-seen', 'true');
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [showWelcomeOverlay, isWelcomeExiting]);

  // Ordenar análisis por fecha
  const sortedAnalyses = useMemo(
    () =>
      [...recentAnalyses].sort((a, b) => getAnalysisSortDate(b) - getAnalysisSortDate(a)),
    [recentAnalyses],
  );

  const recentChromatography = useMemo(
    () =>
      sortedAnalyses.slice(0, 4).map((analysis) => ({
        id: analysis.analysis_id,
        title:
          analysis.report_number ||
          analysis.chromatograph_sample_name ||
          analysis.sample ||
          'Corrida cromatográfica',
        subtitle: `${analysis.company_name}${analysis.field_name ? ` • ${analysis.field_name}` : ''}`,
        dateLabel: getAnalysisDateTimeLabel(analysis),
        href: `/cromatografia/${analysis.analysis_id}`,
      })),
    [sortedAnalyses],
  );

  const recentCompanies = useMemo(() => {
    const map = new Map<
      string,
      { name: string; fieldName?: string; dateLabel: string; analysisId: string; count: number }
    >();

    for (const analysis of sortedAnalyses) {
      const key = analysis.company_name;
      const current = map.get(key);

      if (!current) {
        map.set(key, {
          name: analysis.company_name,
          fieldName: analysis.field_name || undefined,
          dateLabel: getAnalysisDateLabel(analysis),
          analysisId: analysis.analysis_id,
          count: 1,
        });
        continue;
      }

      map.set(key, { ...current, count: current.count + 1 });
    }

    return Array.from(map.values()).slice(0, 4);
  }, [sortedAnalyses]);

  return (
    <div className="space-y-7 pb-10 [font-family:Manrope,ui-sans-serif,system-ui,sans-serif]">
      {showWelcomeOverlay && (
        <DashboardWelcomeOverlay
          label={welcomeLabel || `Bienvenido ${name}!`}
          exiting={isWelcomeExiting}
        />
      )}

      <section className="relative overflow-hidden rounded-[32px] border border-[#dce8f3] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0">
          <Image
            src="/assets/licensed-image.jpeg"
            alt="Laboratorio Evolution"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,28,53,0.9)_0%,rgba(10,49,88,0.82)_34%,rgba(10,49,88,0.42)_62%,rgba(255,255,255,0.12)_100%)]" />
        </div>

        <div className="relative min-h-[320px] px-8 py-12 sm:px-10 lg:px-12 lg:py-16">
          <div className="max-w-xl">
            <HeroBrand />
            <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Bienvenido, {name}
            </h1>
            <p className="mt-4 max-w-md text-lg leading-8 text-white">
              Gestioná tus análisis cromatográficos y accedé a resultados reales desde un tablero
              claro y ordenado.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <ActionCard
          href="/cromatografia"
          title="Importar"
          description="Subí un nuevo archivo Excel cromatográfico y procesá el análisis."
          icon={<Upload className="h-7 w-7" />}
          accent="blue"
        />
        <ActionCard
          href="/analisis"
          title="Historial"
          description="Entrá al seguimiento de corridas, detalle técnico e informes existentes."
          icon={<FileText className="h-7 w-7" />}
          accent="teal"
        />
        <ActionCard
          href="/empresas"
          title="Empresas"
          description="Consultá las compañías disponibles para asociar nuevas cargas."
          icon={<Building2 className="h-7 w-7" />}
          accent="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <InfoCard
          title="Empresas recientes"
          description="Últimas compañías involucradas en corridas cromatográficas."
          actionHref="/empresas"
          actionLabel="Ver empresas"
        >
          {isLoadingRecentAnalyses ? (
            <MiniListSkeleton />
          ) : recentCompanies.length > 0 ? (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <Link
                  key={company.name}
                  href={`/cromatografia/${company.analysisId}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#e7eef6] bg-[#fbfdff] px-4 py-3 transition-colors hover:border-[#d4e3f2] hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#10243e]">{company.name}</p>
                    <p className="mt-1 text-sm text-[#66788c]">
                      {company.fieldName || 'Sin yacimiento'} • {company.count} análisis
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[#7d90a5]">
                    {company.dateLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMiniState
              title="Todavía no hay empresas recientes"
              description="Las compañías aparecerán acá cuando existan análisis cargados."
            />
          )}
        </InfoCard>

        <InfoCard
          title="Cromatografía reciente"
          description="Últimas corridas cargadas con fecha y hora de ingreso."
          actionHref="/analisis"
          actionLabel="Ver historial"
        >
          {isLoadingRecentAnalyses ? (
            <MiniListSkeleton />
          ) : recentChromatography.length > 0 ? (
            <div className="space-y-3">
              {recentChromatography.map((report) => (
                <Link
                  key={report.id}
                  href={report.href}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#e7eef6] bg-white px-4 py-3 transition-colors hover:border-[#d4e3f2] hover:bg-[#fbfdff]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1768a7]">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#10243e]">
                        {report.title}
                      </p>
                      <p className="mt-1 truncate text-sm text-[#66788c]">{report.subtitle}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[#7d90a5]">
                    {report.dateLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMiniState
              title="No hay cromatografía reciente"
              description="Las corridas cargadas se van a listar acá automáticamente."
            />
          )}
        </InfoCard>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent: 'blue' | 'teal' | 'slate';
}) {
  const accentStyles = {
    blue: {
      iconWrap: 'bg-[#e8f2ff] text-[#1565a6]',
      button: 'bg-[#1565a6] hover:bg-[#0f588f] text-white',
      title: 'text-[#0f2850]',
    },
    teal: {
      iconWrap: 'bg-[#e7f8f5] text-[#0f8a78]',
      button: 'bg-[#0f8a78] hover:bg-[#0c7465] text-white',
      title: 'text-[#0f6c5f]',
    },
    slate: {
      iconWrap: 'bg-[#eef2f6] text-[#576b81]',
      button: 'bg-[#6b7f94] hover:bg-[#596c80] text-white',
      title: 'text-[#45596f]',
    },
  }[accent];

  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-[#e5edf6] bg-white p-7 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(15,23,42,0.09)]"
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${accentStyles.iconWrap}`}
      >
        {icon}
      </div>
      <h3 className={`mt-6 text-2xl font-semibold tracking-[-0.03em] ${accentStyles.title}`}>
        {title}
      </h3>
      <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#66788c]">{description}</p>
      <span
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${accentStyles.button}`}
      >
        Abrir
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function InfoCard({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[#e5edf6] bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#10243e]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#66788c]">{description}</p>
        </div>
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d7e5f4] bg-[#f8fbff] px-4 py-2 text-sm font-medium text-[#1768a7] transition-colors hover:bg-white"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {children}
    </section>
  );
}

function EmptyMiniState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d7e4f2] bg-[#fbfdff] px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1768a7]">
        <FlaskConical className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-[#10243e]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#66788c]">{description}</p>
    </div>
  );
}

function HeroBrand() {
  return (
    <div className="flex flex-col">
      <span className="text-[2.3rem] font-extrabold leading-none tracking-[-0.1em] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:text-[2.7rem]">
        EVOLUTION
      </span>
      <span className="mt-1 text-[12px] font-bold uppercase tracking-[0.3em] text-white">
        CHEMICAL S.R.L.
      </span>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
        <span>Análisis</span>
        <span>•</span>
        <span>Calidad</span>
        <span>•</span>
        <span>Precisión</span>
        <span>•</span>
        <span>Innovación</span>
      </div>
    </div>
  );
}

function MiniListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#e7eef6] bg-[#fbfdff] px-4 py-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-[#e7eef6]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-[#e7eef6]" />
              <div className="h-3 w-28 animate-pulse rounded bg-[#eef3f8]" />
            </div>
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-[#eef3f8]" />
        </div>
      ))}
    </div>
  );
}

function DashboardWelcomeOverlay({ label, exiting }: { label: string; exiting: boolean }) {
  const characters = Array.from(label);

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-[360] overflow-hidden bg-white ${
          exiting ? 'dashboard-welcome-shell-exit' : ''
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <span
            className="text-center text-[clamp(2.6rem,6vw,4.75rem)] font-bold leading-none text-[#171717]"
            style={{
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {characters.map((character, index) =>
              character === ' ' ? (
                <span
                  key={`space-${index}`}
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: '0.32em',
                  }}
                />
              ) : (
                <span
                  key={`${character}-${index}`}
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    verticalAlign: 'bottom',
                    lineHeight: 1,
                  }}
                >
                  <span
                    className="dashboard-welcome-word"
                    style={{
                      display: 'inline-block',
                      transform: 'translateY(100%)',
                      animationDelay: `${index * 52}ms`,
                    }}
                  >
                    {character}
                  </span>
                </span>
              ),
            )}
          </span>
        </div>
      </div>

      <style jsx>{`
        .dashboard-welcome-word {
          animation: dashboard-welcome-slide 760ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform;
        }

        .dashboard-welcome-shell-exit {
          animation: dashboard-welcome-exit 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, filter;
        }

        @keyframes dashboard-welcome-slide {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0%);
          }
        }

        @keyframes dashboard-welcome-exit {
          from {
            opacity: 1;
            filter: blur(0px);
          }
          to {
            opacity: 0;
            filter: blur(18px);
          }
        }
      `}</style>
    </>
  );
}

function getDisplayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();

  const emailName = email?.split('@')[0]?.trim();
  return emailName || 'Usuario';
}

function getAnalysisSortDate(analysis: ChromatographicAnalysis) {
  const candidate = analysis.analysis_date || analysis.updated_at || analysis.created_at;
  const parsed = candidate ? new Date(candidate).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getAnalysisDateLabel(analysis: ChromatographicAnalysis) {
  if (analysis.analysis_date) return formatDateAR(analysis.analysis_date);
  if (analysis.created_at) return formatDateAR(analysis.created_at);
  return '-';
}

function getAnalysisDateTimeLabel(analysis: ChromatographicAnalysis) {
  if (analysis.analysis_date) return formatDateTimeAR(analysis.analysis_date);
  if (analysis.created_at) return formatDateTimeAR(analysis.created_at);
  return '-';
}
