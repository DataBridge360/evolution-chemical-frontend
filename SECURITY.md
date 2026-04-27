# Seguridad - Evolution Chemical Frontend

## 🔐 Autenticación JWT con Supabase

### Algoritmo de Firma (ACTUAL)

**Supabase usa ES256 (ECC P-256)**
- **Current Key**: ES256 (Elliptic Curve Cryptography)
- **Curva**: P-256 (NIST Prime Curve)
- **Tipo**: Asimétrico (clave pública/privada)
- **Key ID**: `5abeb82f-488c-4ca4-a5ec-47ff4212aaa4`

**Clave Legacy (Previous):**
- **Previous Key**: HS256 (HMAC-SHA256)
- **Key ID**: `8abcbe10-dfb3-4fc6-98c8-5d854e76fe3f`
- **Estado**: Aún válida para verificar tokens viejos
- **Acción**: Se revocará automáticamente cuando expiren todos los tokens

### Estructura del JWT Token

```json
{
  "header": {
    "alg": "ES256",                              // Nuevo algoritmo
    "typ": "JWT",
    "kid": "5abeb82f-488c-4ca4-a5ec-47ff4212aaa4"  // Key ID actual
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "aud": "authenticated",
    "iat": 1234567890,
    "exp": 1234571490
  },
  "signature": "..."  // Firma con ECC P-256
}
```

### Rotación de Claves

**Estado Actual (3 horas después de la rotación):**

| Status | Key ID | Type | Uso |
|--------|--------|------|-----|
| **Current** | 5abeb82f... | ES256 (ECC P-256) | Firmar NUEVOS tokens |
| **Previous** | 8abcbe10... | HS256 (Legacy) | Verificar tokens VIEJOS |

**Proceso de Rotación:**
1. ✅ Se creó nueva clave ES256
2. ✅ Nuevos tokens se firman con ES256
3. ⏳ Tokens viejos (HS256) aún son válidos
4. ⏳ Esperar que expiren todos los tokens HS256 (máx 7 días)
5. 🔄 Entonces se puede revocar la clave legacy

**⚠️ NO revocar la clave legacy ahora porque:**
- Usuarios con sesiones activas tienen tokens firmados con HS256
- Si revocas, esos usuarios serán deslogueados
- Espera que expiren naturalmente (máx 7 días)

### ES256 vs HS256

**Ventajas de ES256 (Actual):**
- ✅ Más seguro que HS256
- ✅ Usa criptografía de curva elíptica
- ✅ Clave pública/privada (asimétrico)
- ✅ Tokens más pequeños
- ✅ Mejor rendimiento

**HS256 (Legacy):**
- ❌ Menos seguro
- ❌ Shared secret (simétrico)
- ✅ Más simple
- ✅ Compatible con sistemas antiguos

### Flujo de Verificación

```
1. Usuario hace request con JWT en cookie
   ↓
2. Middleware extrae el JWT
   ↓
3. Supabase lee el header para obtener 'alg' y 'kid'
   ↓
4. Si kid = 5abeb82f... → Usa ES256 (actual)
   Si kid = 8abcbe10... → Usa HS256 (legacy)
   ↓
5. Verifica firma con el algoritmo correspondiente
   ↓
6. Verifica expiración
   ↓
7. Si todo OK → ✅ Autenticado
```

### Configuración de Seguridad

**JWT Settings en Supabase Dashboard:**
```
Current Key:
- Type: ES256 (ECC P-256)
- Status: Active
- Use: Signing new tokens

Previous Key:
- Type: HS256 (Legacy)
- Status: Valid for verification
- Action: Revoke after tokens expire
```

**Cookies Seguras:**
```typescript
{
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 3600  // 1 hora
}
```

### Cuándo Revocar la Clave Legacy

**Esperar hasta que:**
1. Todos los tokens HS256 hayan expirado (máx 7 días)
2. No haya usuarios con sesiones activas antiguas
3. Supabase te lo recomiende en el dashboard

**Cómo revocar:**
1. Supabase Dashboard → Settings → API → JWT Signing Keys
2. Click en "Revoke" en la clave legacy
3. Confirmar

**⚠️ Solo revocar si:**
- Han pasado al menos 7 días desde la rotación
- Estás seguro de que no hay tokens activos con HS256
- O si sospechas que la clave legacy fue comprometida

### Verificación del Token en el Código

```typescript
// El código NO cambia, Supabase maneja todo automáticamente
const { data: { user } } = await supabase.auth.getUser();

// Supabase:
// 1. Lee el 'kid' del header
// 2. Usa la clave correspondiente (ES256 o HS256)
// 3. Verifica la firma
// 4. Devuelve el usuario o null
```

### Standby Key (Opcional)

Puedes crear una "standby key" para preparar la próxima rotación:

```
Create Standby Key → Nueva clave ES256 se crea
                  → Pero no se usa aún
                  → Espera a que la actives
                  → Entonces se convierte en "Current"
                  → Y la actual pasa a "Previous"
```

**Cuándo usar:**
- Rotación planificada
- Migración gradual
- Mayor control sobre el proceso

### Monitoreo

**Revisar regularmente:**
- Supabase Dashboard → Settings → API → JWT Signing Keys
- Ver estado de claves
- Ver cuándo fue la última rotación
- Decidir cuándo revocar claves legacy

### Buenas Prácticas

✅ **Hacer:**
- Dejar que Supabase maneje ES256 automáticamente
- Esperar al menos 7 días antes de revocar claves legacy
- Monitorear el dashboard para ver cuándo revocar
- Usar HTTPS en producción

❌ **NO Hacer:**
- Revocar claves legacy inmediatamente después de rotación
- Rotar claves manualmente sin necesidad
- Guardar JWT en localStorage

### Referencias

- [Supabase JWT Docs](https://supabase.com/docs/guides/auth/jwts)
- [ES256 Algorithm](https://www.rfc-editor.org/rfc/rfc7518#section-3.4)
- [JWT.io - Debugger](https://jwt.io/)
- [ECC Cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
