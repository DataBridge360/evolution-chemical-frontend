'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { SampleType, Sample } from '@/src/types/sample';
import { samplesService } from '../../services/SamplesService';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { useAuth } from '@/src/modules/auth/hooks/useAuth';
import { SampleLabelModal } from '../SampleLabelModal';
import { SingleDateCalendar } from '@/src/components/ui/calendar';

interface CreateSampleFormData {
  sample_date: string;
  sample_type: SampleType;
  sample_type_other: string;
  contact_email: string;
  requested_analysis: string;
}

export function CreateSampleForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [createdSample, setCreatedSample] = useState<Sample | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<CreateSampleFormData>();

  const selectedType = watch('sample_type');
  const sampleDate = watch('sample_date');

  useEffect(() => {
    const loadCompanyName = async () => {
      if (user?.company_id) {
        try {
          const company = await companiesService.getCompanyById(user.company_id);
          setCompanyName(company.name);
        } catch (error) {
          console.error('Error al cargar compañía:', error);
          setCompanyName('Error al cargar');
        } finally {
          setLoadingCompany(false);
        }
      } else {
        setLoadingCompany(false);
      }
    };
    loadCompanyName();
  }, [user]);

  const onSubmit = async (data: CreateSampleFormData) => {
    try {
      setLoading(true);

      if (!user?.company_id) {
        setError('root', { message: 'No tienes una compañía asignada' });
        return;
      }

      const newSample = await samplesService.createSample({
        company_id: user.company_id,
        sample_type: data.sample_type,
        sample_type_other:
          data.sample_type === SampleType.OTRO ? data.sample_type_other : undefined,
        sample_date: data.sample_date,
        contact_email: data.contact_email,
        requested_analysis: data.requested_analysis,
      });

      setCreatedSample(newSample);
      setShowLabelModal(true);
    } catch (error: any) {
      console.error('Error al crear muestra:', error);
      setError('root', {
        message: error.response?.data?.message || 'Error al crear la muestra',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLabelModal = () => {
    setShowLabelModal(false);
    router.push('/company/muestras');
  };

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLabelModal && createdSample && (
        <SampleLabelModal sample={createdSample} onClose={handleCloseLabelModal} />
      )}

      <div className="mx-auto max-w-4xl">
        <div className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-xl font-semibold">Nueva Muestra</h2>
            <p className="mt-1 text-sm text-gray-600">
              Complete el formulario para registrar una nueva muestra
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-8 py-6">
            {/* Solicitante y Fecha */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Cliente o Solicitante:
                </label>
                <input
                  type="text"
                  value={companyName}
                  disabled
                  className="w-full border-b border-gray-900 bg-gray-50 px-2 py-1 text-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">(Automático)</p>
              </div>
              <div>
                <SingleDateCalendar
                  id="sample-date"
                  label="Fecha"
                  value={sampleDate}
                  required
                  onChange={(value) =>
                    setValue('sample_date', value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />
                <input
                  type="hidden"
                  {...register('sample_date', { required: 'Campo requerido' })}
                />
                {errors.sample_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.sample_date.message}</p>
                )}
              </div>
            </div>

            {/* Tipo de Muestra */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-900">
                Tipo de Muestra: <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-4">
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    value={SampleType.SOLIDO}
                    {...register('sample_type', { required: 'Selecciona un tipo' })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Sólido</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    value={SampleType.AGUA}
                    {...register('sample_type')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Agua</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    value={SampleType.PETROLEO}
                    {...register('sample_type')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Petróleo</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    value={SampleType.PROD_QCO}
                    {...register('sample_type')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Prod. Qco.</span>
                </label>
              </div>
              {errors.sample_type && (
                <p className="mt-2 text-sm text-red-600">{errors.sample_type.message}</p>
              )}
            </div>

            {/* Otro */}
            <div>
              <label className="mb-2 flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  value={SampleType.OTRO}
                  {...register('sample_type')}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">
                  Otro:{' '}
                  {selectedType === SampleType.OTRO && <span className="text-red-600">*</span>}
                </span>
              </label>
              {selectedType === SampleType.OTRO && (
                <>
                  <input
                    type="text"
                    {...register('sample_type_other', {
                      required: 'Especifica el tipo',
                      minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    })}
                    className="w-full border-b border-gray-900 px-2 py-1 focus:border-blue-600 focus:outline-none"
                    placeholder="Especificar tipo"
                    autoFocus
                  />
                  {errors.sample_type_other && (
                    <p className="mt-1 text-sm text-red-600">{errors.sample_type_other.message}</p>
                  )}
                </>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Email de contacto: <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                {...register('contact_email', {
                  required: 'Campo requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                className="w-full border-b border-gray-900 px-2 py-1 focus:border-blue-600 focus:outline-none"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>

            {/* Análisis */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Análisis Requerido: <span className="text-red-600">*</span>
              </label>
              <textarea
                {...register('requested_analysis', {
                  required: 'Campo requerido',
                  minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                })}
                rows={4}
                className="w-full border border-gray-900 px-3 py-2 focus:border-blue-600 focus:outline-none"
                placeholder="Describe el análisis requerido..."
              />
              {errors.requested_analysis && (
                <p className="mt-1 text-sm text-red-600">{errors.requested_analysis.message}</p>
              )}
            </div>

            {errors.root && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {errors.root.message}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Muestra'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="border border-gray-900 px-6 py-2 font-medium text-gray-900 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
