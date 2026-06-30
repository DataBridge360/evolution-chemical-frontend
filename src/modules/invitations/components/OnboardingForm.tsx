'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2, User, Lock, Loader2, XCircle, Check } from 'lucide-react';
import { invitationService } from '../services/InvitationService';
import { LegalDocumentDialog } from '@/src/components/LegalDocumentDialog';
import { LEGAL_DOCUMENTS } from '@/src/lib/legal/legal-documents';

const onboardingSchema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    confirmPassword: z.string(),
    acceptTermsAndPrivacy: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos, condiciones y políticas de privacidad',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  token: string;
  email: string;
  companyId: string;
}

export function OnboardingForm({ token, email, companyId }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegalDialog, setShowLegalDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      acceptTermsAndPrivacy: false,
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Validar requisitos de contraseña
  const passwordRequirements = {
    hasMinLength: password?.length >= 8,
    hasUppercase: /[A-Z]/.test(password || ''),
    hasLowercase: /[a-z]/.test(password || ''),
    hasNumber: /[0-9]/.test(password || ''),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password || ''),
  };

  // Verificar si las contraseñas coinciden
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await invitationService.completeInvitation({
        token,
        email,
        name: data.name,
        password: data.password,
      });

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.detail || 'Error al crear cuenta';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
      {/* Email pre-llenado */}
      <div className="mb-5 rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-orange-50 p-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Email de la cuenta</label>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span className="break-all text-sm font-semibold text-gray-800">{email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-700">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <div className="group relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600" />
            <input
              {...register('name')}
              type="text"
              className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-10 pr-4 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Tu nombre completo"
              disabled={isLoading}
            />
          </div>
          {errors.name && <p className="ml-1 mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-700">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <div className="group relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-10 pr-12 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej: MiClave123!"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}

          {/* Requisitos de contraseña */}
          {password && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  {passwordRequirements.hasMinLength ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      passwordRequirements.hasMinLength
                        ? 'font-medium text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passwordRequirements.hasUppercase ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      passwordRequirements.hasUppercase
                        ? 'font-medium text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Mayúscula
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passwordRequirements.hasLowercase ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      passwordRequirements.hasLowercase
                        ? 'font-medium text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Minúscula
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passwordRequirements.hasNumber ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      passwordRequirements.hasNumber
                        ? 'font-medium text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Número
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  {passwordRequirements.hasSpecialChar ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      passwordRequirements.hasSpecialChar
                        ? 'font-medium text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Carácter especial (!@#$%...)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-700">
            Confirmar contraseña <span className="text-red-500">*</span>
          </label>
          <div className="group relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-600" />
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-10 pr-12 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Repite tu contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="ml-1 mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}

          {/* Indicador de coincidencia */}
          {confirmPassword && (
            <div className="to-gray-100/50 mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-50 p-2">
              {passwordsMatch ? (
                <>
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">
                    Las contraseñas coinciden
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                  <span className="text-xs font-semibold text-red-600">
                    Las contraseñas no coinciden
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3">
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Aceptación de términos y políticas */}
        <div className="flex items-center justify-center">
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-700">
            <input
              type="checkbox"
              {...register('acceptTermsAndPrivacy')}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              disabled={isLoading}
            />
            <span>
              Acepto los{' '}
              <button
                type="button"
                onClick={() => setShowLegalDialog(true)}
                className="text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-500"
                disabled={isLoading}
              >
                Términos, Condiciones y Políticas de Privacidad
              </button>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
        {errors.acceptTermsAndPrivacy && (
          <p className="text-center text-xs text-red-500">{errors.acceptTermsAndPrivacy.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Creando cuenta...' : 'Completar registro'}
        </button>
      </form>

      {/* Dialog */}
      <LegalDocumentDialog
        title="Términos, Condiciones y Políticas de Privacidad"
        content={LEGAL_DOCUMENTS}
        isOpen={showLegalDialog}
        onClose={() => setShowLegalDialog(false)}
      />
    </div>
  );
}
