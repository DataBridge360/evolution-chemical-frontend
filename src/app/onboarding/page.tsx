'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { OnboardingForm } from '@/src/modules/invitations/components/OnboardingForm';
import { invitationService } from '@/src/modules/invitations/services/InvitationService';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    validateInvitation();
  }, [token, email]);

  const validateInvitation = async () => {
    if (!token || !email) {
      setError('Parámetros de invitación inválidos');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    try {
      const response = await invitationService.validateInvitation(token, email);
      setCompanyName(response.company_name);
      setIsValid(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token inválido o expirado');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-orange-400">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-white" />
          <p className="font-medium text-white">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (!isValid || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-orange-400 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-modal">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold">Invitación inválida</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'Esta invitación ha expirado o no es válida'}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="rounded-md bg-primary px-6 py-2 text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center bg-gradient-to-br from-blue-600 via-blue-400 to-orange-400">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Bienvenido a Evolution Chemical S.R.L
          </h1>

          <p className="mb-3 text-lg font-light text-white/95">
            Análisis <span className="mx-2">•</span> Calidad <span className="mx-2">•</span>{' '}
            Precisión
          </p>

          <p className="text-sm text-white/90">
            <span className="font-semibold text-white">{companyName}</span> te invita a unirte a su
            sistema
          </p>
        </div>

        {/* Formulario */}
        <OnboardingForm token={token!} email={email!} companyId={companyId!} />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-orange-400">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
