/**
 * Hook para obtener lista de análisis cromatográficos con caché
 */

import { useQuery } from '@tanstack/react-query';
import { listAnalyses } from '../services/chromatographyService';
import { ChromatographicAnalysis } from '../types';

export function useAnalysesList() {
  return useQuery<ChromatographicAnalysis[]>({
    queryKey: ['analyses'],
    queryFn: () => listAnalyses(),
    // Los datos se consideran frescos durante 2 minutos (lista puede cambiar frecuentemente)
    staleTime: 2 * 60 * 1000,
    // Mantener en caché durante 5 minutos
    gcTime: 5 * 60 * 1000,
  });
}
