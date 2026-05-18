/**
 * Hook para obtener análisis cromatográfico con caché
 */

import { useQuery } from '@tanstack/react-query';
import { getAnalysis } from '../services/chromatographyService';
import { ChromatographicAnalysis } from '../types';

export function useAnalysis(analysisId: string) {
  return useQuery<ChromatographicAnalysis>({
    queryKey: ['analysis', analysisId],
    queryFn: () => getAnalysis(analysisId),
    // Los datos se consideran frescos durante 5 minutos
    staleTime: 5 * 60 * 1000,
    // Mantener en caché durante 10 minutos
    gcTime: 10 * 60 * 1000,
  });
}
