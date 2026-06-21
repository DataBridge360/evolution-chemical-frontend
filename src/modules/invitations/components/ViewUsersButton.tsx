'use client';

import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

interface ViewUsersButtonProps {
  companyId: string;
  companyName: string;
}

export function ViewUsersButton({ companyId, companyName }: ViewUsersButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/empresas/${companyId}/usuarios?name=${encodeURIComponent(companyName)}`);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 px-2 py-1 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
      title="Ver usuarios"
    >
      <Eye className="h-3 w-3" />
      Ver
    </button>
  );
}
