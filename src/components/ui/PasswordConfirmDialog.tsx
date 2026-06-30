'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  /** Mensaje de error (ej: "Contraseña incorrecta") controlado por el padre. */
  error?: string | null;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

/**
 * Modal de confirmación que exige la contraseña del usuario.
 * Se usa para la eliminación permanente (sin esperar los 7 días).
 */
export default function PasswordConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Eliminar permanentemente',
  loading = false,
  error,
  onConfirm,
  onClose,
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Resetear el campo cada vez que se abre/cierra el modal.
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    onConfirm(password);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px] transition-all duration-300"
        style={{ top: '40px' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="fixed left-1/2 z-[110] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white shadow-2xl"
        style={{ top: 'calc(65px + (100vh - 65px) / 2)' }}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4 px-6 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {description && <div className="mt-1.5 text-sm text-gray-600">{description}</div>}
          </div>
        </div>

        <div className="px-6 pt-5">
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="current-password"
              placeholder="Ingrese su contraseña para confirmar"
              className={`w-full rounded-lg border-2 px-4 py-2.5 pr-11 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-gray-50 disabled:opacity-50 ${
                error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:border-red-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3 rounded-b-xl bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </form>
    </>
  );
}
