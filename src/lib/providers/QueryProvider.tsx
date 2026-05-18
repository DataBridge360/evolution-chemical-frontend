/**
 * React Query Provider
 * Maneja el caché de datos en el cliente
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Los datos se consideran "frescos" durante 5 minutos
            staleTime: 5 * 60 * 1000,
            // Mantener datos en caché durante 10 minutos
            gcTime: 10 * 60 * 1000,
            // Reintentar solo una vez en caso de error
            retry: 1,
            // No refetch automático al enfocar la ventana (opcional)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
