'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, User as UserIcon, Calendar, Clock } from 'lucide-react';
import { companiesService } from '@/src/modules/companies/services/CompaniesService';
import { User, UserRole } from '@/src/types/user';
import { formatDateAR } from '@/src/lib/dateUtils';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function CompanyUsersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const companyName = searchParams.get('name') || 'Empresa';

  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, invitationsData] = await Promise.all([
          companiesService.getCompanyUsers(companyId),
          companiesService.getCompanyInvitations(companyId),
        ]);
        setUsers(usersData);
        setInvitations(invitationsData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const getRoleText = (role: UserRole) => {
    if (role === UserRole.OWNER) {
      return 'Owner';
    }
    return 'Administrador';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <button
          onClick={() => router.push('/empresas')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Usuarios de {companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? 'usuario activo' : 'usuarios activos'} •{' '}
            {invitations.length}{' '}
            {invitations.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}
          </p>
        </div>
      </div>

      {/* Usuarios Activos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Usuarios Activos</h2>
        {users.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-8 text-center">
            <UserIcon className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No hay usuarios activos</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-lg"
              >
                <div className="bg-black p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate text-lg font-bold text-white">{user.name}</h3>
                      <p className="truncate text-xs text-gray-300">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Registrado: {formatDateAR(user.created_at)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">Rol:</span> {getRoleText(user.role)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invitaciones Pendientes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Invitaciones Pendientes</h2>
        {invitations.length === 0 ? (
          <div className="rounded-xl border-2 border-gray-200 bg-white p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No hay invitaciones pendientes</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="to-gray-100/50 border-b-2 border-gray-200 bg-gradient-to-b from-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                      Fecha de Envío
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                      Fecha de Expiración
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-gray-700">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="transition-colors hover:bg-orange-50/30">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">
                        {formatDateAR(invitation.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">
                        {formatDateAR(invitation.expires_at)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          Pendiente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
