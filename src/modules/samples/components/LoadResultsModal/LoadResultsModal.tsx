'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Sample } from '@/src/types/sample';
import { resultsService } from '@/src/modules/results/services/ResultsService';

interface LoadResultsModalProps {
  sample: Sample;
  onClose: () => void;
  onSuccess: () => void;
  isEditing?: boolean;
}

interface FormData {
  analysis_performed: string;
  observations?: string;
}

export function LoadResultsModal({
  sample,
  onClose,
  onSuccess,
  isEditing = false,
}: LoadResultsModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      await resultsService.createOrUpdateResult(sample.sample_id, {
        analysis_performed: data.analysis_performed,
        observations: data.observations,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al cargar resultados:', error);
      setError('root', {
        message: error.response?.data?.message || 'Error al cargar los resultados',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Resultados' : 'Cargar Resultados'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Muestra: <span className="font-medium">{sample.internal_code}</span>
              {isEditing && (
                <span className="ml-2 text-orange-600">(Reemplazando resultados existentes)</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Info de la muestra */}
          <div className="space-y-2 border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <span className="ml-2 text-gray-900">{sample.sample_type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(sample.sample_date).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Análisis Solicitado:</span>
              <p className="mt-1 text-gray-900">{sample.requested_analysis}</p>
            </div>
          </div>

          {/* Análisis Realizado */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Resultados del Análisis <span className="text-red-600">*</span>
            </label>
            <textarea
              {...register('analysis_performed', {
                required: 'Los resultados son requeridos',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
              })}
              rows={8}
              className="w-full border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
              placeholder="Describe los resultados del análisis realizado..."
            />
            {errors.analysis_performed && (
              <p className="mt-1 text-sm text-red-600">{errors.analysis_performed.message}</p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Observaciones (Opcional)
            </label>
            <textarea
              {...register('observations')}
              rows={4}
              className="w-full border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {errors.root && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Resultados'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-900 px-6 py-2 font-medium text-gray-900 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
