# Arquitectura E2E - Históricos FQ Tipo A

## Backend (Django REST Framework)

| Capa | Archivo | Descripción |
|------|---------|-------------|
| **Modelo** | `apps/historics/models.py` | `HistoricFQTypeA` - UUID PK, 56+ campos TextField para parámetros fisicoquímicos, FK a companies |
| **ViewSet** | `apps/historics/views.py` | `HistoricFQTypeAViewSet` - CRUD + upload + export, paginación 10/página |
| **Serializers** | `apps/historics/serializers.py` | 3 serializers: modelo completo, upload (validación archivo), export (query params) |
| **URLs** | `apps/historics/urls.py` | Base: `/api/v1/historics/fq-type-a/` |
| **Parser XLSX** | `services/historics/fq_type_a/xlsx_parser.py` | `parse_informe_xlsx()` - extrae metadata de celdas fijas + 52 parámetros del column D |
| **Excel Generator** | `services/historics/fq_type_a/excel_generator.py` | `HistoricFQTypeAExcelGenerator` - genera XLSX formateado para descarga |
| **Constantes** | `services/historics/fq_type_a/constants.py` | `INFORME_ROW_MAPPING`, `HISTORICO_COLUMN_ORDER`, headers |

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/historics/fq-type-a/upload/` | Upload XLSX/PDF y crea registro |
| `GET` | `/api/v1/historics/fq-type-a/` | Listar registros con filtros y paginación |
| `GET` | `/api/v1/historics/fq-type-a/{id}/` | Obtener registro por UUID |
| `PATCH` | `/api/v1/historics/fq-type-a/{id}/` | Actualizar registro (parcial) |
| `DELETE` | `/api/v1/historics/fq-type-a/{id}/` | Eliminar registro |
| `GET` | `/api/v1/historics/fq-type-a/export.xlsx/` | Descargar Excel formateado |

### Modelo `HistoricFQTypeA`

- **PK**: UUID auto-generado
- **FK**: `company_id` → companies (ON DELETE SET NULL)
- **Metadata**: `company_name`, `oilfield` (SCH/EMA), `plant`, `equipment`, `sample_date`, `report_date`, `report_number`, `sample_description`, `laboratory`, `localidad`, `pdt`, `source_filename`
- **Timestamps**: `created_at`, `updated_at` (auto)
- **Parámetros (todos TextField)**: 56+ campos fisicoquímicos almacenados como texto para soportar valores calificados (`<0.01`, `N/D`)

### Parser XLSX (`parse_informe_xlsx`)

- Extrae metadata de celdas fijas (C9, F9, C10, F10, C11, F11)
- Extrae 52 parámetros de columna D (filas 20-71) usando `INFORME_ROW_MAPPING`
- Normaliza valores: float/int/datetime/date/str/bool → string
- Parsea fechas en múltiples formatos → YYYY-MM-DD

### Excel Generator (`HistoricFQTypeAExcelGenerator`)

- Genera Excel desde cero (sin template)
- Sheet: "FQ A H2O"
- Headers metadata rotados 90° (columnas A-H)
- Secciones: "AGUA" (parámetros 0-47) y "Otros" (48-59)
- Coerción de valores: None → "NR", numéricos preservados, calificados como texto

### Paginación

```python
class HistoricPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 100
```

### Índices DB

- `(company_id, oilfield)`
- `(localidad)`
- `(report_number)`
- `(created_at DESC)`

---

## Frontend (Next.js + React Query)

| Capa | Archivo | Descripción |
|------|---------|-------------|
| **Tipos** | `src/modules/historics/fq-type-a/types/index.ts` | `HistoricFQTypeARecord`, `PaginatedHistoricResponse`, filtros |
| **Servicio** | `src/modules/historics/fq-type-a/services/historicFQTypeAService.ts` | Llamadas API: upload, list, get, patch, delete, export |
| **Hooks** | `src/modules/historics/fq-type-a/hooks/useHistoricFQTypeA.ts` | React Query: `useInfiniteQuery` + mutations (upload, delete, patch) |
| **Constantes** | `src/modules/historics/fq-type-a/constants.ts` | Definiciones de columnas metadata (8) + parámetros (60) |
| **Página principal** | `src/app/(dashboard)/analisis/[localidad]/[companyId]/historico/fq-tipo-a/page.tsx` | Tabla scrolleable con columnas fijas, edición inline, infinite scroll |
| **Modal upload** | `src/modules/historics/fq-type-a/components/UploadHistoricModal.tsx` | Formulario: empresa, yacimiento, planta, equipo, archivo |

### Rutas

```
/analisis/[localidad]/[companyId]/historico          → Selector de tipo histórico
/analisis/[localidad]/[companyId]/historico/fq-tipo-a → Tabla FQ Tipo A
```

Parámetros de ruta:
- `[localidad]`: Cutral-Có o Rincón de los Sauces
- `[companyId]`: UUID de empresa

### Tipos principales

```typescript
interface HistoricFQTypeARecord {
  id: string;
  company_id: string | null;
  company_name: string;
  oilfield: 'SCH' | 'EMA';
  plant: string | null;
  equipment: string | null;
  sample_date: string | null;
  report_date: string | null;
  report_number: string | null;
  sample_description: string;
  laboratory: string | null;
  localidad: string;
  pdt: string | null;
  source_filename: string | null;
  created_at: string;
  updated_at: string;
  // + 56 campos de parámetros fisicoquímicos (todos string)
}

interface PaginatedHistoricResponse {
  data: HistoricFQTypeARecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Hooks (React Query)

| Hook | Tipo | Cache |
|------|------|-------|
| `useHistoricFQTypeAList` | `useInfiniteQuery` | staleTime: 3min, gcTime: 10min |
| `useUploadHistoric` | `useMutation` | Invalida cache on success |
| `useDeleteHistoric` | `useMutation` | Invalida cache on success |
| `usePatchHistoric` | `useMutation` | Invalida cache on success |

### Servicio API

| Función | Método | Endpoint |
|---------|--------|----------|
| `uploadHistoricFile(file, metadata)` | POST | `/historics/fq-type-a/upload/` |
| `listHistoricRecords(filters)` | GET | `/historics/fq-type-a/` |
| `listHistoricRecordsPaginated(filters)` | GET | `/historics/fq-type-a/?page=X&ordering=...` |
| `getHistoricRecord(id)` | GET | `/historics/fq-type-a/{id}/` |
| `patchHistoricRecord(id, data)` | PATCH | `/historics/fq-type-a/{id}/` |
| `deleteHistoricRecord(id)` | DELETE | `/historics/fq-type-a/{id}/` |
| `downloadHistoricExcel(filters)` | GET | `/historics/fq-type-a/export.xlsx/` |

### Componente Tabla (página FQ Tipo A)

- Columnas metadata fijas a la izquierda (8 columnas: Yacimiento, Planta, Equipo, fechas, etc.)
- 60 columnas de parámetros con scroll horizontal
- Header de 3 filas: sección ("AGUA"/"Otros") → subsección → nombre parámetro
- Edición inline: doble click → input → confirmación modal → PATCH
- Infinite scroll con `IntersectionObserver`
- Ordenamiento toggle: `sample_date` / `-sample_date`
- Botón descarga Excel
- Valores nulos mostrados como "NR"

### Modal de Upload

- Panel slide-in desde la derecha (portal)
- Campos: empresa (dropdown con búsqueda), yacimiento (SCH/EMA), planta, equipo
- Drag & drop o click para archivo (XLSX, XLS, PDF, max 10MB)
- Estado de éxito con botón "Ver Histórico"
- Se abre desde el Dashboard

---

## Flujos principales

### 1. Upload

```
Dashboard → Botón "Agregar histórico"
  → UploadHistoricModal (empresa, yacimiento, planta, equipo, archivo)
  → useUploadHistoric().mutateAsync()
  → POST /api/v1/historics/fq-type-a/upload/ (FormData)
  → Backend: validación → parse_informe_xlsx() → HistoricFQTypeA.objects.create()
  → Response 201 con registro serializado
  → Invalidación cache React Query
  → Modal muestra éxito → navegación a tabla
```

### 2. Visualización

```
/analisis/{localidad}/{companyId}/historico/fq-tipo-a
  → useHistoricFQTypeAList({company_id, localidad, ordering})
  → GET /api/v1/historics/fq-type-a/?company_id=X&localidad=X&page=1&ordering=-sample_date
  → PaginatedHistoricResponse
  → Render tabla con columnas fijas + scrolleables
  → Scroll al fondo → IntersectionObserver → fetchNextPage()
```

### 3. Edición inline

```
Doble click en celda → input editable
  → Enter o blur → setPendingEdit() → modal confirmación
  → Confirmar → usePatchHistoric().mutate({id, {campo: valor}})
  → PATCH /api/v1/historics/fq-type-a/{id}/
  → Invalidación cache → re-render
```

### 4. Export Excel

```
Botón "Descargar Excel"
  → downloadHistoricExcel({company_id, localidad})
  → GET /api/v1/historics/fq-type-a/export.xlsx/?company_id=X&localidad=X
  → Backend: filtra registros → HistoricFQTypeAExcelGenerator → BytesIO
  → Frontend: descarga blob como historico_fq_tipo_a_{companyName}.xlsx
```

---

## Estructura de archivos

### Backend

```
evolution-chemical-backend/
├── apps/historics/
│   ├── models.py              # HistoricFQTypeA model
│   ├── views.py               # HistoricFQTypeAViewSet (275 líneas)
│   ├── serializers.py         # 3 serializers
│   ├── urls.py                # Router registration
│   └── migrations/
├── services/historics/fq_type_a/
│   ├── constants.py           # Mappings y headers (232 líneas)
│   ├── xlsx_parser.py         # parse_informe_xlsx() (199 líneas)
│   └── excel_generator.py     # HistoricFQTypeAExcelGenerator (282 líneas)
└── sql/
    └── 007_create_historic_fq_type_a.sql
```

### Frontend

```
evolution-chemical-frontend/
└── src/modules/historics/fq-type-a/
    ├── components/
    │   └── UploadHistoricModal.tsx
    ├── hooks/
    │   └── useHistoricFQTypeA.ts
    ├── services/
    │   └── historicFQTypeAService.ts
    ├── types/
    │   └── index.ts
    └── constants.ts
```

### Páginas

```
src/app/(dashboard)/analisis/[localidad]/[companyId]/historico/
├── page.tsx                   # Selector de tipo histórico
└── fq-tipo-a/
    └── page.tsx               # Tabla FQ Tipo A
```
