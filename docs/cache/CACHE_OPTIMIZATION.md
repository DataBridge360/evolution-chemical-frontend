# Optimizaciones de Cache y Rendimiento

## Resumen de Cambios

Se implementó un sistema de cache robusto usando React Query (TanStack Query) para reducir consultas innecesarias al backend y mejorar el rendimiento de la aplicación.

## Hooks Creados

### Módulo de Cromatografía

#### `useAnalysis(analysisId: string)`

- **Ruta**: `src/modules/chromatography/hooks/useAnalysis.ts`
- **Propósito**: Obtener un análisis específico por ID
- **Cache**: 5 minutos staleTime, 10 minutos gcTime
- **Uso**: Detalles de análisis individual

#### `useAnalysesList()`

- **Ruta**: `src/modules/chromatography/hooks/useAnalysesList.ts`
- **Propósito**: Obtener lista completa de análisis
- **Cache**: 2 minutos staleTime, 5 minutos gcTime
- **Uso**: Historial general, dashboard
- **Query Key**: `['analyses']`

#### `useAnalysesByCompany(companyId: string)`

- **Ruta**: `src/modules/chromatography/hooks/useAnalysesByCompany.ts`
- **Propósito**: Obtener análisis filtrados por empresa
- **Cache**: 3 minutos staleTime, 10 minutos gcTime
- **Uso**: Vista de análisis por empresa
- **Query Key**: `['analyses', 'company', companyId]`

### Módulo de Empresas

#### `useCompanies()`

- **Ruta**: `src/modules/companies/hooks/useCompanies.ts`
- **Propósito**: Obtener lista completa de empresas
- **Cache**: 5 minutos staleTime, 15 minutos gcTime
- **Uso**: Selector de empresas, listado general
- **Query Key**: `['companies']`

#### `useCompany(companyId: string)`

- **Ruta**: `src/modules/companies/hooks/useCompany.ts`
- **Propósito**: Obtener una empresa específica por ID
- **Cache**: 5 minutos staleTime, 15 minutos gcTime
- **Uso**: Detalles de empresa individual
- **Query Key**: `['company', companyId]`

## Componentes Actualizados

### 1. RecentAnalysesHistory

- **Antes**: Hacía fetch directo con `useState` y `useEffect`
- **Después**: Usa `useAnalysesList()` con cache compartido
- **Beneficio**: Cache compartido con dashboard y otras vistas

### 2. Página de Análisis por Empresa

- **Ruta**: `/analisis/[localidad]/[companyId]/croma/page.tsx`
- **Antes**: Fetch paralelo de empresa y análisis en cada mount
- **Después**: Usa `useCompany()` y `useAnalysesByCompany()`
- **Beneficio**: Cache compartido, menos requests al backend

### 3. Página de Empresas

- **Ruta**: `/empresas/page.tsx`
- **Antes**: Fetch directo con estado local
- **Después**: Usa `useCompanies()` con invalidación optimista
- **Beneficio**: Cache compartido con selectores de empresa

### 4. Página de Cromatografía (Upload)

- **Ruta**: `/cromatografia/page.tsx`
- **Antes**: Cargaba empresas en cada mount
- **Después**: Usa `useCompanies()` + invalida cache después de crear análisis
- **Beneficio**: No recarga empresas innecesariamente, cache se actualiza solo cuando cambia

### 5. Dashboard

- **Ruta**: `/dashboard/page.tsx`
- **Antes**: Fetch directo de análisis en cada mount
- **Después**: Usa `useAnalysesList()` con ordenamiento memoizado
- **Beneficio**: Cache compartido, datos frescos sin refetch constante

### 6. Análisis por Localidad

- **Ruta**: `/analisis/[localidad]/page.tsx`
- **Antes**: Fetch directo y filtrado en cada mount
- **Después**: Usa `useCompanies()` con filtrado memoizado
- **Beneficio**: Cache compartido, evita re-renders innecesarios

## Estrategia de Invalidación de Cache

### Después de Crear Análisis

```typescript
await queryClient.invalidateQueries({ queryKey: ['analyses'] });
await queryClient.invalidateQueries({ queryKey: ['analyses', 'company', selectedCompanyId] });
```

### Después de Crear/Actualizar Empresa

```typescript
await queryClient.invalidateQueries({ queryKey: ['companies'] });
await queryClient.invalidateQueries({ queryKey: ['company', companyId] });
```

## Configuración Global

**Archivo**: `src/lib/providers/QueryProvider.tsx`

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutos por defecto
    gcTime: 10 * 60 * 1000,         // 10 minutos por defecto
    retry: 1,                        // Solo 1 reintento
    refetchOnWindowFocus: false,     // No refetch al enfocar
  }
}
```

## Beneficios Obtenidos

### 1. Reducción de Requests HTTP

- **Antes**: Cada componente hacía su propio fetch, incluso para los mismos datos
- **Después**: Cache compartido entre componentes = menos requests

### 2. Mejor UX

- Datos se muestran instantáneamente si están en cache
- Loading states más cortos
- Menos spinners intermitentes

### 3. Menor Carga en el Backend

- Menos consultas duplicadas
- Requests solo cuando los datos están "stale"
- Mejor uso de recursos del servidor

### 4. Costos Reducidos

- Menos transferencia de datos
- Menor uso de CPU en backend
- Mejor escalabilidad

## Tiempos de Cache por Tipo de Dato

| Tipo de Dato         | staleTime | gcTime | Razón                          |
| -------------------- | --------- | ------ | ------------------------------ |
| Lista de análisis    | 2 min     | 5 min  | Cambia frecuentemente          |
| Análisis individual  | 5 min     | 10 min | Cambia ocasionalmente          |
| Análisis por empresa | 3 min     | 10 min | Balance entre frescura y cache |
| Lista de empresas    | 5 min     | 15 min | Cambia raramente               |
| Empresa individual   | 5 min     | 15 min | Cambia raramente               |

## Mejores Prácticas

1. **Siempre invalidar cache después de mutaciones**

   ```typescript
   await queryClient.invalidateQueries({ queryKey: ['resource'] });
   ```

2. **Usar queryKey descriptivos y jerárquicos**

   ```typescript
   ['resource', 'subresource', id];
   ```

3. **Aprovechar el cache compartido**
   - Múltiples componentes pueden usar el mismo hook
   - Los datos se comparten automáticamente

4. **Configurar staleTime apropiado**
   - Datos que cambian poco: más tiempo
   - Datos que cambian frecuentemente: menos tiempo

5. **Usar useMemo para transformaciones**
   - Evita re-cálculos innecesarios
   - Mejora performance de filtrado/ordenamiento

## Monitoreo

Para verificar el rendimiento del cache:

1. **React Query DevTools** (en desarrollo)
2. **Network tab** del navegador - verificar reducción de requests
3. **Performance tab** - verificar tiempos de render

## Futuras Optimizaciones

1. **Prefetching**: Cargar datos antes de que el usuario los necesite
2. **Optimistic Updates**: Actualizar UI antes de confirmar con backend
3. **Infinite Queries**: Para listas largas con paginación
4. **Suspense**: Mejor manejo de loading states
