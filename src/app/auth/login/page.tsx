import { LoginForm } from '@/src/modules/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-primary">Evolution Chemical</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sistema de Gestión de Laboratorio</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
