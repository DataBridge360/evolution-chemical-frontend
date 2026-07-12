# Modulo de Historicos

Sistema para cargar informes de laboratorio (XLSX) y generar automaticamente historicos de analisis fisicoquimicos. Cada tipo de historico tiene su propia estructura de datos, parser y generador de Excel.

Actualmente el unico tipo implementado es **FQ Tipo A** (Fisicoquimico de agua Tipo A). La arquitectura esta preparada para agregar nuevos tipos (TEG, FQ Tipo B, etc.) sin tocar los existentes.

---

## Como funciona

1. Desde el **Dashboard**, el usuario hace click en "Agregar Historico".
2. Se abre un modal donde selecciona: tipo de historico, empresa, yacimiento, localidad, planta y equipo.
3. Arrastra o selecciona un archivo XLSX (informe de laboratorio).
4. El backend parsea el informe, extrae los parametros y crea un registro en la base de datos.
5. El usuario puede ver todos los registros cargados en la vista de historicos, ordenados por fecha.
6. Puede descargar un Excel identico al template de referencia con todos los registros.
7. Puede editar cualquier valor de parametro con doble click directamente desde la web.

---

## Ruta de navegacion

```
Analisis > [Localidad] > [Empresa] > Historico > [Tipo de historico]
```

En la pagina de **Historico** hay un selector de tipos. Por defecto solo aparece FQ Tipo A. Cada tipo que se agregue en el futuro aparece aca como una carpeta mas.

**URLs:**

```
/analisis/{localidad}/{companyId}/historico          --> Selector de tipo
/analisis/{localidad}/{companyId}/historico/fq-tipo-a --> Vista del historico FQ Tipo A
```

---

## Estructura del frontend

```
src/modules/historics/
  fq-type-a/
    components/
      UploadHistoricModal.tsx    # Modal de carga (multi-step)
    hooks/
      useHistoricFQTypeA.ts      # React Query hooks (list, upload, patch, delete)
    services/
      historicFQTypeAService.ts  # Llamadas a la API
    types/
      index.ts                   # Interfaces TypeScript
    constants.ts                 # Orden de columnas, headers, metadata

src/app/(dashboard)/analisis/[localidad]/[companyId]/historico/
    page.tsx                     # Selector de tipo de historico
    fq-tipo-a/
      page.tsx                   # Vista completa del historico FQ Tipo A
```

### Para agregar un nuevo tipo de historico en el frontend

1. Crear una carpeta nueva en `src/modules/historics/` con el nombre del tipo (ej: `teg/`).
2. Dentro, replicar la misma estructura: `components/`, `hooks/`, `services/`, `types/`, `constants.ts`.
3. Crear la ruta en `src/app/(dashboard)/analisis/[localidad]/[companyId]/historico/{nuevo-tipo}/page.tsx`.
4. Agregar el tipo al array `historicTypes` en `historico/page.tsx`:

```typescript
const historicTypes = [
  {
    id: 'fq-tipo-a',
    name: 'FQ Tipo A',
    description: 'Fisicoquimico de agua Tipo A',
  },
  {
    id: 'teg',
    name: 'TEG',
    description: 'Trietilenglicol',
  },
];
```

5. Actualizar el `UploadHistoricModal` para soportar el nuevo tipo (o crear uno separado).

---

## Estructura del backend

```
apps/historics/
  models.py          # Modelos Django (HistoricFQTypeA)
  serializers.py     # Serializadores DRF
  views.py           # ViewSet con endpoints (list, upload, export, patch, delete)
  urls.py            # Router con registro del ViewSet
  migrations/

services/historics/
  fq_type_a/
    constants.py       # Mappeo de filas del informe a campos, orden de columnas
    xlsx_parser.py     # Parsea el informe XLSX y extrae los parametros
    excel_generator.py # Genera el Excel de descarga a partir del template
    template.xlsx      # Archivo template original (se usa como base)

sql/
  007_create_historic_fq_type_a.sql   # Script de creacion de tabla
```

### Endpoints de la API

Todos bajo `/api/v1/historics/fq-type-a/`:

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Lista registros (filtros: `company_id`, `localidad`, `oilfield`) |
| GET | `/:id/` | Detalle de un registro |
| PATCH | `/:id/` | Edicion parcial de un registro |
| DELETE | `/:id/` | Eliminar registro |
| POST | `/upload/` | Subir informe XLSX y crear registro |
| GET | `/export.xlsx/` | Descargar Excel con formato del template |

El endpoint de listado tiene `pagination_class = None` (devuelve todos los registros, sin paginar) y ordena por `sample_date` descendente.

### Para agregar un nuevo tipo de historico en el backend

1. **Service:** Crear `services/historics/{nuevo_tipo}/` con:
   - `constants.py` - Mappeo de filas/celdas del informe a campos del modelo
   - `xlsx_parser.py` - Parser especifico para ese tipo de informe
   - `excel_generator.py` - Generador de Excel (usar template si existe)
   - `template.xlsx` - Template de referencia (si aplica)

2. **App:** Agregar al modelo en `apps/historics/models.py` (o crear modelo nuevo). Agregar serializer, viewset y registrar en `urls.py`.

3. **SQL:** Crear el script de migracion en `sql/` siguiendo la numeracion (ej: `008_create_historic_teg.sql`).

4. **Importante:** Cada tipo de historico tiene sus propios parametros, mappeos y formato de Excel. No mezclar la logica entre tipos. Mantener todo separado por carpeta.

---

## Detalle tecnico

### Parser (xlsx_parser.py)

Lee un informe XLSX de laboratorio y extrae:
- **Metadata** de celdas fijas (fecha de muestreo, fecha de informe, numero de informe, laboratorio, etc.)
- **Parametros** de filas fijas en la columna D (pH, temperatura, cloruros, etc.)

Los mappeos estan definidos en `constants.py` como diccionarios. Para FQ Tipo A son ~52 parametros que van de la fila 20 a la 71.

### Generador de Excel (excel_generator.py)

No genera el Excel desde cero. Carga el `template.xlsx` original, limpia las filas de datos (fila 16 en adelante) y las repopula con los registros de la base de datos, copiando el formato celda por celda (fuente, bordes, colores, formato numerico). Esto garantiza que el Excel descargado sea identico al template de referencia.

### Vista web (page.tsx)

Replica el formato del Excel en la web:
- Columnas de metadata (Yacimiento, Planta, Equipo, etc.) a la izquierda con `position: sticky`
- Columnas de parametros a la derecha con scroll horizontal
- Headers verticales para metadata, secciones "AGUA" / "Fisicoquimico de Agua Tipo A" / "Otros"
- Valores null se muestran como "NR"
- Edicion inline con doble click y modal de confirmacion

### Valores especiales

Los parametros se guardan como TEXT en la base de datos para soportar valores como `<0,01`, `>10`, `NR`, `ND`. El Excel generator convierte strings numericos a numeros cuando corresponde.
