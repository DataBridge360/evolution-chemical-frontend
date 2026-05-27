# Evolution Chemical - Frontend

Sistema de gestión de muestras y análisis de laboratorio para Evolution Chemical.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Fetch API nativo
- **Impresión**: react-to-print

## 🏗️ Arquitectura Modular

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Rutas públicas (login)
│   ├── (dashboard)/             # Panel administrativo
│   └── (company)/               # Panel de compañías
│
├── modules/                     # Módulos por dominio
│   ├── auth/                   # Autenticación
│   ├── samples/                # Gestión de muestras
│   ├── results/                # Resultados de análisis
│   ├── companies/              # Gestión de empresas
│   └── dashboard/              # Dashboard y estadísticas
│
├── components/
│   └── ui/                     # Componentes reutilizables
│
├── lib/
│   └── api/                    # Cliente HTTP y configuración
│
└── types/                      # Tipos TypeScript globales
```

## 📦 Módulos Principales

### Samples (Muestras)

- Registro de nuevas muestras
- Visualización y búsqueda de muestras
- Estados: Pendiente, Listo
- Tipos: Sólido, Agua, Petróleo, Producto Químico, Otro

### Results (Resultados)

- Carga de resultados de análisis
- Visualización de resultados por muestra
- Visualización de resultados por empresa
- Generación de informes imprimibles

### Companies (Empresas)

- Gestión de empresas cliente
- Permisos de visualización de resultados
- Asignación de muestras por empresa

### Dashboard

- Estadísticas generales
- Resumen de actividad
- Accesos rápidos

## 🎨 Sistema de Diseño

**Paleta de Colores:**

- Primary: Azul `#0066CC` / `hsl(210, 100%, 40%)`
- Secondary: Naranja `#FF6B35` / `hsl(16, 100%, 60%)`
- Background: Blanco `#FFFFFF`
- Borders: Gris claro `#E5E7EB`
- Text: Gris oscuro `#1F2937`

**Principios de Diseño:**

- Minimalista y profesional
- Sin bordes redondeados grandes
- Sin iconos decorativos
- Tipografía clara y legible
- Espaciado consistente
- Formularios simples y funcionales

## 🚀 Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd evolution-chemical-frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con la URL del backend
```

## 🔧 Variables de Entorno

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# O para producción
NEXT_PUBLIC_API_URL=https://api.evolutionchemical.com/api/v1
```

## 📜 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo (puerto 3000)

# Build
pnpm build            # Compilar para producción
pnpm start                # Iniciar servidor de producción

# Code Quality
pnpm lint             # Ejecutar ESLint
pnpm lint:fix         # Ejecutar ESLint y auto-fix
pnpm type-check       # Verificar tipos TypeScript
pnpm format           # Formatear código con Prettier
pnpm format:check     # Verificar formato con Prettier
```

## 🔄 Flujo de Desarrollo

1. **Desarrollo local**

   ```bash
   pnpm dev
   ```

   El servidor estará disponible en `http://localhost:3000`

2. **Verificar código antes de commit**

   ```bash
   pnpm type-check    # Verificar tipos
   pnpm lint          # Verificar ESLint
   pnpm format:check  # Verificar formato
   ```

3. **Build de producción**
   ```bash
   pnpm build         # Compila y optimiza
   pnpm start             # Inicia servidor de producción
   ```

## 📁 Estructura de Componentes

### UI Components (`src/components/ui/`)

- `button.tsx` - Botones con variantes
- `input.tsx` - Inputs de formulario
- `card.tsx` - Contenedores de contenido

### Module Components

Cada módulo tiene su propia carpeta de componentes:

```
src/modules/samples/
├── components/
│   ├── CreateSampleForm/
│   ├── SamplesList/
│   └── StatusBadge/
├── services/
│   └── SamplesService/
└── types/
```

## 🌐 Integración con Backend

El frontend se comunica con el backend a través de:

**API Client** (`src/lib/api/client.ts`)

- Wrapper de Fetch API
- Manejo automático de headers
- Gestión de tokens de autenticación
- Manejo centralizado de errores

**Services** (uno por módulo)

- Encapsulan llamadas al backend
- Transforman datos según necesidad
- Manejo de respuestas y errores

## 🧪 Testing

```bash
# Verificar que el build funciona
pnpm build

# Verificar tipos
pnpm type-check

# Verificar linting
pnpm lint
```

## 📱 Rutas Principales

```
/                           # Redirect a dashboard o login
/auth/login                 # Login
/dashboard                  # Dashboard principal
/muestras                   # Lista de muestras (admin)
/muestras/nueva             # Nueva muestra (admin)
/resultados                 # Resultados (admin)
/resultados/[companyId]     # Resultados por empresa
/empresas                   # Gestión de empresas
/company/muestras           # Muestras (vista empresa)
```

## 🚦 Consideraciones de Producción

- Las variables de entorno deben configurarse en el servidor
- El backend debe estar accesible desde el frontend
- Configurar CORS en el backend para permitir el dominio del frontend
- Usar HTTPS en producción
- Configurar caché de estáticos en CDN si es posible

## 📄 Licencia

Propietario - DataBridge
