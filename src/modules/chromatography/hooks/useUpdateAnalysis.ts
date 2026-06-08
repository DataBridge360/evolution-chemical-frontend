/**
 * Hook para actualizar un análisis cromatográfico
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateAnalysis,
  type ChromatographicAnalysisUpdate,
} from '../services/chromatographyService';

export function useUpdateAnalysis(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChromatographicAnalysisUpdate) => updateAnalysis(analysisId, data),
    onSuccess: (updatedAnalysis) => {
      // Invalidar y actualizar el caché del análisis
      queryClient.setQueryData(['chromatography-analysis', analysisId], updatedAnalysis);
      queryClient.invalidateQueries({ queryKey: ['chromatography-analysis', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['chromatography-analyses'] });
    },
  });
}
