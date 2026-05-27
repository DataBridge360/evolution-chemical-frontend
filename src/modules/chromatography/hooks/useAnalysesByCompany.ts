/**
 * Hook para obtener análisis cromatográficos filtrados por empresa con caché
 */

import { useQuery } from '@tanstack/react-query';
import { getAnalysesByCompanyId } from '../services/chromatographyService';
import { ChromatographicAnalysis } from '../types';

export function useAnalysesByCompany(companyId: string) {
  return useQuery<ChromatographicAnalysis[]>({
    queryKey: ['analyses', 'company', companyId],
    queryFn: () => getAnalysesByCompanyId(companyId),
    // Los datos se consideran frescos durante 3 minutos
    staleTime: 3 * 60 * 1000,
    // Mantener en caché durante 10 minutos
    gcTime: 10 * 60 * 1000,
    // Solo ejecutar si tenemos un companyId válido
    enabled: !!companyId,
  });
}
