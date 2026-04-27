import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export default function NuevaMuestraPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Muestra</h1>
        <p className="text-muted-foreground">Registrar una nueva muestra</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Formulario próximamente...</p>
        </CardContent>
      </Card>
    </div>
  );
}
