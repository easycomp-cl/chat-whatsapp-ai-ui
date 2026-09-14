# Verificación PIN WhatsApp — Embedded Signup

**Fecha**: 2026-09-14  
**PR**: https://github.com/easycomp-cl/chat-whatsapp-ai-ui/pull/5

## Resumen

Se agregó la recolección del PIN de verificación en dos pasos de WhatsApp al flujo de Embedded Signup. Después de que Meta devuelve el código de autorización, la UI solicita al usuario un PIN de 6 dígitos antes de completar la conexión.

## Cambios visibles

### Nueva UI: Diálogo de PIN

Después de que el usuario completa el Embedded Signup en la ventana de Meta (o vuelve del callback OAuth), aparece un diálogo modal que solicita:

- **Campo**: PIN de 6 dígitos numéricos
- **Validación client-side**: Solo acepta exactamente 6 dígitos
- **Explicación**: El diálogo explica que es el PIN de verificación en dos pasos configurado en WhatsApp Manager
- **Enlace de ayuda**: Link a WhatsApp Manager para crear el PIN si el usuario no tiene uno

### Flujos afectados

1. **Embedded Signup directo** (`handleConnect` → `launch()` → diálogo PIN → `persistCapture`)
2. **OAuth callback** (URL con `?code=...` → diálogo PIN → `persistCapture`)

Ambos flujos ahora pasan por el diálogo de PIN antes de enviar la petición de `complete` al backend.

## Cambios de tipos y API

### Frontend

**`src/features/whatsapp-onboarding/types.ts`**:
```typescript
export type CompleteEmbeddedSignupInput = {
  code: string;
  pin: string;  // ← NUEVO: requerido, 6 dígitos
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  redirect_uri?: string;
};
```

**`src/lib/bot-api/types.ts`**:
```typescript
export type EmbeddedSignupCompleteBody = {
  code: string;
  pin: string;  // ← NUEVO: requerido, 6 dígitos
  tenant_id: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  redirect_uri?: string;
};
```

### Backend requerido

El backend (PR https://github.com/easycomp-cl/chat-whatsapp-ai/pull/1) ahora **requiere** el campo `pin` en el body de `POST /businesses/:id/whatsapp/embedded-signup/complete`.

- Si falta o no es válido (6 dígitos), la conexión falla
- El backend usa el PIN para registrar el número con el webhook de Meta
- Sin registro exitoso, el número NO se marca como conectado

## Archivos modificados

1. **Nuevos**:
   - `src/features/whatsapp-onboarding/components/pin-verification-dialog.tsx` — componente del diálogo

2. **Modificados**:
   - `src/features/whatsapp-onboarding/types.ts` — agregado `pin` a `CompleteEmbeddedSignupInput`
   - `src/lib/bot-api/types.ts` — agregado `pin` a `EmbeddedSignupCompleteBody`
   - `src/lib/actions/whatsapp-onboarding-actions.ts` — validación server-side del PIN + pasa `pin` al body
   - `src/features/whatsapp-onboarding/components/connect-whatsapp-panel.tsx` — integración del diálogo PIN en ambos flujos

## Validación

### Client-side (diálogo)
- Campo de input numérico (`inputMode="numeric"`)
- Máximo 6 caracteres
- Filtra automáticamente caracteres no-numéricos
- Botón "Continuar" deshabilitado hasta que el input tenga exactamente 6 dígitos

### Server-side (action)
```typescript
if (!pin) {
  return { ok: false, error: "El PIN de verificación en dos pasos es requerido." };
}
if (!/^\d{6}$/.test(pin)) {
  return { ok: false, error: "El PIN debe ser exactamente 6 dígitos." };
}
```

## Mensajes de error

- **PIN no ingresado**: "El PIN de verificación en dos pasos es requerido."
- **PIN inválido (formato)**: "El PIN debe ser exactamente 6 dígitos."
- **PIN rechazado por backend**: Se muestra el error devuelto por el backend (p. ej. "registro falló", "PIN incorrecto")

Si el backend rechaza el `complete`, el número **NO** se marca como conectado y el error se muestra al usuario.

## Pasos de prueba

1. Ir a `/onboarding/whatsapp`
2. Hacer clic en "Conectar con Meta"
3. Completar el flujo de Embedded Signup en la ventana de Meta
4. **Verificar**: Aparece el diálogo solicitando el PIN
5. Ingresar un PIN de 6 dígitos válido
6. **Verificar**: La conexión se completa y se muestra el número conectado
7. Intentar con PIN inválido (menos/más de 6 dígitos): debe mostrar error client-side
8. Intentar con PIN rechazado por backend: debe mostrar error backend

### Flujo OAuth callback

1. Seguir el mismo flujo pero desde URL de callback (`?code=...`)
2. **Verificar**: El diálogo aparece antes de completar la conexión

## Notas

- **Español es-MX**: Toda la UI está en español mexicano según el proyecto
- **Componentes shadcn**: Se usan los componentes disponibles (Dialog, Button, Input, Label)
- **No backend en este repo**: Este repo es solo UI. El backend se implementa en `chat-whatsapp-ai`
- **Contrato claro**: El campo `pin` es `string` de exactamente 6 dígitos, documentado para el backend
