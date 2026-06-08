'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  removing?: boolean;
  progress?: number;
}

let toastListeners: ((toast: ToastMessage) => void)[] = [];

const TOAST_DURATION = 4000; // 4 segundos

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(7);
    toastListeners.forEach((listener) => listener({ id, type: 'success', message }));
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(7);
    toastListeners.forEach((listener) => listener({ id, type: 'error', message }));
  },
  info: (message: string) => {
    const id = Math.random().toString(36).substring(7);
    toastListeners.forEach((listener) => listener({ id, type: 'info', message }));
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, { ...toast, progress: 100 }]);

      // Actualizar el progreso cada 50ms
      const progressInterval = setInterval(() => {
        setToasts((prev) =>
          prev.map((t) => {
            if (t.id === toast.id && t.progress !== undefined) {
              const newProgress = t.progress - 100 / (TOAST_DURATION / 50);
              return { ...t, progress: Math.max(0, newProgress) };
            }
            return t;
          }),
        );
      }, 50);

      // Marcar como removing y limpiar intervalo
      setTimeout(() => {
        clearInterval(progressInterval);
        setToasts((prev) => prev.map((t) => (t.id === toast.id ? { ...t, removing: true } : t)));
        // Remover después de la animación
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 400);
      }, TOAST_DURATION);
    };

    toastListeners.push(listener);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-4 top-20 z-[9999] flex flex-col gap-3"
      style={{ zIndex: 99999 }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            transform: toast.removing ? 'translateX(calc(100% + 2rem))' : 'translateX(0)',
            opacity: toast.removing ? 0 : 1,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className={`pointer-events-auto relative min-w-[320px] overflow-hidden rounded-xl border shadow-xl ${
            toast.type === 'success'
              ? 'border-green-300 bg-white'
              : toast.type === 'error'
                ? 'border-red-300 bg-white'
                : 'border-blue-300 bg-white'
          }`}
        >
          {/* Barra de progreso */}
          <div
            className="absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear"
            style={{
              width: `${toast.progress || 0}%`,
              backgroundColor:
                toast.type === 'success'
                  ? 'rgb(34, 197, 94)'
                  : toast.type === 'error'
                    ? 'rgb(239, 68, 68)'
                    : 'rgb(59, 130, 246)',
            }}
          />

          {/* Contenido */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {toast.type === 'error' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
              {toast.type === 'info' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-semibold text-gray-900">
                {toast.type === 'success' && '¡Éxito!'}
                {toast.type === 'error' && 'Error'}
                {toast.type === 'info' && 'Información'}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
