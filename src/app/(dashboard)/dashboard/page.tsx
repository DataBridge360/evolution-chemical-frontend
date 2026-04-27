'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { StatsCards } from '@/src/modules/dashboard/components/StatsCards';

export default function DashboardPage() {
  // Por ahora, datos estáticos
  // TODO: Hacer fetch al backend para obtener estadísticas
  const stats = [
    { name: 'Total Muestras', value: 0 },
    { name: 'Total Reportes', value: 0 },
    { name: 'Total Empresas', value: 0 },
    { name: 'Muestras Pendientes', value: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Recent Samples */}
      <Card>
        <CardHeader>
          <CardTitle>Muestras Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Conecta el backend para ver las muestras recientes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
