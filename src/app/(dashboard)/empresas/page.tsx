'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanies } from '@/src/modules/companies/hooks/useCompanies';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { formatDateAR } from '@/src/lib/dateUtils';
import NewCompanyDrawer from '@/src/modules/companies/components/NewCompanyDrawer';
import { useAuth } from '@/src/modules/auth/hooks/useAuth/useAuth';
import { UserRole } from '@/src/types/user';
import { InviteUserButton, ViewUsersButton } from '@/src/modules/invitations';
import { Search } from 'lucide-react';

export default function EmpresasPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: allCompanies = [], isLoading: loading } = useCompanies();

  // Filtrar empresa del usuario OWNER si tiene company_id
  const companies = useMemo(() => {
    if (user?.role === UserRole.OWNER && user?.company_id) {
      return allCompanies.filter((company) => company.company_id !== user.company_id);
    }
    return allCompanies;
  }, [allCompanies, user]);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filtrar empresas por término de búsqueda
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [companies, searchTerm]);

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
          className="rounded-full bg-gradient-to-b from-gray-800 to-black px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          Nueva Empresa
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar empresa por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Tabla de Empresas */}
      <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchTerm
              ? 'No se encontraron empresas con ese nombre.'
              : 'No hay empresas registradas.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="to-gray-100/50 border-b-2 border-gray-200 bg-gradient-to-b from-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Teléfono
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Fecha de Registro
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-gray-700">
                    Puede Ver Resultados
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-gray-700">
                    Usuarios
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.company_id} className="transition-colors hover:bg-blue-50/30">
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{company.email || '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{company.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">
                      {formatDateAR(company.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() =>
                          handleTogglePermission(company.company_id, company.can_view_results)
                        }
                        disabled={updatingPermission === company.company_id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 ${
                          company.can_view_results
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gray-300'
                        }`}
                        title={
                          company.can_view_results ? 'Click para desactivar' : 'Click para activar'
                        }
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                            company.can_view_results ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <p className="${company.can_view_results ? 'text-green-600' : 'text-gray-500'} mt-1 text-xs font-medium">
                        {company.can_view_results ? 'Permitido' : 'Bloqueado'}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <InviteUserButton
                          companyId={company.company_id}
                          companyName={company.name}
                        />
                        <ViewUsersButton
                          companyId={company.company_id}
                          companyName={company.name}
                        />
                      </div>
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
