/**
 * React Query hooks for Historic FQ Type A records.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  HistoricFQTypeARecord,
  HistoricFQTypeAFilters,
  UploadHistoricMetadata,
} from '../types';
import {
  listHistoricRecords,
  uploadHistoricFile,
  deleteHistoricRecord,
  patchHistoricRecord,
} from '../services/historicFQTypeAService';

/**
 * Hook to list historic FQ Type A records with optional filters.
 */
export function useHistoricFQTypeAList(filters?: HistoricFQTypeAFilters) {
  return useQuery<HistoricFQTypeARecord[]>({
    queryKey: ['historic-fq-type-a', filters],
    queryFn: () => listHistoricRecords(filters),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!filters?.company_id,
  });
}

/**
 * Hook to upload an informe file and create a historic record.
 */
export function useUploadHistoric() {
  const queryClient = useQueryClient();

  return useMutation<
    HistoricFQTypeARecord,
    Error,
    { file: File; metadata: UploadHistoricMetadata }
  >({
    mutationFn: ({ file, metadata }) => uploadHistoricFile(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historic-fq-type-a'] });
    },
  });
}

/**
 * Hook to delete a historic record.
 */
export function useDeleteHistoric() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteHistoricRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historic-fq-type-a'] });
    },
  });
}

/**
 * Hook to partially update a historic record.
 */
export function usePatchHistoric() {
  const queryClient = useQueryClient();

  return useMutation<
    HistoricFQTypeARecord,
    Error,
    { id: string; data: Partial<HistoricFQTypeARecord> }
  >({
    mutationFn: ({ id, data }) => patchHistoricRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historic-fq-type-a'] });
    },
  });
}
