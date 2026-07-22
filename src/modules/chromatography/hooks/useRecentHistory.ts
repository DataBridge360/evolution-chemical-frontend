import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRecentHistory, type RecentHistoryResponse } from '../services/chromatographyService';

export function useRecentHistory(page: number = 1, pageSize: number = 5) {
  return useQuery<RecentHistoryResponse>({
    queryKey: ['recent-history', page, pageSize],
    queryFn: () => getRecentHistory(page, pageSize),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
