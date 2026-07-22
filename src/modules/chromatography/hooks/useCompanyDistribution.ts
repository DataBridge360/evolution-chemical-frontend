import { useQuery } from '@tanstack/react-query';
import {
  getCompanyDistribution,
  type CompanyPeriod,
  type CompanyDistributionItem,
} from '../services/chromatographyService';

export function useCompanyDistribution(period: CompanyPeriod = 'current_month') {
  return useQuery<CompanyDistributionItem[]>({
    queryKey: ['company-distribution', period],
    queryFn: () => getCompanyDistribution(period),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
