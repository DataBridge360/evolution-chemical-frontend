/**
 * React Query hooks for Water Historic records.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WaterHistoricRecord,
  WaterHistoricFilters,
  PaginatedWaterHistoricResponse,
} from '../types';
import {
  listWaterHistoricPaginated,
  deleteWaterHistoricRecord,
  patchWaterHistoricRecord,
} from '../services/waterHistoricService';

/**
 * Hook to list water historic records with infinite scroll pagination.
 */
export function useWaterHistoricList(filters?: WaterHistoricFilters & { ordering?: string }) {
  return useInfiniteQuery<PaginatedWaterHistoricResponse>({
    queryKey: ['historic-water', filters],
    queryFn: ({ pageParam }) =>
      listWaterHistoricPaginated({
        ...filters,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!filters?.company_id,
  });
}

/**
 * Hook to delete a water historic record.
 */
export function useDeleteWaterHistoric() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteWaterHistoricRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historic-water'] });
    },
  });
}

/**
 * Hook to partially update a water historic record.
 */
export function usePatchWaterHistoric() {
  const queryClient = useQueryClient();

  return useMutation<
    WaterHistoricRecord,
    Error,
    { id: string; data: Partial<WaterHistoricRecord> }
  >({
    mutationFn: ({ id, data }) => patchWaterHistoricRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historic-water'] });
    },
  });
}
