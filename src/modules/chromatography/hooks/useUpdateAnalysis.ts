/**
 * Hook para actualizar un análisis cromatográfico
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateAnalysis,
  type ChromatographicAnalysisUpdate,
} from '../services/chromatographyService';
import type { ChromatographicAnalysis } from '../types';

export function useUpdateAnalysis(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChromatographicAnalysisUpdate) => updateAnalysis(analysisId, data),
    onSuccess: (updatedAnalysis) => {
      queryClient.setQueryData(['analysis', analysisId], updatedAnalysis);

      queryClient.setQueriesData<ChromatographicAnalysis[]>({ queryKey: ['analyses'] }, (current) =>
        current?.map((analysis) =>
          analysis.analysis_id === updatedAnalysis.analysis_id ? updatedAnalysis : analysis,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
