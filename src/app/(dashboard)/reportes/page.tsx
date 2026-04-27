import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Gestión de reportes de análisis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lista de reportes próximamente...</p>
        </CardContent>
      </Card>
    </div>
  );
}
