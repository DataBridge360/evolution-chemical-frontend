/**
 * Hook para obtener una empresa por ID con caché
 */

import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../services/CompaniesService';
import { Company } from '@/src/types/company';

export function useCompany(companyId: string) {
  return useQuery<Company>({
    queryKey: ['company', companyId],
    queryFn: () => companiesService.getCompanyById(companyId),
    // Los datos se consideran frescos durante 5 minutos
    staleTime: 5 * 60 * 1000,
    // Mantener en caché durante 15 minutos
    gcTime: 15 * 60 * 1000,
    // Solo ejecutar si tenemos un companyId válido
    enabled: !!companyId,
  });
}
