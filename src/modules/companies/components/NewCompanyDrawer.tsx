'use client';

import { useState } from 'react';
import { CreateCompanyDto, Localidad, LOCALIDAD_LABELS } from '@/src/types/company';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';

interface NewCompanyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewCompanyDrawer({ isOpen, onClose, onSuccess }: NewCompanyDrawerProps) {
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    email: '',
    phone: '',
    localidad: Localidad.CUTRAL_CO,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación básica
    if (!formData.name.trim()) {
      setErrors({ name: 'El nombre es requerido' });
      return;
    }

    try {
      setLoading(true);
      await companiesService.createCompany(formData);
      // Resetear formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        localidad: Localidad.CUTRAL_CO,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al crear empresa:', error);
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Error al crear la empresa. Intente nuevamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        localidad: Localidad.CUTRAL_CO,
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay con blur suave */}
      <div
        className={`fixed inset-0 z-[100] backdrop-blur-[2px] bg-black/20 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '40px' }}
        onClick={handleClose}
      />

      {/* Modal - centrado en el área de contenido (debajo del header) */}
      <div
        className={`fixed left-1/2 z-[110] w-full max-w-md -translate-x-1/2 transform rounded-xl bg-white shadow-2xl transition-all duration-300 ${
          isOpen ? '-translate-y-1/2 scale-100 opacity-100' : '-translate-y-1/2 scale-95 opacity-0 pointer-events-none'
        }`}
        style={{ top: 'calc(65px + (100vh - 65px) / 2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Nueva Empresa</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-full p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[calc(100vh-250px)] space-y-4 overflow-y-auto px-6 pb-5">
            {/* Error general */}
            {errors.general && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
            )}

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-900">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:opacity-50 ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="Ingrese el nombre de la empresa"
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:opacity-50 ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="correo@empresa.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-900">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:opacity-50 ${
                  errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="(299) 123-4567"
              />
              {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Localidad */}
            <div>
              <label htmlFor="localidad" className="mb-2 block text-sm font-semibold text-gray-900">
                Localidad <span className="text-red-500">*</span>
              </label>
              <select
                id="localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                disabled={loading}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:opacity-50 ${
                  errors.localidad ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
              >
                {Object.entries(LOCALIDAD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.localidad && <p className="mt-1.5 text-xs text-red-500">{errors.localidad}</p>}
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex gap-3 bg-gray-50 px-6 py-4 rounded-b-xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
