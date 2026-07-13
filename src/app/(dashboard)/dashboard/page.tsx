'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  FilePlus,
  FlaskConical,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { authService } from '@/src/modules/auth/services/AuthService';
import { useDashboardStats } from '@/src/modules/chromatography/hooks/useDashboardStats';
import { useCompanyDistribution } from '@/src/modules/chromatography/hooks/useCompanyDistribution';
import type { DashboardRange, CompanyPeriod } from '@/src/modules/chromatography/services/chromatographyService';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import { UploadHistoricModal } from '@/src/modules/historics/fq-type-a/components/UploadHistoricModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
];

function getCurrentMonthName() {
  return new Date().toLocaleString('es-AR', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
}

function getPrevMonthName() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleString('es-AR', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
}

const COMPANY_PERIOD_OPTIONS: { value: CompanyPeriod; label: string }[] = [
  { value: 'current_month', label: getCurrentMonthName() },
  { value: 'prev_month', label: getPrevMonthName() },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
];

function getDisplayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();
  return email?.split('@')[0]?.trim() || 'Usuario';
}

/** Build chart data from the backend series, zero-filling gaps. */
function buildChartData(series: { date: string; count: number }[], range: DashboardRange) {
  const map = new Map(series.map((d) => [d.date, d.count]));
  const result: { label: string; date: string; count: number }[] = [];
  const now = new Date();

  if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = i === 0 ? 'Hoy' : DAY_LABELS[d.getDay()];
      result.push({ label, date: key, count: map.get(key) ?? 0 });
    }
  } else {
    const months = range === '6m' ? 6 : 12;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = i === 0 ? 'Este mes' : MONTH_LABELS[d.getMonth()];
      result.push({ label, date: key, count: map.get(key) ?? 0 });
    }
  }

  return result;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('6m');
  const [companyPeriod, setCompanyPeriod] = useState<CompanyPeriod>('current_month');
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(range);
  const { data: companyDist = [], isLoading: isLoadingDist } = useCompanyDistribution(companyPeriod);
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();

  const [rangeOpen, setRangeOpen] = useState(false);
  const [companyPeriodOpen, setCompanyPeriodOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  const companyPeriodRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!rangeOpen && !companyPeriodOpen) return;
    function handleClick(e: MouseEvent) {
      if (rangeOpen && rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setRangeOpen(false);
      }
      if (companyPeriodOpen && companyPeriodRef.current && !companyPeriodRef.current.contains(e.target as Node)) {
        setCompanyPeriodOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [rangeOpen, companyPeriodOpen]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const user = authService.getCurrentUser();
  const name = getDisplayName(user?.name, user?.email);

  // ── Derived data ─────────────────────────────────────────────────────────

  const chartData = useMemo(() => buildChartData(stats?.series ?? [], range), [stats, range]);

  const periodTotal = useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData],
  );

  const percentChange = useMemo(() => {
    if (!stats) return 0;
    const { current_month, previous_month } = stats;
    if (previous_month === 0) return current_month > 0 ? 100 : 0;
    return Math.round(((current_month - previous_month) / previous_month) * 100);
  }, [stats]);

  const localityDistribution = useMemo(() => {
    const cutral = companies.filter((c) => c.localidad === Localidad.CUTRAL_CO).length;
    const rincon = companies.filter((c) => c.localidad === Localidad.RINCON).length;
    return [
      { name: LOCALIDAD_LABELS[Localidad.CUTRAL_CO], value: cutral, color: '#006096' },
      { name: LOCALIDAD_LABELS[Localidad.RINCON], value: rincon, color: '#d97706' },
    ];
  }, [companies]);

  const recentChromatography = stats?.recent ?? [];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      {/* Heading + Quick action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            Bienvenido, {name}{' '}
            <span className="inline-block origin-[70%_80%] animate-[wave_1.8s_ease-in-out_0.3s_2] text-[1.15em]">
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#737373]">
            Gestioná tus análisis cromatográficos y accedé a resultados desde un tablero claro y
            ordenado.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-5 py-2 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#d4d4d4] hover:bg-[#fafafa]"
          >
            <FilePlus className="h-3.5 w-3.5" />
            Agregar histórico
          </button>
          <Link
            href="/cromatografia"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006096] px-5 py-2 text-sm font-light text-white transition-colors hover:bg-[#004d7a]"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Cromatografía
          </Link>
        </div>
      </div>

      {/* Row 1: Area chart + Recent chromatography */}
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Area chart */}
        <section className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0a0a0a]">Cromatografías</h2>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">Total realizadas</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[#0a0a0a]">
                  {isLoadingStats ? '—' : periodTotal}
                </span>
                {!isLoadingStats && stats && (
                  <span
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600"
                  >
                    {percentChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {percentChange >= 0 ? '+' : ''}
                    {percentChange}% vs mes anterior
                  </span>
                )}
              </div>
            </div>
            <div ref={rangeRef} className="relative">
              <button
                type="button"
                onClick={() => setRangeOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] transition-colors hover:border-[#d4d4d4] hover:bg-[#fafafa]"
              >
                <Calendar className="h-3.5 w-3.5 text-[#a3a3a3]" />
                {RANGE_OPTIONS.find((o) => o.value === range)?.label}
                <ChevronDown className={`h-3 w-3 text-[#a3a3a3] transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-[#e5e5e5] bg-white py-1 shadow-lg shadow-black/5">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setRange(opt.value); setRangeOpen(false); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f5f5f5] ${
                        opt.value === range ? 'font-medium text-[#006096]' : 'text-[#525252]'
                      }`}
                    >
                      {opt.value === range && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006096]" />
                      )}
                      <span className={opt.value === range ? '' : 'pl-[14px]'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[200px]">
            {isLoadingStats ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#006096]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#006096" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#006096" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a3a3a3' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a3a3a3' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                    formatter={(value) => [`${value}`, 'Análisis']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#006096"
                    strokeWidth={1.5}
                    fill="url(#areaBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Recent chromatography */}
        <section className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Cromatografía reciente</p>
              <p className="mt-0.5 text-xs text-[#a3a3a3]">
                Últimas corridas cargadas con fecha y hora de ingreso.
              </p>
            </div>
            <Link
              href="/analisis"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#525252] transition-colors hover:text-[#0a0a0a]"
            >
              Ver historial
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoadingStats ? (
            <MiniListSkeleton />
          ) : recentChromatography.length > 0 ? (
            <div className="divide-y divide-[#f0f0f0]">
              {recentChromatography.map((item) => (
                <Link
                  key={item.analysis_id}
                  href={`/cromatografia/${item.analysis_id}`}
                  className="flex items-center justify-between gap-3 py-2.5 transition-colors first:pt-0 hover:bg-[#fafafa]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#525252]">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0a0a0a]">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[#a3a3a3]">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#a3a3a3]">{item.date_label}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMiniState />
          )}
        </section>
      </div>

      {/* Row 2: Company bar chart + Donut chart */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Horizontal bar chart — cromas by company */}
        <section className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0a0a0a]">Cromatografías por empresa</h2>
              <p className="mt-0.5 text-xs text-[#a3a3a3]">Distribución de corridas cargadas</p>
            </div>
            <div ref={companyPeriodRef} className="relative">
              <button
                type="button"
                onClick={() => setCompanyPeriodOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] transition-colors hover:border-[#d4d4d4] hover:bg-[#fafafa]"
              >
                <Calendar className="h-3.5 w-3.5 text-[#a3a3a3]" />
                {COMPANY_PERIOD_OPTIONS.find((o) => o.value === companyPeriod)?.label}
                <ChevronDown className={`h-3 w-3 text-[#a3a3a3] transition-transform ${companyPeriodOpen ? 'rotate-180' : ''}`} />
              </button>
              {companyPeriodOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[170px] rounded-lg border border-[#e5e5e5] bg-white py-1 shadow-lg shadow-black/5">
                  {COMPANY_PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setCompanyPeriod(opt.value); setCompanyPeriodOpen(false); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[#f5f5f5] ${
                        opt.value === companyPeriod ? 'font-medium text-[#006096]' : 'text-[#525252]'
                      }`}
                    >
                      {opt.value === companyPeriod && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006096]" />
                      )}
                      <span className={opt.value === companyPeriod ? '' : 'pl-[14px]'}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoadingDist ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#006096]" />
            </div>
          ) : companyDist.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-xs text-[#a3a3a3]">Sin datos para este período</p>
            </div>
          ) : (
            <div style={{ height: Math.max(160, companyDist.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyDist} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="company_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#525252' }} width={120} />
                  <RechartsTooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(value) => [`${value}`, 'Cromatografías']}
                  />
                  <Bar dataKey="count" fill="#006096" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Donut chart — companies by locality */}
        <section className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <p className="text-sm font-semibold text-[#0a0a0a]">Empresas por localidad</p>
          <div className="relative mt-4 flex items-center justify-center">
            {isLoadingCompanies ? (
              <div className="flex h-[180px] items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#006096]" />
              </div>
            ) : (
              <>
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={localityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {localityDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-semibold text-[#0a0a0a]">
                      {companies.length}
                    </span>
                    <p className="text-[10px] text-[#a3a3a3]">Total</p>
                  </div>
                </div>
              </>
            )}
          </div>
          {!isLoadingCompanies && (
            <div className="mt-3 flex items-center justify-center gap-5">
              {localityDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-[#737373]">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <UploadHistoricModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function EmptyMiniState() {
  return (
    <div className="rounded-lg border border-dashed border-[#e5e5e5] px-5 py-6 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#a3a3a3]">
        <FlaskConical className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-medium text-[#525252]">No hay cromatografía reciente</p>
      <p className="mt-1 text-xs text-[#a3a3a3]">
        Las corridas cargadas se van a listar acá automáticamente.
      </p>
    </div>
  );
}

function MiniListSkeleton() {
  return (
    <div className="divide-y divide-[#f0f0f0]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-[#f5f5f5]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-36 animate-pulse rounded bg-[#f5f5f5]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[#fafafa]" />
            </div>
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-[#fafafa]" />
        </div>
      ))}
    </div>
  );
}

