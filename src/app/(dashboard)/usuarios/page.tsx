import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lista de usuarios próximamente...</p>
        </CardContent>
      </Card>
    </div>
  );
}
