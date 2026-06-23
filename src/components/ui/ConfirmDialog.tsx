'use client';

import { ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Modal de alerta/confirmación reutilizable (overlay + card centrada).
 * Sustituye al confirm() nativo para acciones como "mover a la papelera" o "restaurar".
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!loading) onClose();
  };

  const confirmClasses =
    variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px] transition-all duration-300"
        style={{ top: '40px' }}
        onClick={handleClose}
      />

      {/* Modal centrado en el área de contenido */}
      <div
        className="fixed left-1/2 z-[110] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-xl bg-white shadow-2xl"
        style={{ top: 'calc(65px + (100vh - 65px) / 2)' }}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4 px-6 pt-6">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z"
              />
            </svg>
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {description && <div className="mt-1.5 text-sm text-gray-600">{description}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3 rounded-b-xl bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${confirmClasses}`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
