/**
 * Modal de carga futurista para el análisis cromatográfico
 */

'use client';

import { useEffect, useState } from 'react';

type AnalysisStep = 'uploading' | 'calculating' | 'generating-report' | 'complete';

interface AnalysisLoadingModalProps {
  isOpen: boolean;
  currentStep: AnalysisStep;
}

interface StepConfig {
  label: string;
  description: string;
  icon: string;
  progressStart: number;
  progressEnd: number;
}

const STEPS: Record<AnalysisStep, StepConfig> = {
  uploading: {
    label: 'Porcentajes Molares',
    description: 'Extrayendo datos del cromatógrafo',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    progressStart: 0,
    progressEnd: 33,
  },
  calculating: {
    label: 'Analizando',
    description: 'Calculando propiedades del gas',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    progressStart: 34,
    progressEnd: 66,
  },
  'generating-report': {
    label: 'Generando Informe',
    description: 'Creando documento final',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    progressStart: 67,
    progressEnd: 99,
  },
  complete: {
    label: 'Completado',
    description: 'Redirigiendo al informe',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    progressStart: 100,
    progressEnd: 100,
  },
};

export default function AnalysisLoadingModal({ isOpen, currentStep }: AnalysisLoadingModalProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; duration: number }>
  >([]);

  const stepConfig = STEPS[currentStep];
  const targetProgress = stepConfig.progressEnd;

  // Generar partículas de fondo
  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 20,
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  // Animar el progreso
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev < targetProgress) {
            const increment = Math.max(1, Math.floor((targetProgress - prev) / 10));
            return Math.min(prev + increment, targetProgress);
          }
          return prev;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(0);
    }
  }, [isOpen, targetProgress]);

  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Fondo con gradiente animado */}
      <div className="animate-gradient-shift absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />

      {/* Partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="animate-float absolute h-1 w-1 rounded-full bg-cyan-400 opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Grid de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center space-y-12 px-8">
        {/* Círculo de progreso */}
        <div className="relative">
          {/* Glow exterior */}
          <div className="absolute inset-0 -m-8 animate-pulse rounded-full bg-cyan-500 opacity-20 blur-3xl" />

          {/* SVG del círculo */}
          <svg className="-rotate-90 transform" width="280" height="280">
            {/* Círculo de fondo */}
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="rgba(6, 182, 212, 0.1)"
              strokeWidth="12"
              fill="none"
            />

            {/* Círculo de progreso */}
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
            />

            {/* Gradiente */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Contenido interno del círculo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Icono de la etapa actual */}
            <div className="mb-4">
              <svg
                className="h-16 w-16 animate-pulse text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={stepConfig.icon}
                />
              </svg>
            </div>

            {/* Porcentaje */}
            <div className="text-7xl font-bold tracking-tight text-white">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {displayProgress}
              </span>
              <span className="text-5xl text-cyan-400">%</span>
            </div>
          </div>
        </div>

        {/* Información de la etapa */}
        <div className="max-w-md space-y-3 text-center">
          <h2 className="text-3xl font-bold tracking-wide text-white">{stepConfig.label}</h2>
          <p className="text-lg font-light text-cyan-300">{stepConfig.description}</p>
        </div>

        {/* Indicadores de etapa */}
        <div className="flex items-center space-x-4">
          {(['uploading', 'calculating', 'generating-report', 'complete'] as AnalysisStep[]).map(
            (step, index) => {
              const isActive = step === currentStep;
              const isCompleted = STEPS[step].progressEnd <= displayProgress;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                    h-3 w-3 rounded-full transition-all duration-500
                    ${
                      isCompleted
                        ? 'scale-125 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                        : isActive
                          ? 'scale-110 animate-pulse bg-cyan-500'
                          : 'bg-slate-700'
                    }
                  `}
                  />
                  {index < 3 && (
                    <div
                      className={`
                      h-0.5 w-16 transition-all duration-500
                      ${
                        STEPS[
                          (
                            [
                              'uploading',
                              'calculating',
                              'generating-report',
                              'complete',
                            ] as AnalysisStep[]
                          )[index + 1]
                        ].progressEnd <= displayProgress
                          ? 'bg-cyan-400'
                          : 'bg-slate-700'
                      }
                    `}
                    />
                  )}
                </div>
              );
            },
          )}
        </div>

        {/* Mensaje adicional */}
        {currentStep === 'complete' && (
          <div className="animate-fade-in text-center">
            <p className="text-sm text-cyan-300">Preparando visualización del informe...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 10s ease infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
