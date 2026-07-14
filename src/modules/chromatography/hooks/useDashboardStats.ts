import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  type DashboardRange,
  type DashboardStats,
} from '../services/chromatographyService';

export function useDashboardStats(range: DashboardRange = '7d') {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', range],
    queryFn: () => getDashboardStats(range),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
