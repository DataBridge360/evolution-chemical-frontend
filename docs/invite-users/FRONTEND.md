# Sistema de Invitaciones - Frontend

## Resumen

Interfaz de usuario para invitación y onboarding de nuevos usuarios en Evolution Chemical.

---

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Custom API Client con refresh automático
- **UI**: Tailwind CSS + Lucide Icons

---

## Arquitectura

### Módulo `src/modules/invitations`

```
invitations/
├── components/
│   ├── InviteUserButton.tsx      # Botón para abrir modal
│   ├── InviteUserDialog.tsx      # Modal de invitación
│   ├── OnboardingForm.tsx        # Formulario de registro
│   └── ViewUsersButton.tsx       # Ver usuarios de empresa
├── services/
│   ├── InvitationService.ts      # Cliente API
│   └── index.ts
└── index.ts
```

---

## Componentes

### 1. `InviteUserButton`

**Ubicación**: `components/InviteUserButton.tsx`

Botón naranja metalizado que abre el modal de invitación.

**Props**:

```typescript
interface InviteUserButtonProps {
  companyId: string;
  companyName: string;
  onInviteSent?: () => void;
}
```

**Uso**:

```tsx
<InviteUserButton
  companyId={company.company_id}
  companyName={company.name}
  onInviteSent={() => refetch()}
/>
```

**Diseño**:

- Degradado naranja metalizado
- Bordes redondeados (`rounded-lg`)
- Efecto hover con escala
- Ícono UserPlus + texto "+"

---

### 2. `InviteUserDialog`

**Ubicación**: `components/InviteUserDialog.tsx`

Modal negro moderno para invitar usuarios.

**Props**:

```typescript
interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onInviteSent?: () => void;
}
```

**Features**:

- Header negro con título y subtítulo
- Input de email con validación
- Botón de envío negro
- Mensaje de éxito: "Invitación Enviada!"
- Mensaje informativo sobre spam
- Bordes redondeados (`rounded-xl`)

**Validación**:

```typescript
const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
});
```

**Estados**:

- Loading: Muestra "Enviando..."
- Success: Muestra checkmark verde + mensaje
- Error: Muestra mensaje de error

---

### 3. `OnboardingForm`

**Ubicación**: `components/OnboardingForm.tsx`

Formulario para completar registro después de invitación.

**Props**:

```typescript
interface OnboardingFormProps {
  token: string;
  email: string;
  companyId: string;
}
```

**Features**:

- Email pre-llenado (solo lectura)
- Input de nombre completo
- Input de contraseña con validaciones:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial
- Indicadores visuales de requisitos (checkmarks)
- Input de confirmar contraseña
- Indicador de coincidencia de contraseñas
- Diseño compacto con bordes redondeados

**Validación**:

```typescript
const onboardingSchema = z
  .object({
    name: z.string().min(3, 'Mínimo 3 caracteres'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener mayúscula')
      .regex(/[a-z]/, 'Debe contener minúscula')
      .regex(/[0-9]/, 'Debe contener número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
```

---

### 4. `ViewUsersButton`

**Ubicación**: `components/ViewUsersButton.tsx`

Botón azul para ver usuarios de una empresa.

**Props**:

```typescript
interface ViewUsersButtonProps {
  companyId: string;
  companyName: string;
}
```

**Navegación**:

```typescript
router.push(`/empresas/${companyId}/usuarios?name=${encodeURIComponent(companyName)}`);
```

---

## Servicios

### `InvitationService`

**Ubicación**: `services/InvitationService.ts`

Cliente para comunicación con API de invitaciones.

#### Métodos

##### `inviteUser(companyId, data)`

```typescript
async inviteUser(companyId: string, data: { email: string; role?: string }) {
  const response = await apiClient.post(
    `/companies/${companyId}/invite-user/`,
    data,
    true // includeAuth
  );
  return response.data;
}
```

##### `validateInvitation(token, email)`

```typescript
async validateInvitation(token: string, email: string) {
  const response = await apiClient.post(
    '/auth/validate-invitation/',
    { token, email },
    false // sin auth
  );
  return response.data;
}
```

##### `completeInvitation(data)`

```typescript
async completeInvitation(data: CompleteInvitationDto) {
  const response = await apiClient.post(
    '/auth/complete-invitation/',
    data,
    false
  );

  // Guardar tokens en localStorage
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));

  return response.data;
}
```

---

## Páginas

### `/onboarding`

**Ubicación**: `app/onboarding/page.tsx`

Página de onboarding para nuevos usuarios invitados.

**Query Params**:

- `token`: Token de invitación
- `email`: Email del usuario
- `company_id`: ID de la empresa

**Flujo**:

1. Extraer parámetros de URL
2. Validar token con backend
3. Si válido: Mostrar formulario
4. Si inválido: Mostrar error + botón a login
5. Usuario completa formulario
6. Backend crea usuario y hace sign-in
7. Redirige a `/dashboard`

**Estados**:

- `isValidating`: Mostrando loader
- `isValid`: Token válido, mostrar formulario
- `!isValid`: Token inválido, mostrar error

**Diseño**:

- Background degradado azul-naranja
- Header con título "Bienvenido a Evolution Chemical S.R.L"
- Subtítulo "Análisis • Calidad • Precisión"
- Card blanca con formulario

---

### `/empresas/[companyId]/usuarios`

**Ubicación**: `app/(dashboard)/empresas/[companyId]/usuarios/page.tsx`

Página de gestión de usuarios de una empresa.

**Features**:

- Lista de usuarios activos (cards negras)
- Tabla de invitaciones pendientes
- Información de rol: "Rol: Administrador" (sin badge)
- Diseño moderno con bordes redondeados

**Cards de Usuarios Activos**:

```tsx
<div className="rounded-xl border-2 border-gray-200 bg-white">
  <div className="bg-black p-5">{/* Icono + Nombre + Email */}</div>
  <div className="p-5">
    {/* Email + Fecha + Rol */}
    <p className="text-sm text-gray-700">
      <span className="font-bold">Rol:</span> Administrador
    </p>
  </div>
</div>
```

**Tabla de Invitaciones Pendientes**:

- Email
- Fecha de Envío
- Fecha de Expiración
- Estado (badge naranja "Pendiente")

---

## Flujo de Usuario

### 1. Invitar Usuario

```
Admin → Click "Agregar Usuario"
     → Modal se abre
     → Ingresa email
     → Click "Enviar invitación"
     → Backend valida + envía email
     → Modal muestra "Invitación Enviada!"
     → Modal se cierra después de 2s
```

### 2. Aceptar Invitación

```
Usuario → Recibe email
       → Click botón en email
       → Redirige a /onboarding?token=xxx&email=yyy
       → Frontend valida token con backend
       → Si válido: Muestra formulario
       → Usuario ingresa nombre + password
       → Click "Completar registro"
       → Backend crea usuario en Supabase
       → Backend hace sign-in automático
       → Frontend guarda tokens
       → Redirige a /dashboard
```

---

## Manejo de Errores

### Invitar Usuario

```typescript
try {
  await invitationService.inviteUser(companyId, { email, role });
  setSuccess(true);
} catch (err: any) {
  const errorMessage =
    err.response?.data?.message || err.response?.data?.detail || 'Error al enviar invitación';
  setError(errorMessage);
}
```

**Errores Posibles**:

- "Este email ya está registrado en el sistema"
- "Ya existe una invitación pendiente para este email"
- "Has alcanzado el límite de invitaciones por hora"
- "No tienes permisos para invitar usuarios a esta empresa"

### Completar Invitación

```typescript
try {
  await invitationService.completeInvitation(data);
  router.push('/dashboard');
} catch (err: any) {
  const errorMessage =
    err.response?.data?.message || err.response?.data?.detail || 'Error al crear cuenta';
  setError(errorMessage);
}
```

**Errores Posibles**:

- "Token inválido o expirado"
- "Este email ya está registrado"
- "Error al crear usuario en Supabase"

---

## Diseño

### Paleta de Colores

- **Botón Invitar**: Degradado naranja (`from-orange-400 via-orange-500 to-orange-600`)
- **Botón Ver**: Azul (`from-blue-500 to-blue-600`)
- **Modal Header**: Negro sólido (`bg-black`)
- **Background Onboarding**: Degradado azul-naranja (`from-blue-600 via-blue-400 to-orange-400`)

### Bordes Redondeados

- Modal: `rounded-xl` (suavemente redondeado)
- Inputs: `rounded-xl`
- Botones: `rounded-lg` o `rounded-xl`
- Cards: `rounded-xl`

### Efectos Hover

```css
hover:scale-105
hover:shadow-lg
transition-all
active:scale-95
```

---

## Integración en UI

### Página de Empresas

Agregar botones en cada fila de la tabla:

```tsx
<td className="px-4 py-2.5">
  <div className="flex items-center justify-center gap-2">
    <InviteUserButton companyId={company.company_id} companyName={company.name} />
    <ViewUsersButton companyId={company.company_id} companyName={company.name} />
  </div>
</td>
```

---

## API Client

Utiliza el `apiClient` personalizado con:

- Refresh automático de tokens
- Reintentos en 401
- Headers de autenticación
- Manejo de errores

```typescript
await apiClient.post(endpoint, data, includeAuth);
```

---

## Testing

### Flujo Completo

1. Login como admin
2. Ir a `/empresas`
3. Click botón naranja "+" (Invitar)
4. Ingresar email (ej: test@example.com)
5. Click "Enviar invitación"
6. Verificar mensaje "Invitación Enviada!"
7. Abrir email recibido
8. Click botón en email
9. Verificar redirección a `/onboarding?token=xxx&email=test@example.com`
10. Ingresar nombre: "Test User"
11. Ingresar password: "Test123!"
12. Confirmar password: "Test123!"
13. Verificar checkmarks verdes en requisitos
14. Verificar "Las contraseñas coinciden"
15. Click "Completar registro"
16. Verificar redirección a `/dashboard`
17. Verificar sesión activa

---

## Troubleshooting

### Modal no se abre

- Verificar que `isOpen` se setea a `true`
- Verificar z-index del modal (`z-50`)

### Validación de token falla

- Verificar formato de URL
- Verificar que token no esté expirado (24h)
- Ver logs del backend

### No redirige después de registro

- Verificar que tokens se guarden en localStorage
- Verificar que `router.push('/dashboard')` se ejecute
- Ver consola del navegador

---

## Mejoras Futuras

- Re-enviar invitación si expira
- Copiar enlace de invitación al portapapeles
- Previsualización del email antes de enviar
- Dashboard de invitaciones pendientes
- Cancelar invitaciones
- Notificaciones en tiempo real

---

**Versión**: 1.0
**Última actualización**: 2026-06-20
