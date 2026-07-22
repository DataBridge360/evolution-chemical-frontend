# Plan de Implementación: Sistema de Invitación de Usuarios

## 📋 Descripción General

Sistema seguro para invitar nuevos usuarios a empresas en Evolution Chemical. Los usuarios recibirán un email atractivo que los redireccionará a una página de onboarding donde podrán completar su registro como `company_admin`.

---

## 🎯 Objetivos

1. Permitir crear invitaciones de usuarios desde el módulo de empresas
2. Enviar emails atractivos y profesionales utilizando Resend
3. Implementar flujo de onboarding seguro con Supabase Auth
4. Prevenir creación de usuarios no autorizados
5. Validar tokens de invitación con expiración
6. Mantener trazabilidad del proceso

---

## 🎨 Paleta de Colores (Evolution Chemical)

```css
/* Colores principales */
--primary: 210 100% 45%; /* Azul corporativo */
--primary-foreground: 0 0% 100%; /* Blanco */

--secondary: 25 95% 53%; /* Naranja */
--secondary-foreground: 0 0% 100%; /* Blanco */

/* Colores complementarios */
--accent: 210 100% 96%; /* Azul claro */
--accent-foreground: 210 100% 45%; /* Azul corporativo */

--muted: 220 15% 96%; /* Gris suave */
--muted-foreground: 220 10% 45%; /* Gris medio */
```

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────┐
│  Admin empresa  │
│  +Agregar User  │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│   Backend API Endpoint      │
│  POST /companies/{id}/      │
│       invite-user           │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Supabase Auth              │
│  admin.inviteUserByEmail()  │
│  + Generate Token           │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Resend Email Service       │
│  Send Invitation Email      │
│  (Custom Template)          │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Usuario recibe email       │
│  Click en botón CTA         │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Frontend: /onboarding      │
│  ?token={hash}&email={mail} │
│  &company_id={id}           │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Validar token en backend   │
│  POST /auth/validate-token  │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Usuario completa datos:    │
│  - Nombre                   │
│  - Contraseña               │
│  (Email pre-llenado)        │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Backend completa registro  │
│  POST /auth/complete-invite │
│  - Verifica token           │
│  - Crea usuario Supabase    │
│  - Asigna rol company_admin │
│  - Vincula a empresa        │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Login automático           │
│  Redirección a dashboard    │
└─────────────────────────────┘
```

---

## 🔐 Medidas de Seguridad

### 1. Validación de Tokens

```python
# Backend: Validación de token de invitación
- Token debe existir en base de datos
- Token no debe estar expirado (24 horas máximo)
- Token no debe haber sido usado previamente
- Email del token debe coincidir con el email del formulario
- Company ID debe coincidir
```

### 2. Prevención de Usuarios Mágicos

```python
# No permitir:
- Registro directo sin invitación
- Uso de tokens de otros usuarios
- Reutilización de tokens
- Modificación de company_id en la URL
- Bypass del flujo de invitación
```

### 3. Rate Limiting

```python
# Implementar límites:
- Máximo 10 invitaciones por empresa por hora
- Máximo 3 intentos de validación de token por IP
- Cooldown de 5 minutos entre reintentos
```

### 4. Validación de Email

```python
# Verificar:
- Email válido (formato)
- Email no registrado previamente en el sistema
- Email no tiene invitación pendiente
- Dominio de email permitido (opcional)
```

---

## 📊 Modelo de Datos

### Tabla: `user_invitations`

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'company_admin',
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,

  CONSTRAINT unique_pending_invitation UNIQUE (company_id, email, status)
);

-- Índices
CREATE INDEX idx_invitations_token ON user_invitations(token_hash);
CREATE INDEX idx_invitations_email ON user_invitations(email);
CREATE INDEX idx_invitations_status ON user_invitations(status);
CREATE INDEX idx_invitations_expires ON user_invitations(expires_at);
```

### Políticas RLS (Row Level Security)

```sql
-- Solo super_admin y company_admin pueden ver invitaciones de su empresa
CREATE POLICY "Users can view invitations of their company"
  ON user_invitations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM company_users
      WHERE company_id = user_invitations.company_id
    )
  );

-- Solo super_admin y company_admin pueden crear invitaciones
CREATE POLICY "Admins can create invitations"
  ON user_invitations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM company_users
      WHERE company_id = user_invitations.company_id
      AND role IN ('super_admin', 'company_admin')
    )
  );
```

---

## 🎨 Diseño del Email (Resend)

### Template HTML del Email

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitación a Evolution Chemical</title>
  </head>
  <body
    style="
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background-color: #f5f5f5;
"
  >
    <!-- Container principal -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f5f5f5; padding: 40px 0;"
    >
      <tr>
        <td align="center">
          <!-- Card del email -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        "
          >
            <!-- Header con gradiente -->
            <tr>
              <td
                style="
              background: linear-gradient(135deg, hsl(210, 100%, 45%) 0%, hsl(210, 100%, 35%) 100%);
              padding: 48px 40px;
              text-align: center;
            "
              >
                <!-- Logo -->
                <img
                  src="{{LOGO_URL}}"
                  alt="Evolution Chemical"
                  style="
                height: 48px;
                margin-bottom: 24px;
              "
                />
                <h1
                  style="
                color: white;
                font-size: 28px;
                font-weight: 600;
                margin: 0;
                line-height: 1.3;
              "
                >
                  ¡Bienvenido a Evolution Chemical!
                </h1>
              </td>
            </tr>

            <!-- Contenido -->
            <tr>
              <td style="padding: 40px;">
                <p
                  style="
                color: #333;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 24px 0;
              "
                >
                  Hola,
                </p>

                <p
                  style="
                color: #333;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 24px 0;
              "
                >
                  Has sido invitado a unirte a <strong>{{COMPANY_NAME}}</strong> en Evolution
                  Chemical.
                </p>

                <p
                  style="
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 32px 0;
              "
                >
                  Para completar tu registro y comenzar a utilizar la plataforma, haz clic en el
                  siguiente botón:
                </p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{INVITATION_URL}}"
                        style="
                      display: inline-block;
                      background: linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(25, 95%, 43%) 100%);
                      color: white;
                      text-decoration: none;
                      padding: 16px 40px;
                      border-radius: 6px;
                      font-size: 16px;
                      font-weight: 600;
                      box-shadow: 0 4px 12px rgba(251, 113, 33, 0.3);
                    "
                      >
                        Completar mi registro
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Información adicional -->
                <div
                  style="
                margin-top: 40px;
                padding-top: 32px;
                border-top: 1px solid #e5e5e5;
              "
                >
                  <p
                    style="
                  color: #666;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 0 0 16px 0;
                "
                  >
                    Tu cuenta será creada con el email: <strong>{{USER_EMAIL}}</strong>
                  </p>

                  <p
                    style="
                  color: #999;
                  font-size: 13px;
                  line-height: 1.6;
                  margin: 0;
                "
                  >
                    Esta invitación expirará en <strong>24 horas</strong>. Si no completaste la
                    solicitud, puedes ignorar este email.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
              background-color: #f9f9f9;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid #e5e5e5;
            "
              >
                <p
                  style="
                color: #999;
                font-size: 13px;
                line-height: 1.6;
                margin: 0 0 8px 0;
              "
                >
                  Evolution Chemical - Sistema de Gestión de Análisis Químicos
                </p>
                <p
                  style="
                color: #ccc;
                font-size: 12px;
                margin: 0;
              "
                >
                  © {{CURRENT_YEAR}} Evolution Chemical. Todos los derechos reservados.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Variables del Template

```typescript
interface EmailTemplateVariables {
  LOGO_URL: string; // URL del logo de Evolution Chemical
  COMPANY_NAME: string; // Nombre de la empresa invitadora
  USER_EMAIL: string; // Email del usuario invitado
  INVITATION_URL: string; // URL de onboarding con token
  CURRENT_YEAR: string; // Año actual
}
```

---

## 💻 Implementación - Backend

### 1. Endpoint: Crear Invitación

**Ruta:** `POST /api/v1/companies/{company_id}/invite-user`

**Archivo:** `backend/app/api/v1/endpoints/companies.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.services.invitation_service import InvitationService
from app.schemas.invitation import InvitationCreate, InvitationResponse

router = APIRouter()

@router.post("/{company_id}/invite-user", response_model=InvitationResponse)
async def invite_user_to_company(
    company_id: str,
    invitation_data: InvitationCreate,
    current_user = Depends(get_current_user),
    invitation_service: InvitationService = Depends()
):
    """
    Invitar un usuario a la empresa.

    Seguridad:
    - Solo super_admin o company_admin de la empresa
    - Validar que el email no esté registrado
    - Validar que no haya invitación pendiente
    - Rate limiting: 10 invitaciones/hora por empresa
    """

    # 1. Verificar permisos
    if not await invitation_service.can_invite(current_user.id, company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para invitar usuarios a esta empresa"
        )

    # 2. Validar email
    if await invitation_service.email_exists(invitation_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ya está registrado en el sistema"
        )

    # 3. Verificar invitaciones pendientes
    if await invitation_service.has_pending_invitation(
        company_id,
        invitation_data.email
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una invitación pendiente para este email"
        )

    # 4. Verificar rate limit
    if not await invitation_service.check_rate_limit(company_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Has alcanzado el límite de invitaciones por hora"
        )

    # 5. Crear invitación
    invitation = await invitation_service.create_invitation(
        company_id=company_id,
        email=invitation_data.email,
        role=invitation_data.role or "company_admin",
        invited_by=current_user.id
    )

    # 6. Enviar email (asíncrono)
    await invitation_service.send_invitation_email(invitation)

    return invitation
```

### 2. Servicio: InvitationService

**Archivo:** `backend/app/services/invitation_service.py`

```python
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends
from supabase import Client
from app.core.supabase import get_supabase_client
from app.services.email_service import EmailService

class InvitationService:
    def __init__(
        self,
        supabase: Client = Depends(get_supabase_client),
        email_service: EmailService = Depends()
    ):
        self.supabase = supabase
        self.email_service = email_service

    async def create_invitation(
        self,
        company_id: str,
        email: str,
        role: str,
        invited_by: str
    ) -> dict:
        """
        Crear invitación y generar token seguro.
        """
        # Generar token único y seguro
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        # Expiración: 24 horas
        expires_at = datetime.utcnow() + timedelta(hours=24)

        # Insertar en base de datos
        invitation = self.supabase.table("user_invitations").insert({
            "company_id": company_id,
            "email": email,
            "role": role,
            "invited_by": invited_by,
            "token_hash": token_hash,
            "status": "pending",
            "expires_at": expires_at.isoformat(),
            "metadata": {
                "raw_token": raw_token  # Solo para enviar por email
            }
        }).execute()

        return {
            **invitation.data[0],
            "raw_token": raw_token  # Devolver para generar URL
        }

    async def send_invitation_email(self, invitation: dict):
        """
        Enviar email de invitación usando Resend.
        """
        # Obtener datos de la empresa
        company = self.supabase.table("companies")\
            .select("name")\
            .eq("id", invitation["company_id"])\
            .single()\
            .execute()

        # Construir URL de invitación
        base_url = "https://evolution-chemical.com"  # Cambiar en producción
        invitation_url = (
            f"{base_url}/onboarding"
            f"?token={invitation['raw_token']}"
            f"&email={invitation['email']}"
            f"&company_id={invitation['company_id']}"
        )

        # Enviar email
        await self.email_service.send_invitation(
            to_email=invitation["email"],
            company_name=company.data["name"],
            invitation_url=invitation_url
        )

    async def validate_token(
        self,
        token: str,
        email: str
    ) -> Optional[dict]:
        """
        Validar token de invitación.

        Seguridad:
        - Token debe existir
        - Token no expirado
        - Estado = pending
        - Email coincide
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        invitation = self.supabase.table("user_invitations")\
            .select("*")\
            .eq("token_hash", token_hash)\
            .eq("email", email)\
            .eq("status", "pending")\
            .gt("expires_at", datetime.utcnow().isoformat())\
            .maybe_single()\
            .execute()

        return invitation.data if invitation.data else None

    async def can_invite(self, user_id: str, company_id: str) -> bool:
        """
        Verificar si el usuario puede invitar a otros.
        """
        user_company = self.supabase.table("company_users")\
            .select("role")\
            .eq("user_id", user_id)\
            .eq("company_id", company_id)\
            .maybe_single()\
            .execute()

        if not user_company.data:
            return False

        return user_company.data["role"] in ["super_admin", "company_admin"]

    async def check_rate_limit(self, company_id: str) -> bool:
        """
        Verificar límite de invitaciones (10/hora).
        """
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

        count = self.supabase.table("user_invitations")\
            .select("id", count="exact")\
            .eq("company_id", company_id)\
            .gte("created_at", one_hour_ago.isoformat())\
            .execute()

        return count.count < 10
```

### 3. Servicio: EmailService (Resend)

**Archivo:** `backend/app/services/email_service.py`

```python
import resend
from app.core.config import settings

class EmailService:
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    async def send_invitation(
        self,
        to_email: str,
        company_name: str,
        invitation_url: str
    ):
        """
        Enviar email de invitación usando Resend.
        """
        # Cargar template HTML
        html_content = self._get_invitation_template(
            company_name=company_name,
            user_email=to_email,
            invitation_url=invitation_url
        )

        # Enviar email
        email = resend.Emails.send({
            "from": "Evolution Chemical <invitations@evolution-chemical.com>",
            "to": to_email,
            "subject": f"Invitación a {company_name} - Evolution Chemical",
            "html": html_content
        })

        return email

    def _get_invitation_template(
        self,
        company_name: str,
        user_email: str,
        invitation_url: str
    ) -> str:
        """
        Generar HTML del email desde template.
        """
        # Leer template desde archivo
        with open("templates/emails/invitation.html", "r") as f:
            template = f.read()

        # Reemplazar variables
        return template\
            .replace("{{COMPANY_NAME}}", company_name)\
            .replace("{{USER_EMAIL}}", user_email)\
            .replace("{{INVITATION_URL}}", invitation_url)\
            .replace("{{CURRENT_YEAR}}", str(datetime.now().year))\
            .replace("{{LOGO_URL}}", settings.LOGO_URL)
```

### 4. Endpoint: Completar Invitación

**Ruta:** `POST /api/v1/auth/complete-invitation`

```python
from app.services.invitation_service import InvitationService
from app.core.supabase import get_supabase_admin

@router.post("/complete-invitation")
async def complete_invitation(
    data: CompleteInvitationRequest,
    invitation_service: InvitationService = Depends(),
    supabase_admin = Depends(get_supabase_admin)
):
    """
    Completar registro después de aceptar invitación.

    Seguridad:
    - Validar token
    - Validar que email coincida
    - Crear usuario en Supabase Auth
    - Vincular a empresa
    - Marcar invitación como aceptada
    """

    # 1. Validar token
    invitation = await invitation_service.validate_token(
        token=data.token,
        email=data.email
    )

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )

    # 2. Crear usuario en Supabase Auth
    try:
        auth_user = supabase_admin.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,  # Confirmar email automáticamente
            "user_metadata": {
                "name": data.name,
                "company_id": invitation["company_id"],
                "invited_by": invitation["invited_by"]
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        )

    # 3. Vincular a empresa
    supabase_admin.table("company_users").insert({
        "user_id": auth_user.user.id,
        "company_id": invitation["company_id"],
        "role": invitation["role"]
    }).execute()

    # 4. Marcar invitación como aceptada
    supabase_admin.table("user_invitations").update({
        "status": "accepted",
        "accepted_at": datetime.utcnow().isoformat()
    }).eq("id", invitation["id"]).execute()

    # 5. Generar tokens de sesión
    session = supabase_admin.auth.sign_in_with_password({
        "email": data.email,
        "password": data.password
    })

    return {
        "user": auth_user.user,
        "session": session
    }
```

---

## 💻 Implementación - Frontend

### 1. Servicio: InvitationService

**Archivo:** `frontend/src/modules/invitations/services/InvitationService.ts`

```typescript
import { apiClient } from '@/src/lib/api/client';

interface InviteUserDto {
  email: string;
  role?: string;
}

interface CompleteInvitationDto {
  token: string;
  email: string;
  name: string;
  password: string;
}

class InvitationService {
  /**
   * Invitar usuario a una empresa
   */
  async inviteUser(companyId: string, data: InviteUserDto) {
    const response = await apiClient.post(`/companies/${companyId}/invite-user`, data, true);
    return response.data;
  }

  /**
   * Validar token de invitación
   */
  async validateInvitation(token: string, email: string) {
    const response = await apiClient.post('/auth/validate-invitation', { token, email }, false);
    return response.data;
  }

  /**
   * Completar registro después de invitación
   */
  async completeInvitation(data: CompleteInvitationDto) {
    const response = await apiClient.post('/auth/complete-invitation', data, false);

    // Guardar tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }
}

export const invitationService = new InvitationService();
```

### 2. Componente: InviteUserButton

**Archivo:** `frontend/src/modules/companies/components/InviteUserButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { InviteUserDialog } from './InviteUserDialog';

interface InviteUserButtonProps {
  companyId: string;
  companyName: string;
}

export function InviteUserButton({ companyId, companyName }: InviteUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Agregar Usuario
      </button>

      <InviteUserDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        companyId={companyId}
        companyName={companyName}
      />
    </>
  );
}
```

### 3. Componente: InviteUserDialog

**Archivo:** `frontend/src/modules/companies/components/InviteUserDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { invitationService } from '@/src/modules/invitations/services/InvitationService';
import { toast } from '@/src/lib/toast';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['company_admin', 'user']).default('company_admin'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export function InviteUserDialog({
  isOpen,
  onClose,
  companyId,
  companyName,
}: InviteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);

    try {
      await invitationService.inviteUser(companyId, data);

      toast.success('Invitación enviada correctamente');
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al enviar invitación');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Invitar usuario a {companyName}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-input rounded-md"
              placeholder="usuario@ejemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rol
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="company_admin">Administrador</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4. Página: Onboarding

**Archivo:** `frontend/src/app/onboarding/page.tsx`

```typescript
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingForm } from '@/src/modules/invitations/components/OnboardingForm';
import { invitationService } from '@/src/modules/invitations/services/InvitationService';
import { Loader2 } from 'lucide-react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    validateInvitation();
  }, [token, email]);

  const validateInvitation = async () => {
    if (!token || !email) {
      router.push('/auth/login');
      return;
    }

    try {
      const invitation = await invitationService.validateInvitation(token, email);
      setCompanyName(invitation.company_name);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Invitación inválida</h1>
          <p className="text-muted-foreground mb-6">
            Esta invitación ha expirado o no es válida
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-2xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            {/* Logo o icono */}
            <svg className="w-8 h-8 text-primary-foreground" /* ... */ />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido a Evolution Chemical!
          </h1>

          <p className="text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">{companyName}</span> te invita a unirte a su sistema
          </p>
        </div>

        {/* Formulario */}
        <OnboardingForm
          token={token!}
          email={email!}
          companyId={companyId!}
        />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
```

### 5. Componente: OnboardingForm

**Archivo:** `frontend/src/modules/invitations/components/OnboardingForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { invitationService } from '../services/InvitationService';
import { toast } from '@/src/lib/toast';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const onboardingSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  token: string;
  email: string;
  companyId: string;
}

export function OnboardingForm({ token, email, companyId }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    try {
      await invitationService.completeInvitation({
        token,
        email,
        name: data.name,
        password: data.password,
      });

      toast.success('¡Cuenta creada exitosamente!');

      // Redirigir al dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-modal p-8">
      {/* Email pre-llenado */}
      <div className="mb-6 p-4 bg-accent rounded-lg">
        <label className="block text-sm font-medium text-accent-foreground mb-1">
          Email de la cuenta
        </label>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-semibold">{email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre completo
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Tu nombre completo"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
              placeholder="Repite tu contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creando cuenta...' : 'Completar registro'}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Al completar el registro, aceptas nuestros términos y condiciones
      </p>
    </div>
  );
}
```

---

## 📝 Schemas y Tipos

### Backend - Pydantic Schemas

**Archivo:** `backend/app/schemas/invitation.py`

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class InvitationCreate(BaseModel):
    email: EmailStr
    role: Optional[str] = "company_admin"

class InvitationResponse(BaseModel):
    id: str
    company_id: str
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

class CompleteInvitationRequest(BaseModel):
    token: str
    email: EmailStr
    name: str
    password: str
```

---

## 🔧 Configuración

### 1. Variables de Entorno - Backend

**Archivo:** `backend/.env`

```bash
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URLs
FRONTEND_URL=https://evolution-chemical.com
LOGO_URL=https://evolution-chemical.com/logo.png

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Instalación de Dependencias

**Backend:**

```bash
# Agregar Resend
pip install resend

# Actualizar requirements.txt
echo "resend==0.7.0" >> requirements.txt
```

**Frontend:**

```bash
# No se requieren dependencias adicionales
# Ya tienen react-hook-form, zod, lucide-react
```

---

## ✅ Checklist de Implementación

### Backend

- [ ] Crear tabla `user_invitations` en Supabase
- [ ] Configurar RLS policies
- [ ] Implementar `InvitationService`
- [ ] Implementar `EmailService` con Resend
- [ ] Crear endpoint `POST /companies/{id}/invite-user`
- [ ] Crear endpoint `POST /auth/validate-invitation`
- [ ] Crear endpoint `POST /auth/complete-invitation`
- [ ] Implementar rate limiting
- [ ] Crear template HTML del email
- [ ] Agregar tests unitarios
- [ ] Agregar tests de integración

### Frontend

- [ ] Crear `InvitationService`
- [ ] Crear componente `InviteUserButton`
- [ ] Crear componente `InviteUserDialog`
- [ ] Crear página `/onboarding`
- [ ] Crear componente `OnboardingForm`
- [ ] Agregar validaciones de formularios
- [ ] Implementar manejo de errores
- [ ] Agregar loading states
- [ ] Implementar redirección post-registro
- [ ] Agregar tests E2E

### Diseño

- [ ] Diseñar template de email en HTML/CSS
- [ ] Crear versión responsive del email
- [ ] Probar en diferentes clientes de email
- [ ] Diseñar página de onboarding
- [ ] Implementar animaciones suaves
- [ ] Verificar accesibilidad (a11y)

### Seguridad

- [ ] Implementar expiración de tokens (24h)
- [ ] Prevenir reutilización de tokens
- [ ] Implementar rate limiting
- [ ] Validar email en backend
- [ ] Prevenir timing attacks
- [ ] Sanitizar inputs
- [ ] Implementar CSRF protection
- [ ] Auditoría de seguridad

### Testing

- [ ] Probar flujo completo de invitación
- [ ] Probar tokens expirados
- [ ] Probar tokens inválidos
- [ ] Probar rate limiting
- [ ] Probar validaciones de email
- [ ] Probar emails en spam
- [ ] Probar en diferentes navegadores
- [ ] Probar en móviles

---

## 🚀 Flujo de Trabajo Recomendado

### Fase 1: Backend - Base de Datos (Día 1)

1. Crear migración para tabla `user_invitations`
2. Configurar RLS policies
3. Probar inserciones manuales

### Fase 2: Backend - Servicios (Día 2-3)

1. Implementar `InvitationService`
2. Implementar validación de tokens
3. Implementar rate limiting
4. Agregar tests unitarios

### Fase 3: Backend - Email (Día 4)

1. Configurar cuenta de Resend
2. Diseñar template HTML
3. Implementar `EmailService`
4. Probar envío de emails

### Fase 4: Backend - Endpoints (Día 5)

1. Crear endpoints de API
2. Implementar validaciones
3. Agregar manejo de errores
4. Probar con Postman/Insomnia

### Fase 5: Frontend - Servicios (Día 6)

1. Crear `InvitationService`
2. Implementar llamadas a API
3. Agregar manejo de errores

### Fase 6: Frontend - Componentes (Día 7-8)

1. Crear `InviteUserButton` y `InviteUserDialog`
2. Integrar en módulo de empresas
3. Probar flujo de invitación

### Fase 7: Frontend - Onboarding (Día 9-10)

1. Crear página `/onboarding`
2. Implementar `OnboardingForm`
3. Agregar validaciones
4. Implementar redirección post-registro

### Fase 8: Testing & Refinamiento (Día 11-12)

1. Tests E2E completos
2. Pruebas de seguridad
3. Optimización de UX
4. Corrección de bugs

### Fase 9: Deployment (Día 13)

1. Deploy a staging
2. Pruebas finales
3. Deploy a producción
4. Monitoreo

---

## 🎯 Métricas de Éxito

- **Tiempo de invitación:** < 2 segundos
- **Tiempo de carga onboarding:** < 1 segundo
- **Tasa de emails entregados:** > 99%
- **Tasa de completación:** > 80%
- **Errores de seguridad:** 0
- **Tiempo de expiración:** 24 horas

---

## 📚 Referencias

- [Supabase Auth - Invite Users](https://supabase.com/docs/guides/auth/auth-invite)
- [Resend Documentation](https://resend.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

## 🔄 Mantenimiento Futuro

### Tareas Recurrentes

- Limpiar invitaciones expiradas (cron job diario)
- Monitorear tasa de apertura de emails
- Revisar logs de errores
- Actualizar template de email según feedback

### Mejoras Futuras

- [ ] Soporte para múltiples idiomas
- [ ] Personalización de emails por empresa
- [ ] Dashboard de invitaciones pendientes
- [ ] Reenvío de invitaciones
- [ ] Notificaciones push
- [ ] Integración con SSO

---

**Última actualización:** 2026-06-19
**Versión del documento:** 1.0
**Autor:** Evolution Chemical Development Team
