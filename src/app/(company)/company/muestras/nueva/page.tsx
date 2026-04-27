import { CreateSampleForm } from '@/src/modules/samples/components/CreateSampleForm';

export default function NuevaMuestraPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Nueva Muestra</h1>
      <CreateSampleForm />
    </div>
  );
}
