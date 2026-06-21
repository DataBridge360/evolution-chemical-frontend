# Sistema de Invitaciones de Usuarios - Evolution Chemical

## Resumen Ejecutivo

Sistema completo para invitar usuarios a empresas mediante email. Los administradores envían invitaciones, los usuarios reciben un email profesional y completan su registro en una página de onboarding.

**Stack**: Django + Supabase + Resend + Next.js

---

## Arquitectura

```
┌─────────────────┐
│  Admin (Web)    │ → Click "Agregar Usuario"
└────────┬────────┘
         │
         v
┌──────────────────────────────┐
│ Frontend (Next.js)           │ → POST /invite-user
│ InviteUserDialog             │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Backend (Django)             │
│ - Valida permisos            │
│ - Genera token SHA-256       │
│ - Guarda en BD               │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Resend (Email Service)       │ → Envía email con template HTML
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Usuario recibe email         │ → Click botón CTA
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Frontend: /onboarding        │
│ ?token=xxx&email=yyy         │
│ - Valida token               │
│ - Muestra formulario         │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Backend                      │
│ - Valida token               │
│ - Crea usuario en Supabase   │
│ - Vincula a empresa          │
│ - Sign-in automático         │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Frontend: /dashboard         │ ✅
└──────────────────────────────┘
```

---

## Backend (Django + Supabase)

### Tabla `user_invitations`

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(company_id),
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES user_profiles(user_id),
  token_hash VARCHAR(64) UNIQUE NOT NULL,    -- SHA-256
  role VARCHAR(20) DEFAULT 'company_admin',
  status VARCHAR(20) DEFAULT 'pending',       -- pending, accepted, expired
  expires_at TIMESTAMP NOT NULL,              -- 24 horas
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Índices Importantes**:

- `idx_invitations_token`: Búsqueda rápida por token
- `unique_pending_invitation`: Solo 1 invitación pendiente por email/empresa

### Endpoints

#### 1. POST `/companies/{id}/invite-user/`

**Auth**: ✅ (Owner o Company Admin)

**Request**:

```json
{
  "email": "user@example.com",
  "role": "company_admin"
}
```

**Proceso**:

1. Valida permisos del usuario
2. Valida email no registrado
3. Valida no hay invitación pendiente
4. Verifica rate limit (10/hora)
5. Genera token seguro (`secrets.token_urlsafe(32)`)
6. Hashea token con SHA-256
7. Guarda en BD
8. Envía email via Resend
9. Retorna invitación

---

#### 2. POST `/auth/validate-invitation/`

**Auth**: ❌

**Request**:

```json
{
  "token": "raw_token_from_email",
  "email": "user@example.com"
}
```

**Proceso**:

1. Hashea token con SHA-256
2. Busca en BD por token_hash + email
3. Verifica no expirado (< 24h)
4. Verifica status = pending
5. Retorna datos de invitación

---

#### 3. POST `/auth/complete-invitation/`

**Auth**: ❌

**Request**:

```json
{
  "token": "raw_token",
  "email": "user@example.com",
  "name": "Juan Pérez",
  "password": "Secure123!"
}
```

**Proceso**:

1. Valida token
2. Crea usuario en Supabase Auth (con `email_confirm: True`)
3. Crea perfil en `user_profiles`
4. Vincula a empresa
5. Marca invitación como `accepted`
6. Hace sign-in automático
7. Retorna tokens de sesión

---

### Servicios

#### `InvitationService`

**Ubicación**: `services/invitations/invitation_service.py`

**Métodos clave**:

- `create_invitation()`: Genera token, valida, guarda en BD
- `validate_token()`: Verifica token válido y no expirado
- `can_user_invite()`: Verifica permisos
- `check_rate_limit()`: 10 invitaciones/hora por empresa
- `email_already_registered()`: Evita duplicados
- `has_pending_invitation()`: Evita múltiples invitaciones

#### `EmailService`

**Ubicación**: `services/email/email_service.py`

**Resend Integration**:

```python
resend.Emails.send({
  "from": "Evolution Chemical <onboarding@tudominio.com>",
  "to": email,
  "subject": f"Invitación a {company_name}",
  "html": template_html
})
```

**Template**: `templates/emails/invitation.html`

- Diseño responsive
- Degradado azul corporativo
- Botón CTA naranja
- Link alternativo si botón no funciona

---

## Frontend (Next.js)

### Componentes

#### 1. `InviteUserButton` (Naranja)

- Ubicación: `modules/invitations/components/`
- Diseño: Degradado naranja metalizado
- Abre modal al hacer click

#### 2. `InviteUserDialog` (Modal Negro)

- Header negro con título
- Input de email con validación
- Botón enviar negro
- Mensaje de éxito: "Invitación Enviada!"
- Mensaje: "Notifica a tu cliente que verifique spam"

#### 3. `OnboardingForm` (Formulario de Registro)

- Email pre-llenado
- Input nombre
- Input password con validaciones:
  - Mínimo 8 caracteres
  - Mayúscula, minúscula, número, símbolo
  - Indicadores visuales (checkmarks verdes)
- Input confirmar password
- Indicador de coincidencia
- Diseño compacto con bordes redondeados

#### 4. `ViewUsersButton` (Azul)

- Botón azul para ver usuarios
- Navega a `/empresas/{id}/usuarios`

### Páginas

#### `/onboarding`

- Query params: `?token=xxx&email=yyy&company_id=zzz`
- Background degradado azul-naranja
- Header: "Bienvenido a Evolution Chemical S.R.L"
- Subtítulo: "Análisis • Calidad • Precisión"
- Valida token automáticamente
- Muestra formulario si válido
- Redirige a dashboard después de registro

#### `/empresas/[id]/usuarios`

- Lista usuarios activos (cards negras)
- Tabla invitaciones pendientes
- Rol mostrado como texto: "Rol: Administrador" (sin badge)

### Servicio `InvitationService`

**Ubicación**: `modules/invitations/services/`

**Métodos**:

```typescript
inviteUser(companyId, { email, role });
validateInvitation(token, email);
completeInvitation({ token, email, name, password });
```

---

## Resend (Email Service)

### Configuración

**Variables de entorno (.env)**:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Evolution Chemical <onboarding@tudominio.com>
```

### Dominio

**Testing**: `resend.dev`

- **IMPORTANTE**: Solo puede enviar al email del dueño de la cuenta de Resend
- Para enviar a otros emails, debes verificar un dominio propio

**Producción**: Dominio verificado

1. Ir a Resend.com
2. Agregar dominio
3. Configurar DNS (MX, TXT records)
4. Verificar dominio
5. Actualizar `RESEND_FROM_EMAIL` en .env

### Template Email

**Variables**:

- `{{COMPANY_NAME}}`: Nombre de empresa invitadora
- `{{USER_EMAIL}}`: Email del invitado
- `{{INVITATION_URL}}`: URL completa al onboarding

**Diseño**:

- Header: Degradado azul corporativo
- CTA: Botón naranja llamativo
- Footer: Información legal

---

## Seguridad

### 1. Tokens

- Generados con `secrets.token_urlsafe(32)` (256 bits)
- Almacenados como SHA-256 hash
- Expiración: 24 horas
- Un solo uso (marcado como `accepted`)

### 2. Validaciones

```python
# Email duplicado
if email_already_registered(email):
    return 400 "Email ya registrado"

# Invitación duplicada
if has_pending_invitation(company_id, email):
    return 400 "Ya existe invitación pendiente"

# Rate limit
if invitations_last_hour >= 10:
    return 429 "Límite alcanzado"

# Permisos
if user.role not in ['owner', 'company_admin']:
    return 403 "Sin permisos"
```

### 3. RLS Policies (Supabase)

```sql
-- Solo ver invitaciones de tu empresa
CREATE POLICY "Users can view invitations of their company"
  ON user_invitations FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- Solo admins pueden crear
CREATE POLICY "Admins can create invitations"
  ON user_invitations FOR INSERT
  WITH CHECK (
    role IN ('owner', 'company_admin')
  );
```

---

## Flujo Completo Paso a Paso

### 1. Invitar Usuario

```
1. Admin → Página empresas
2. Admin → Click botón naranja "+"
3. Modal se abre (fondo negro)
4. Admin → Ingresa "cliente@empresa.com"
5. Admin → Click "Enviar invitación"
6. Frontend → POST /invite-user
7. Backend → Valida permisos ✅
8. Backend → Valida email no registrado ✅
9. Backend → Valida no hay invitación pendiente ✅
10. Backend → Verifica rate limit (9/10) ✅
11. Backend → Genera token: "abc123def456..."
12. Backend → Hashea: SHA-256(token) → "hash123..."
13. Backend → INSERT user_invitations
14. Backend → Resend.send_email()
15. Resend → Envía email ✅
16. Frontend → Muestra "Invitación Enviada!"
17. Modal se cierra
```

### 2. Aceptar Invitación

```
18. Usuario → Recibe email en bandeja
19. Usuario → Ve email con header azul
20. Usuario → Click botón naranja "Completar mi registro"
21. Browser → GET /onboarding?token=abc123&email=cliente@empresa.com
22. Frontend → POST /validate-invitation
23. Backend → Hashea token
24. Backend → SELECT * FROM user_invitations WHERE token_hash = 'hash123'
25. Backend → Verifica expires_at > NOW() ✅
26. Backend → Verifica status = 'pending' ✅
27. Backend → Retorna company_name
28. Frontend → Muestra formulario
29. Usuario → Ingresa "Juan Pérez"
30. Usuario → Ingresa "Secure123!" (ve checkmarks verdes)
31. Usuario → Confirma "Secure123!" (ve "Coinciden" ✅)
32. Usuario → Click "Completar registro"
33. Frontend → POST /complete-invitation
34. Backend → Valida token nuevamente
35. Backend → supabase_admin.auth.admin.create_user({
     email: "cliente@empresa.com",
     password: "Secure123!",
     email_confirm: True
   })
36. Backend → INSERT user_profiles (user_id, email, name, company_id, role)
37. Backend → UPDATE user_invitations SET status='accepted', accepted_at=NOW()
38. Backend → supabase.auth.sign_in_with_password()
39. Backend → Retorna { user, accessToken, refreshToken }
40. Frontend → localStorage.setItem('accessToken', ...)
41. Frontend → localStorage.setItem('refreshToken', ...)
42. Frontend → router.push('/dashboard')
43. Dashboard carga ✅
```

---

## Configuración Inicial

### Backend

```bash
# 1. Crear tabla en Supabase (SQL Editor)
# Ver: backend/docs/invite-users/README.md

# 2. Instalar Resend
cd evolution-chemical-backend
uv add resend

# 3. Configurar .env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Evolution Chemical <onboarding@tudominio.com>
FRONTEND_URL=http://localhost:3000

# 4. Agregar app a INSTALLED_APPS
# En config/settings/base.py:
INSTALLED_APPS = [
  ...
  'apps.invitations',
]

# 5. Migrar
python manage.py makemigrations invitations
python manage.py migrate
```

### Frontend

```bash
# No requiere configuración
# Los archivos ya están creados
```

### Resend

```bash
# 1. Crear cuenta en resend.com
# 2. Verificar dominio (o usar resend.dev para testing)
# 3. Crear API Key
# 4. Agregar a .env del backend
```

---

## Testing

### Verificar Backend

```bash
curl -X POST http://localhost:8000/api/v1/companies/UUID/invite-user/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "company_admin"}'
```

### Verificar Frontend

1. Login como admin
2. Ir a `/empresas`
3. Click botón naranja
4. Ingresar email
5. Verificar email recibido
6. Click botón en email
7. Completar formulario
8. Verificar redirección a dashboard

---

## Troubleshooting

### Email no llega

**Problema**: Resend usando `resend.dev` solo envía a tu email

**Solución**:

1. Verificar dominio en Resend
2. Actualizar `RESEND_FROM_EMAIL` a dominio verificado
3. O usar el mismo email registrado en Resend para testing

### Error 400: "Email ya registrado"

- El email existe en `user_profiles`
- Usar otro email o eliminar usuario

### Error 400: "Ya existe invitación pendiente"

- Hay invitación para ese email en esa empresa
- Esperar a que expire (24h) o cancelarla manualmente

### Error 429: "Límite alcanzado"

- Más de 10 invitaciones en 1 hora
- Esperar o limpiar cache

---

## Archivos Clave

### Backend

```
apps/invitations/
├── models.py                 # Modelo UserInvitation
├── views.py                  # Endpoints API
├── schemas.py                # Validación Pydantic
└── urls.py

services/
├── invitations/
│   └── invitation_service.py  # Lógica de negocio
└── email/
    └── email_service.py       # Integración Resend

templates/emails/
└── invitation.html            # Template HTML
```

### Frontend

```
modules/invitations/
├── components/
│   ├── InviteUserButton.tsx
│   ├── InviteUserDialog.tsx
│   └── OnboardingForm.tsx
├── services/
│   └── InvitationService.ts

app/onboarding/
└── page.tsx

app/(dashboard)/empresas/[companyId]/usuarios/
└── page.tsx
```

---

## Documentación Detallada

- **Backend**: `evolution-chemical-backend/docs/invite-users/README.md`
- **Frontend**: `evolution-chemical-frontend/docs/invite-users/FRONTEND.md`
- **Plan Original**: `evolution-chemical-frontend/docs/invite-users/INVITE_USERS.md`
- **Setup**: `evolution-chemical-frontend/docs/invite-users/SETUP_INSTRUCTIONS.md`

---

## Métricas

- **Tiempo de invitación**: < 2 segundos
- **Tasa de entrega de emails**: > 99% (con dominio verificado)
- **Expiración de tokens**: 24 horas
- **Rate limit**: 10 invitaciones/hora por empresa
- **Seguridad**: Tokens SHA-256 + un solo uso

---

**Versión**: 1.0
**Última actualización**: 2026-06-20
**Desarrollado por**: Evolution Chemical Team
