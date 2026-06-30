'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { invitationService } from '../services/InvitationService';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onInviteSent?: () => void;
}

export function InviteUserDialog({
  isOpen,
  onClose,
  companyId,
  companyName,
  onInviteSent,
}: InviteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Siempre invitar como company_admin
      await invitationService.inviteUser(companyId, {
        ...data,
        role: 'company_admin',
      });

      setSuccess(true);

      // Show success for 2 seconds then close
      setTimeout(() => {
        reset();
        setSuccess(false);
        onInviteSent?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.detail || 'Error al enviar invitación';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !success) {
      reset();
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative flex items-center justify-between bg-black p-5">
          <div>
            <h2 className="text-xl font-bold text-white">Invitar usuario</h2>
            <p className="mt-1 text-xs font-medium text-gray-300">{companyName}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            disabled={isLoading || success}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">Invitación Enviada!</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Notifica a tu cliente que verifique sus recibidos o la casilla de spam
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="group relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-gray-700" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="usuario@ejemplo.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Info message */}
            <div className="rounded-lg border-2 border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs leading-relaxed text-gray-700">
                Una vez enviada la solicitud, indica a tu cliente que verifique sus recibidos y la
                casilla de spam
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
