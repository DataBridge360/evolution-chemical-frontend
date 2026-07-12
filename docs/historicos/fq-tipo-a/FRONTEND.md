# Historic FQ Type A - Frontend Documentation

## Module Structure

```
src/modules/historics/fq-type-a/
  types/index.ts                    # TypeScript interfaces and types
  services/historicFQTypeAService.ts # API service functions
  hooks/useHistoricFQTypeA.ts       # React Query hooks
  components/UploadHistoricModal.tsx # Multi-step upload modal

src/app/(dashboard)/
  dashboard/page.tsx                # "Agregar Historico" ActionCard + modal
  analisis/[localidad]/[companyId]/
    page.tsx                        # Company folders (added "Historico" folder)
    historico/
      page.tsx                      # Historic types listing
      fq-tipo-a/page.tsx            # Records table + Excel download
```

## Component Hierarchy

```
DashboardPage
  -> ActionCard ("Agregar Historico") -> opens UploadHistoricModal
  -> UploadHistoricModal (3 steps: config -> upload -> success)

CompanyFoldersPage
  -> Folder card "Historico" -> navigates to /historico/

HistoricoPage
  -> Folder card "FQ Tipo A" -> navigates to /historico/fq-tipo-a

HistoricoFQTipoAPage
  -> Records table with delete per row
  -> Download Excel button (exports all records)
```

## Service API Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `uploadHistoricFile(file, metadata)` | `POST /historics/fq-type-a/upload/` | Upload informe XLSX, creates record |
| `listHistoricRecords(filters)` | `GET /historics/fq-type-a/` | List records with filters |
| `getHistoricRecord(id)` | `GET /historics/fq-type-a/:id/` | Get single record |
| `deleteHistoricRecord(id)` | `DELETE /historics/fq-type-a/:id/` | Delete record |
| `downloadHistoricExcel(filters)` | `GET /historics/fq-type-a/export.xlsx/` | Download formatted Excel |

## React Query Cache Keys

- `['historic-fq-type-a', filters]` - List records (invalidated on upload/delete)

## Upload Flow

1. User clicks "Agregar Historico" on dashboard
2. Modal opens at step "config"
3. User selects: Historic type (FQ Tipo A), Company, Oilfield (SCH/EMA), Localidad
4. User advances to step "upload"
5. User drags/drops or selects an XLSX file
6. File is uploaded via `POST /historics/fq-type-a/upload/` with metadata
7. On success, modal shows confirmation with "Ver historico" button
8. "Ver historico" navigates to `/analisis/{localidad}/{companyId}/historico/fq-tipo-a`

## Types

- `Oilfield`: `'SCH' | 'EMA'`
- `HistoricFQTypeARecord`: Full record with 56 parameter fields (all `string | null`)
- `UploadHistoricMetadata`: `{ company_id, oilfield, localidad }`
- `HistoricFQTypeAFilters`: `{ company_id?, oilfield?, localidad? }`
