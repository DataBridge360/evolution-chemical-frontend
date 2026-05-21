/**
 * Modal de carga para el análisis cromatográfico
 */

'use client';

import { useEffect, useState } from 'react';
import { Atom, Beaker, FileSpreadsheet, Orbit } from 'lucide-react';

type AnalysisStep = 'uploading' | 'calculating' | 'generating-report' | 'complete';

interface AnalysisLoadingModalProps {
  isOpen: boolean;
  currentStep: AnalysisStep;
}

interface StepConfig {
  label: string;
  description: string;
  progressEnd: number;
  icon: typeof FileSpreadsheet;
}

const STEPS: Record<AnalysisStep, StepConfig> = {
  uploading: {
    label: 'Lectura cromatográfica',
    description: 'Validando la planilla y extrayendo la corrida.',
    progressEnd: 28,
    icon: FileSpreadsheet,
  },
  calculating: {
    label: 'Motor de propiedades',
    description: 'Calculando composición y comportamiento del gas.',
    progressEnd: 67,
    icon: Atom,
  },
  'generating-report': {
    label: 'Consolidación técnica',
    description: 'Preparando resultados e informe.',
    progressEnd: 93,
    icon: Beaker,
  },
  complete: {
    label: 'Análisis completado',
    description: 'Redirigiendo al detalle del análisis.',
    progressEnd: 100,
    icon: Orbit,
  },
};

const STEP_ORDER: AnalysisStep[] = ['uploading', 'calculating', 'generating-report', 'complete'];

export default function AnalysisLoadingModal({ isOpen, currentStep }: AnalysisLoadingModalProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const stepConfig = STEPS[currentStep];

  useEffect(() => {
    if (!isOpen) {
      setDisplayProgress(0);
      return;
    }

    const interval = window.setInterval(() => {
      setDisplayProgress((previous) => {
        if (previous >= stepConfig.progressEnd) return previous;
        const delta = Math.max(1, Math.ceil((stepConfig.progressEnd - previous) / 10));
        return Math.min(previous + delta, stepConfig.progressEnd);
      });
    }, 90);

    return () => window.clearInterval(interval);
  }, [isOpen, stepConfig.progressEnd]);

  if (!isOpen) return null;

  const activeIndex = STEP_ORDER.indexOf(currentStep);
  const ActiveIcon = stepConfig.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(241,246,251,0.82)] px-4 backdrop-blur-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(72,142,220,0.10),transparent_26%),radial-gradient(circle_at_80%_75%,rgba(72,142,220,0.08),transparent_24%)]" />

      <div className="relative w-full max-w-[720px] overflow-hidden rounded-[28px] border border-[#d7e3f0] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#0f4f84] via-[#0b63a8] to-[#7fb8f0]" />

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-6 sm:gap-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5f2] bg-[#f5f9ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2d6b9f]">
                  <span className="h-2 w-2 rounded-full bg-[#4d96dc] shadow-[0_0_10px_rgba(77,150,220,0.55)]" />
                  Procesando muestra
                </div>
                <h2 className="mt-4 text-[clamp(1.35rem,4vw,1.8rem)] font-semibold tracking-[-0.04em] text-[#10243e]">
                  {stepConfig.label}
                </h2>
                <p className="mt-2 max-w-[44ch] text-sm leading-6 text-[#5c7086]">
                  {stepConfig.description}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-[#dce8f4] bg-[#f8fbff] p-3 text-[#0b63a8] sm:block">
                <ActiveIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                {STEP_ORDER.map((step, index) => {
                  const isActive = step === currentStep;
                  const isCompleted = index < activeIndex || currentStep === 'complete';

                  return (
                    <div key={step} className="flex items-start gap-3">
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                        <span
                          className={`absolute h-8 w-8 rounded-full border transition-all ${
                            isCompleted
                              ? 'border-[#0b63a8] bg-[#0b63a8]'
                              : isActive
                                ? 'border-[#90bee6] bg-[#eaf4ff]'
                                : 'border-[#d8e4ef] bg-white'
                          }`}
                        />
                        <span
                          className={`relative text-xs font-semibold ${
                            isCompleted
                              ? 'text-white'
                              : isActive
                                ? 'text-[#0b63a8]'
                                : 'text-[#8a9caf]'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className={`text-sm font-medium ${
                            isActive || isCompleted ? 'text-[#10243e]' : 'text-[#72859a]'
                          }`}
                        >
                          {STEPS[step].label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-[180px] w-[180px] items-center justify-center">
                  <div className="minimal-orbit absolute inset-0 rounded-full border border-[#d6e7f7]" />
                  <div className="minimal-orbit-reverse absolute inset-[18px] rounded-full border border-dashed border-[#b8d5ee]" />

                  <div className="minimal-dot absolute left-[8px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#0b63a8]" />
                  <div className="minimal-dot-delayed absolute right-[18px] top-[26px] h-2.5 w-2.5 rounded-full bg-[#7bb4ea]" />

                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 220 220"
                    aria-hidden="true"
                  >
                    <circle
                      cx="110"
                      cy="110"
                      r="76"
                      fill="none"
                      stroke="rgba(136,178,216,0.18)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="110"
                      cy="110"
                      r="76"
                      fill="none"
                      stroke="url(#minimalLoadingGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 76}`}
                      strokeDashoffset={`${2 * Math.PI * 76 * (1 - displayProgress / 100)}`}
                      className="transition-all duration-500 ease-out"
                    />
                    <defs>
                      <linearGradient
                        id="minimalLoadingGradient"
                        x1="0%"
                        x2="100%"
                        y1="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#8dc3f5" />
                        <stop offset="55%" stopColor="#0b63a8" />
                        <stop offset="100%" stopColor="#6eaee7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="relative flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-[#fbfdff] shadow-[inset_0_0_0_1px_rgba(216,228,239,0.95)]">
                    <ActiveIcon className="mb-2 h-5 w-5 text-[#0b63a8]" />
                    <p className="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-[#10243e]">
                      {displayProgress}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7395b7]">
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70859b]">
                <span>Progreso del análisis</span>
                <span>{displayProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#edf3f8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0f4f84] via-[#0b63a8] to-[#88bff1] transition-all duration-500"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .minimal-orbit {
          animation: orbit 8s linear infinite;
        }

        .minimal-orbit-reverse {
          animation: orbit 10s linear infinite reverse;
        }

        .minimal-dot {
          animation: pulse 2.2s ease-in-out infinite;
        }

        .minimal-dot-delayed {
          animation: pulse 2.8s ease-in-out infinite 0.4s;
        }

        @keyframes orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.35);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
