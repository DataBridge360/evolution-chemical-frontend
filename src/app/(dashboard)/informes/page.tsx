'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Lock, Search } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────

interface ReportCard {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  available: boolean;
  href?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CARDS_PER_PAGE = 8;

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'medio-ambiente',
    number: '01',
    title: 'Medio ambiente',
    subtitle:
      'Genera un informe, descargalo en excel o pdf y genera un historico Fco Qco tipo A automaticamente.',
    available: true,
    href: '/informes/medio-ambiente',
  },
  {
    id: 'fco-qco',
    number: '02',
    title: 'Fco Qco',
    subtitle: '',
    available: false,
  },
  {
    id: 'glicoles-aminas',
    number: '03',
    title: 'Glicoles y Aminas',
    subtitle: '',
    available: false,
  },
  {
    id: 'potabilidad-bacteriologico',
    number: '04',
    title: 'Potabilidad y Bacteriologico',
    subtitle: '',
    available: false,
  },
  {
    id: 'solido',
    number: '05',
    title: 'Solido',
    subtitle: '',
    available: false,
  },
];

// ── Placeholder data for charts (no real data) ──────────────────────────────

const BAR_DATA = [
  { month: 'Ene', informes: 0 },
  { month: 'Feb', informes: 0 },
  { month: 'Mar', informes: 0 },
  { month: 'Abr', informes: 0 },
  { month: 'May', informes: 0 },
  { month: 'Jun', informes: 0 },
];

const PIE_DATA = [
  { name: 'Empresa A', value: 1 },
  { name: 'Empresa B', value: 1 },
  { name: 'Empresa C', value: 1 },
];

const PIE_COLORS = ['#e5e5e5', '#d4d4d4', '#f5f5f5'];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InformesPage() {
  const [cardSearch, setCardSearch] = useState('');
  const [cardPage, setCardPage] = useState(0);

  const filteredCards = useMemo(() => {
    const q = cardSearch.trim().toLowerCase();
    if (!q) return REPORT_CARDS;
    return REPORT_CARDS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q),
    );
  }, [cardSearch]);

  const totalCardPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  const safeCardPage = Math.min(cardPage, totalCardPages - 1);
  const paginatedCards = filteredCards.slice(
    safeCardPage * CARDS_PER_PAGE,
    safeCardPage * CARDS_PER_PAGE + CARDS_PER_PAGE,
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">Informes</h1>
          <p className="mt-1 text-sm text-[#737373]">
            Genera informes e historicos de una forma mucho mas rapida.
          </p>
        </div>
        <div className="relative w-80 shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a3a3a3]" />
          <input
            type="text"
            value={cardSearch}
            onChange={(e) => {
              setCardSearch(e.target.value);
              setCardPage(0);
            }}
            placeholder="¿Qué tipo de informe querés generar?"
            className="h-9 w-full rounded-lg border border-[#e5e5e5] bg-white pl-9 pr-3 text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:border-[#006096] focus:outline-none focus:ring-1 focus:ring-[#006096]/20"
          />
        </div>
      </div>

      {/* Cards carousel */}
      <div className="flex items-center gap-2">
        {/* Arrow left — only visible when not on first page */}
        {safeCardPage > 0 && (
          <button
            type="button"
            onClick={() => setCardPage((p) => p - 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-[#525252] transition-colors hover:bg-[#fafafa]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Cards */}
        <div className="min-w-0 flex-1">
          {paginatedCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {paginatedCards.map((card) => (
                <ReportCardItem key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-white px-5 py-10 text-center">
              <p className="text-sm text-[#525252]">No se encontraron informes.</p>
            </div>
          )}
        </div>

        {/* Arrow right */}
        {safeCardPage < totalCardPages - 1 ? (
          <button
            type="button"
            onClick={() => setCardPage((p) => p + 1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-[#525252] transition-colors hover:bg-[#fafafa]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            title="Aún no hay mas tipos de informes"
          >
            <span className="text-center text-[10px] leading-tight text-[#a3a3a3]">
              Aún no hay mas
            </span>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Bar chart — Cantidad de informes */}
        <section className="relative rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
            <Lock className="h-2.5 w-2.5" />
            Proximamente
          </div>
          <h2 className="text-sm font-semibold text-[#0a0a0a]">Cantidad de informes</h2>
          <p className="mt-0.5 text-xs text-[#a3a3a3]">
            Metricas de informes generados por periodo, tipo y yacimiento.
          </p>
          <div className="mt-4 h-[200px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="informes" fill="#e5e5e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Pie chart — Distribución por empresa */}
        <section className="relative rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
            <Lock className="h-2.5 w-2.5" />
            Proximamente
          </div>
          <h2 className="text-sm font-semibold text-[#0a0a0a]">Distribución por empresa</h2>
          <p className="mt-0.5 text-xs text-[#a3a3a3]">
            Porcentaje de informes generados por cada empresa.
          </p>
          <div className="mt-4 flex h-[200px] items-center justify-center opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="none"
                >
                  {PIE_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Recent reports table */}
      <section className="relative rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
          <Lock className="h-2.5 w-2.5" />
          Proximamente
        </div>
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Histórico de informes</h2>
        <p className="mt-0.5 text-xs text-[#a3a3a3]">
          Listado de todos los informes generados con filtros avanzados.
        </p>
        <div className="mt-4 opacity-40">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-[#a3a3a3]">
                <th className="pb-2 font-medium">N° Informe</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Empresa</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="text-[#737373]">
              <tr className="border-b border-[#f5f5f5]">
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
              </tr>
              <tr className="border-b border-[#f5f5f5]">
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
              </tr>
              <tr className="border-b border-[#f5f5f5]">
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Card component ───────────────────────────────────────────────────────────

function ReportCardItem({ card }: { card: ReportCard }) {
  if (!card.available) {
    return (
      <div className="relative flex flex-col rounded-xl border border-[#e5e5e5] bg-white p-5 opacity-60">
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-medium text-[#a3a3a3]">
          <Lock className="h-2.5 w-2.5" />
          Proximamente
        </div>
        <span className="mb-3 text-2xl font-light tabular-nums text-[#d4d4d4]">{card.number}</span>
        <h3 className="text-sm font-semibold text-[#0a0a0a]">{card.title}</h3>
        {card.subtitle && (
          <p className="mt-1 flex-1 text-xs leading-relaxed text-[#a3a3a3]">{card.subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <a
      href={card.href}
      className="group flex flex-col rounded-xl border border-[#e5e5e5] bg-white p-5 transition-all hover:border-[#d4d4d4] hover:shadow-sm"
    >
      <span className="mb-3 text-2xl font-light tabular-nums text-[#006096]">{card.number}</span>
      <h3 className="text-sm font-semibold text-[#0a0a0a]">{card.title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-[#737373]">{card.subtitle}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#006096] transition-colors group-hover:text-[#004d7a]">
        Generar informe
        <ArrowRight className="h-3 w-3" />
      </div>
    </a>
  );
}
