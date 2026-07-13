'use client';

import { Users, Lock, FlaskConical, BarChart3, FileText } from 'lucide-react';

const modules = [
  { name: 'Cromatografía', icon: FlaskConical },
  { name: 'Análisis', icon: BarChart3 },
  { name: 'Reportes', icon: FileText },
];

export default function EquipoPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">Mi equipo</h1>
        <p className="mt-1 text-sm text-[#737373]">
          Gestioná los accesos de tu equipo de laboratorio
        </p>
      </div>

      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#006096]/10">
          <Users className="h-7 w-7 text-[#006096]" />
        </div>

        <h2 className="mt-5 text-lg font-semibold text-[#0a0a0a]">Próximamente</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#737373]">
          Vas a poder invitar a miembros de tu laboratorio y asignarles permisos limitados a
          módulos específicos del sistema.
        </p>

        <div className="mt-8 space-y-2">
          {modules.map((mod) => (
            <div
              key={mod.name}
              className="flex items-center gap-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-3"
            >
              <mod.icon className="h-4 w-4 text-[#a3a3a3]" />
              <span className="text-sm text-[#525252]">{mod.name}</span>
              <Lock className="ml-auto h-3.5 w-3.5 text-[#d4d4d4]" />
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-[#a3a3a3]">
          — Equipo de Desarrollo, Evolution Chemical
        </p>
      </div>
    </div>
  );
}
