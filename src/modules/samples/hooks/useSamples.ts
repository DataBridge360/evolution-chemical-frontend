/**
 * React Query hooks para el módulo de muestras
 * Proporciona caché automático y gestión de estado optimizada
 */

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { samplesService } from '../services/SamplesService';
import { PaginatedSamplesResponse } from '@/src/types/sample';

/**
 * Hook para obtener muestras paginadas con caché automático
 *
 * @param page - Número de página (1-indexed)
 * @param limit - Cantidad de registros por página
 * @returns Query result con datos, loading state y error handling
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSamples(1, 50);
 * const samples = data?.data || [];
 * ```
 */
export function useSamples(
  page: number = 1,
  limit: number = 50,
): UseQueryResult<PaginatedSamplesResponse, Error> {
  return useQuery({
    queryKey: ['samples', page, limit],
    queryFn: () => samplesService.getAllSamplesPaginated(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutos - datos considerados frescos
    gcTime: 5 * 60 * 1000, // 5 minutos - tiempo en caché después de no uso
    retry: 1, // Reintentar una vez si falla
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
  });
}

/**
 * Hook para invalidar el caché de muestras
 * Útil después de crear, actualizar o eliminar muestras
 *
 * @returns Función para invalidar el caché
 *
 * @example
 * ```tsx
 * const invalidateSamples = useInvalidateSamples();
 *
 * const handleCreate = async () => {
 *   await samplesService.createSample(data);
 *   invalidateSamples(); // Recargar lista
 * };
 * ```
 */
export function useInvalidateSamples() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['samples'] });
  };
}

/**
 * Hook para prefetch de una página específica de muestras
 * Útil para cargar la siguiente página antes de que el usuario la solicite
 *
 * @returns Función para hacer prefetch
 *
 * @example
 * ```tsx
 * const prefetchSamples = usePrefetchSamples();
 *
 * const handlePageHover = (nextPage: number) => {
 *   prefetchSamples(nextPage, 50); // Cargar siguiente página en background
 * };
 * ```
 */
export function usePrefetchSamples() {
  const queryClient = useQueryClient();

  return (page: number, limit: number = 50) => {
    queryClient.prefetchQuery({
      queryKey: ['samples', page, limit],
      queryFn: () => samplesService.getAllSamplesPaginated(page, limit),
      staleTime: 2 * 60 * 1000,
    });
  };
}
