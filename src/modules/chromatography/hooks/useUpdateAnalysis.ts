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
      const analysisIds = new Set([analysisId, updatedAnalysis.analysis_id].filter(Boolean));

      const mergeUpdatedAnalysis = (current?: ChromatographicAnalysis) =>
        current ? { ...current, ...updatedAnalysis } : updatedAnalysis;

      analysisIds.forEach((id) => {
        queryClient.setQueryData<ChromatographicAnalysis>(['analysis', id], mergeUpdatedAnalysis);
      });

      queryClient.setQueriesData<ChromatographicAnalysis>(
        {
          predicate: (query) => {
            if (query.queryKey[0] !== 'analysis') return false;

            const queryAnalysisId = query.queryKey[1];
            const cachedAnalysis = query.state.data as ChromatographicAnalysis | undefined;

            return (
              analysisIds.has(String(queryAnalysisId)) ||
              analysisIds.has(String(cachedAnalysis?.analysis_id))
            );
          },
        },
        mergeUpdatedAnalysis,
      );

      queryClient.setQueriesData<ChromatographicAnalysis[]>({ queryKey: ['analyses'] }, (current) =>
        current?.map((analysis) =>
          analysis.analysis_id === updatedAnalysis.analysis_id
            ? { ...analysis, ...updatedAnalysis }
            : analysis,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ['analyses'], refetchType: 'inactive' });
    },
  });
}
