'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { Company } from '@/src/types/company';
import { formatDateAR } from '@/src/lib/dateUtils';
import NewCompanyDrawer from '@/src/modules/companies/components/NewCompanyDrawer';

export default function EmpresasPage() {
  const queryClient = useQueryClient();
  const { data: companies = [], isLoading: loading } = useCompanies();
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleTogglePermission = async (companyId: string, currentValue: boolean) => {
    try {
      setUpdatingPermission(companyId);
      await companiesService.updateViewResultsPermission(companyId, !currentValue);

      // Invalidar el cache para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      await queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      alert('Error al actualizar el permiso');
    } finally {
      setUpdatingPermission(null);
    }
  };

  const handleDrawerSuccess = async () => {
    // Invalidar el cache para refrescar la lista después de crear
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestión de empresas clientes</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Nueva Empresa
        </button>
      </div>

      {/* Tabla de Empresas */}
      <div className="overflow-hidden border border-border bg-white">
        {companies.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No hay empresas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Fecha de Registro
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Puede Ver Resultados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((company) => (
                  <tr key={company.company_id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{company.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{company.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDateAR(company.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleTogglePermission(company.company_id, company.can_view_results)
                        }
                        disabled={updatingPermission === company.company_id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                          company.can_view_results ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                        title={
                          company.can_view_results ? 'Click para desactivar' : 'Click para activar'
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            company.can_view_results ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        {company.can_view_results ? 'Permitido' : 'Bloqueado'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer para nueva empresa */}
      <NewCompanyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  );
}
