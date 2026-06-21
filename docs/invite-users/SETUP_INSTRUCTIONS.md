# Instrucciones de Configuración - Sistema de Invitación de Usuarios

## ✅ Implementación Completada

Hemos implementado el sistema completo de invitación de usuarios según el plan. A continuación, los pasos para finalizar la configuración.

---

## 📋 Checklist de Configuración

### Backend

#### 1. Crear tabla en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Crear tabla de invitaciones
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'company_admin',
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_invitations_token ON user_invitations(token_hash);
CREATE INDEX idx_invitations_email ON user_invitations(email);
CREATE INDEX idx_invitations_status ON user_invitations(status);
CREATE INDEX idx_invitations_expires ON user_invitations(expires_at);
CREATE INDEX idx_invitations_company_email ON user_invitations(company_id, email);
CREATE INDEX idx_invitations_company_status ON user_invitations(company_id, status);

-- Constraint único: solo una invitación pendiente por email por empresa
CREATE UNIQUE INDEX unique_pending_invitation
ON user_invitations(company_id, email)
WHERE status = 'pending';

-- RLS Policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Ver invitaciones de tu empresa
CREATE POLICY "Users can view invitations of their company"
  ON user_invitations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Solo admins pueden crear invitaciones
CREATE POLICY "Admins can create invitations"
  ON user_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND company_id = user_invitations.company_id
      AND role IN ('owner', 'company_admin')
    )
  );

-- Function para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Evolution Chemical <invitations@evolution-chemical.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000  # En producción cambiar a tu dominio
```

#### 3. Instalar Dependencia de Resend

```bash
cd evolution-chemical-backend
uv add resend
```

O si usas pip:

```bash
pip install resend
```

#### 4. Registrar App en Django Settings

Edita `config/settings/base.py` y agrega `'apps.invitations'` a `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ... otras apps ...
    'apps.authentication',
    'apps.companies',
    'apps.invitations',  # ← Agregar esta línea
    # ... otras apps ...
]
```

#### 5. Crear Migración

```bash
cd evolution-chemical-backend
python manage.py makemigrations invitations
python manage.py migrate
```

#### 6. Configurar Resend

1. Crea una cuenta en [Resend](https://resend.com)
2. Verifica tu dominio en Resend (o usa el dominio de prueba)
3. Crea una API Key
4. Agrega la API Key a tu `.env`

---

### Frontend

No requiere configuración adicional. Los archivos ya están creados.

---

## 🧪 Cómo Probar

### 1. Probar Backend (API)

Usando Postman o curl:

```bash
# 1. Invitar usuario
curl -X POST http://localhost:8000/api/v1/companies/{COMPANY_ID}/invite-user/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "company_admin"
  }'

# 2. Validar invitación (sin auth)
curl -X POST http://localhost:8000/api/v1/auth/validate-invitation/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "email": "test@example.com"
  }'

# 3. Completar invitación (sin auth)
curl -X POST http://localhost:8000/api/v1/auth/complete-invitation/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePassword123"
  }'
```

### 2. Probar Frontend

#### Integrar InviteUserButton en el módulo de empresas

Edita el archivo donde muestras los detalles de una empresa (por ejemplo, en la página de detalle de empresa o en un drawer):

```tsx
import { InviteUserButton } from '@/src/modules/invitations';

// Dentro de tu componente:
<InviteUserButton
  companyId={company.company_id}
  companyName={company.name}
  onInviteSent={() => {
    // Opcional: refrescar lista de usuarios
    console.log('Invitación enviada');
  }}
/>;
```

#### Probar flujo completo:

1. Inicia sesión como Owner o Company Admin
2. Ve a una empresa
3. Haz clic en "Agregar Usuario"
4. Ingresa un email y envía la invitación
5. Revisa el email recibido
6. Haz clic en el botón del email
7. Completa el registro en `/onboarding`
8. Verifica que se haya creado el usuario

---

## 📁 Estructura de Archivos Creados

### Backend

```
evolution-chemical-backend/
├── apps/invitations/
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py              # Modelo UserInvitation
│   ├── schemas.py             # Schemas Pydantic
│   ├── serializers.py         # DRF serializers
│   ├── views.py               # Views de API
│   └── urls.py                # URLs
├── services/
│   ├── invitations/
│   │   ├── __init__.py
│   │   └── invitation_service.py  # Lógica de negocio
│   └── email/
│       ├── __init__.py
│       └── email_service.py       # Servicio de Resend
├── templates/emails/
│   └── invitation.html        # Template HTML del email
├── config/
│   └── urls.py                # ← URLs actualizadas
├── .env.example               # ← Variables agregadas
└── pyproject.toml             # ← Resend agregado
```

### Frontend

```
evolution-chemical-frontend/
├── src/
│   ├── modules/invitations/
│   │   ├── components/
│   │   │   ├── InviteUserButton.tsx
│   │   │   ├── InviteUserDialog.tsx
│   │   │   ├── OnboardingForm.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── InvitationService.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── app/onboarding/
│       └── page.tsx           # Página de onboarding
└── docs/invite-users/
    ├── INVITE_USERS.md        # Plan completo
    └── SETUP_INSTRUCTIONS.md  # Este archivo
```

---

## 🔐 Seguridad Implementada

✅ Tokens SHA-256 hasheados en base de datos
✅ Expiración de tokens (24 horas)
✅ Rate limiting (10 invitaciones/hora por empresa)
✅ Validación de permisos (solo owners y company_admins)
✅ Prevención de usuarios duplicados
✅ Constraint único para invitaciones pendientes
✅ RLS policies en Supabase
✅ Validación de email con Pydantic
✅ Tokens de un solo uso

---

## 📧 Template del Email

El email enviado incluye:

- Diseño responsivo profesional
- Gradiente de colores corporativos (Azul + Naranja)
- Botón CTA llamativo
- Información clara sobre la invitación
- Link alternativo si el botón no funciona
- Footer con información legal

---

## 🚀 Próximos Pasos Opcionales

1. **Agregar re-envío de invitaciones** (si expira)
2. **Dashboard de invitaciones pendientes** (para admins)
3. **Notificaciones push** cuando se acepta una invitación
4. **Lista de usuarios invitados** en la página de empresa
5. **Cancelar invitaciones pendientes**
6. **Cron job** para limpiar invitaciones expiradas
7. **Analytics** de tasa de aceptación

---

## ❓ Preguntas Frecuentes

### ¿Cómo cambio el tiempo de expiración de los tokens?

En `invitation_service.py`, cambia:

```python
TOKEN_EXPIRATION_HOURS = 24  # Cambiar a las horas deseadas
```

### ¿Cómo cambio el límite de invitaciones por hora?

En `invitation_service.py`, cambia:

```python
RATE_LIMIT_COUNT = 10  # Cambiar al número deseado
```

### ¿Qué pasa si Resend falla?

El sistema creará la invitación en la base de datos pero no enviará el email. Se registrará un warning en los logs. Podrías implementar un re-intento manual o automático.

### ¿Cómo personalizo el email?

Edita el archivo `templates/emails/invitation.html` con tu diseño personalizado.

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY not configured"

**Solución:** Agrega la variable de entorno `RESEND_API_KEY` al archivo `.env`

### Error: "Tabla user_invitations no existe"

**Solución:** Ejecuta el SQL en Supabase para crear la tabla

### Error: "No module named 'resend'"

**Solución:** Instala resend con `uv add resend` o `pip install resend`

### Los emails no llegan

**Soluciones:**

1. Verifica que la API key de Resend sea correcta
2. Verifica que el dominio esté verificado en Resend
3. Revisa los logs del backend
4. Revisa la bandeja de spam

---

## ✅ Checklist Final

- [ ] Tabla `user_invitations` creada en Supabase
- [ ] Variables de entorno configuradas (.env)
- [ ] Dependencia `resend` instalada
- [ ] App `invitations` agregada a INSTALLED_APPS
- [ ] Migraciones ejecutadas
- [ ] Cuenta de Resend configurada
- [ ] API Key de Resend obtenida
- [ ] Dominio verificado en Resend (o usando dominio de prueba)
- [ ] Backend probado con Postman/curl
- [ ] InviteUserButton integrado en módulo de empresas
- [ ] Flujo completo probado end-to-end

---

**Implementado por:** Claude Code
**Fecha:** 2026-06-19
**Versión:** 1.0
