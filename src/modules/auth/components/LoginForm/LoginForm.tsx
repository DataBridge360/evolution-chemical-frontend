'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AdvancedChemicalScene } from './AdvancedChemicalScene';
import { authService } from '../../services/AuthService';
import { Button } from '@/src/components/ui/button';
import { CoreSpinLoader } from '@/src/components/ui/core-spin-loader';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils/cn';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginMode = 'empresa' | 'laboratorio';
type LoginFormValues = z.infer<typeof loginSchema>;

const portalTitle = 'EVOLUTION';
const portalSubtitle = 'Lab Portal';
const exitDurationMs = 220;
const modeCopy = {
  empresa: {
    title: 'Compañía',
    border: 'border-amber-300',
    body: 'Portal para ver resultados de muestras, realizar solicitudes, consultar seguimiento operativo y acceder a la información técnica de cada análisis.',
  },
  laboratorio: {
    title: 'Laboratorio',
    border: 'border-cyan-300',
    body: 'Espacio de trabajo para equipos técnicos, carga de resultados, control de muestras y gestión interna del flujo analítico.',
  },
} satisfies Record<LoginMode, { title: string; border: string; body: string }>;

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('empresa');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleReady, setTitleReady] = useState(false);
  const [showScene, setShowScene] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const isLab = mode === 'laboratorio';

  useEffect(() => {
    document.body.classList.remove('logout-zooming');
    const skipBootLoader = window.sessionStorage.getItem('skip-login-boot-loader') === 'true';
    window.sessionStorage.removeItem('skip-login-boot-loader');

    if (skipBootLoader) {
      setIsBooting(false);
      requestAnimationFrame(() => setTitleReady(true));
      return;
    }

    const bootTimeout = window.setTimeout(() => {
      setIsBooting(false);
      requestAnimationFrame(() => setTitleReady(true));
    }, 90);

    return () => window.clearTimeout(bootTimeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowScene(true), 120);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    let loginSucceeded = false;

    try {
      // Llamada HTTP al backend - El backend maneja TODO el auth
      const authData = await authService.login(data.email, data.password);
      loginSucceeded = true;
      window.sessionStorage.setItem('dashboard-enter-transition', 'zoom-in');
      window.sessionStorage.setItem(
        'login-welcome-name',
        getWelcomeName(authData.user.name, authData.user.email),
      );
      const destination =
        authData.user.role === 'company_admin' ? '/company/muestras' : '/dashboard';
      router.prefetch(destination);
      setIsExiting(true);
      await wait(exitDurationMs);

      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      if (!loginSucceeded) {
        setIsLoading(false);
      }
    }
  };

  if (isBooting) {
    return (
      <main className="login-boot-loader flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <CoreSpinLoader />
      </main>
    );
  }

  return (
    <main
      className={cn(
        'login-shell is-entering relative grid min-h-screen grid-cols-1 overflow-hidden bg-slate-50 lg:grid-cols-2',
        isExiting && 'is-exiting',
      )}
    >
      <div className="login-exit-wash" aria-hidden="true" />
      <section
        className={cn(
          'login-scene-panel relative min-h-[390px] overflow-hidden px-8 py-12 text-white sm:px-12 lg:min-h-screen lg:px-16 lg:py-20',
          isLab ? 'bg-[#051328]' : 'bg-[#190d05]',
        )}
      >
        {showScene && !isExiting && <AdvancedChemicalScene mode={isLab ? 'lab' : 'company'} />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,transparent_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.56)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />

        <div
          className={cn(
            'login-left-content relative z-10 flex min-h-[310px] max-w-xl flex-col justify-center opacity-0 lg:min-h-[520px]',
            titleReady && 'login-left-content-ready',
          )}
        >
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Portal operativo
          </p>

          <ShutterTitle ready={titleReady} />

          <div className="mt-9 min-h-[136px]">
            {titleReady && <ModeIntro key={mode} mode={mode} />}
          </div>
        </div>
      </section>

      <section className="login-form-side flex items-center justify-center px-5 py-10 sm:px-8 lg:p-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-card w-full max-w-md border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-9"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-950">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-500">Accedé con tus credenciales del sistema.</p>
          </div>

          <div className="mb-8 grid grid-cols-2 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('empresa')}
              disabled={isLoading || isExiting}
              className={cn(
                'py-3 text-sm font-semibold transition',
                !isLab
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Compañía
            </button>
            <button
              type="button"
              onClick={() => setMode('laboratorio')}
              disabled={isLoading || isExiting}
              className={cn(
                'py-3 text-sm font-semibold transition',
                isLab ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Laboratorio
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@evolutionchemical.com"
                {...register('email')}
                disabled={isLoading || isExiting}
                autoComplete="email"
                className="h-12 border-slate-200 bg-slate-50 px-4 text-base focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading || isExiting}
                  autoComplete="current-password"
                  className="h-12 border-slate-200 bg-slate-50 px-4 pr-12 text-base focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-pressed={showPassword}
                  disabled={isLoading || isExiting}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              style={
                {
                  '--login-from': isLab ? '#1d4ed8' : '#ea580c',
                  '--login-via': isLab ? '#0ea5e9' : '#f59e0b',
                  '--login-to': isLab ? '#67e8f9' : '#fde047',
                } as CSSProperties
              }
              className={cn(
                'login-submit-button group relative h-12 w-full overflow-hidden text-base font-semibold text-white shadow-lg transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
                isLab
                  ? 'shadow-blue-200 hover:shadow-cyan-200'
                  : 'shadow-orange-200 hover:shadow-amber-200',
              )}
              disabled={isLoading || isExiting}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[var(--login-from)] via-[var(--login-via)] to-[var(--login-to)] transition-opacity duration-500" />
              <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.32)_45%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-[120%]" />
              <span className="relative inline-flex items-center justify-center gap-2">
                {isLoading && !isExiting && <ButtonSpinner />}
                {isExiting ? 'Acceso confirmado' : isLoading ? 'Ingresando...' : 'Ingresar'}
              </span>
            </Button>
          </div>
        </form>
      </section>
      <LoginExitStyles />
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getWelcomeName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();

  const emailName = email?.split('@')[0]?.trim();
  return emailName || 'Usuario';
}

function ModeIntro({ mode }: { mode: LoginMode }) {
  const copy = modeCopy[mode];

  return (
    <section className={cn('mode-intro max-w-md border-l pl-4 text-white', copy.border)}>
      <h2 className="text-lg font-semibold tracking-normal">{copy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/65">{copy.body}</p>

      <style jsx>{`
        .mode-intro {
          opacity: 0;
          transform: translate3d(0, 0, 0) scale(0.985);
          animation: mode-intro-in 0.72s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes mode-intro-in {
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}

function LoginExitStyles() {
  return (
    <style jsx global>{`
      .login-shell {
        transform-origin: center;
        will-change: transform, opacity;
      }

      .login-shell.is-entering:not(.is-exiting) .login-scene-panel {
        animation: login-scene-enter 0.72s ease both;
      }

      .login-shell.is-entering:not(.is-exiting) .login-card {
        animation: login-card-enter 0.78s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .login-shell.is-exiting {
        animation: login-fade-out 0.22s ease forwards;
      }

      .login-shell.is-exiting .login-exit-wash {
        animation: login-exit-wash-in 0.18s ease forwards;
      }

      .login-left-content-ready {
        animation: login-left-ready-in 0.42s ease forwards;
      }

      .login-exit-wash {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 45;
        background: #ffffff;
        opacity: 0;
      }

      @keyframes login-left-ready-in {
        from {
          opacity: 0;
          transform: translate3d(0, 8px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @keyframes login-scene-enter {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes login-card-enter {
        0% {
          opacity: 0;
          transform: translate3d(0, 14px, 0) scale(1.045);
        }
        48% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @keyframes login-fade-out {
        0% {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
        100% {
          opacity: 0;
          transform: translate3d(0, 0, 0);
        }
      }

      @keyframes login-exit-wash-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `}</style>
  );
}

function ButtonSpinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
      aria-hidden="true"
    />
  );
}

function ShutterTitle({ ready }: { ready: boolean }) {
  return (
    <div className="shutter-brand" aria-label="Evolution Lab Portal">
      <div className={cn('shutter-text', ready && 'shutter-ready')}>
        {portalTitle.split('').map((char, index) => (
          <ShutterChar key={`${char}-${index}`} char={char} index={index} />
        ))}
      </div>
      <div className={cn('shutter-text shutter-text-sub', ready && 'shutter-ready')}>
        {portalSubtitle.split('').map((char, index) => (
          <ShutterChar
            key={`${char}-${index}`}
            char={char === ' ' ? '\u00A0' : char}
            index={index + portalTitle.length}
          />
        ))}
      </div>

      <style jsx global>{`
        .shutter-brand {
          display: flex;
          flex-direction: column;
          gap: 0.18rem;
          max-width: min(100%, 35rem);
        }

        .shutter-text {
          display: flex;
          flex-wrap: nowrap;
          align-items: baseline;
          font-size: clamp(2.55rem, 6.1vw, 5.35rem);
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.92;
        }

        .shutter-text-sub {
          font-size: clamp(1.75rem, 3.9vw, 3.65rem);
          font-weight: 650;
          line-height: 1;
        }

        @media (max-width: 430px) {
          .shutter-text {
            font-size: clamp(2.15rem, 13vw, 3rem);
          }

          .shutter-text-sub {
            font-size: clamp(1.45rem, 9vw, 2.2rem);
          }
        }

        .shutter-char {
          display: inline-block;
          position: relative;
          overflow: hidden;
          line-height: 1;
        }

        .char-main {
          display: block;
          color: #ffffff;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0;
          line-height: 1;
          opacity: 0;
          text-shadow:
            0 2px 18px rgba(0, 0, 0, 0.34),
            0 0 34px rgba(255, 255, 255, 0.18);
          user-select: none;
        }

        .char-slice {
          position: absolute;
          inset: 0;
          display: block;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0;
          line-height: 1;
          opacity: 0;
          pointer-events: none;
          user-select: none;
        }

        .char-slice-top {
          color: #67e8f9;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
        }

        .char-slice-mid {
          color: #fbbf24;
          clip-path: polygon(0 35%, 100% 35%, 100% 65%, 0 65%);
        }

        .char-slice-bot {
          color: #ffffff;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
        }

        .shutter-ready .char-main {
          animation: char-fade-in 0.85s ease forwards;
          animation-delay: calc(var(--i) * 42ms + 280ms);
        }

        .shutter-ready .char-slice-top {
          animation: shutter-ltr 0.65s ease-in-out forwards;
          animation-delay: calc(var(--i) * 42ms);
        }

        .shutter-ready .char-slice-mid {
          animation: shutter-rtl 0.65s ease-in-out forwards;
          animation-delay: calc(var(--i) * 42ms + 90ms);
        }

        .shutter-ready .char-slice-bot {
          animation: shutter-ltr 0.65s ease-in-out forwards;
          animation-delay: calc(var(--i) * 42ms + 180ms);
        }

        @keyframes char-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shutter-ltr {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          18%,
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes shutter-rtl {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          18%,
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function ShutterChar({ char, index }: { char: string; index: number }) {
  return (
    <span
      className="shutter-char relative inline-block overflow-hidden leading-none"
      style={{ '--i': index } as CSSProperties}
    >
      <span className="char-main block opacity-0">{char}</span>
      <span className="char-slice char-slice-top absolute inset-0 block opacity-0">{char}</span>
      <span className="char-slice char-slice-mid absolute inset-0 block opacity-0">{char}</span>
      <span className="char-slice char-slice-bot absolute inset-0 block opacity-0">{char}</span>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 5.08A10.66 10.66 0 0 1 12 5c6.5 0 10 7 10 7a17.44 17.44 0 0 1-3.15 4.3" />
      <path d="M6.61 6.61C3.68 8.59 2 12 2 12s3.5 7 10 7a10.67 10.67 0 0 0 5.39-1.61" />
    </svg>
  );
}
