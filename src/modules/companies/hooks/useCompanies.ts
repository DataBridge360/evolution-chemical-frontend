/**
 * Hook para obtener lista de empresas con caché
 */

import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../services/CompaniesService';
import { Company } from '@/src/types/company';

export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesService.getAllCompanies(),
    // Los datos se consideran frescos durante 5 minutos (lista de empresas cambia poco)
    staleTime: 5 * 60 * 1000,
    // Mantener en caché durante 15 minutos
    gcTime: 15 * 60 * 1000,
  });
}
