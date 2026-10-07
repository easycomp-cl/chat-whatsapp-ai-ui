# Diagnóstico y mejoras de Embedded Signup de WhatsApp

**Fecha**: 2026-10-07  
**Componentes afectados**: 
- `src/features/whatsapp-onboarding/use-facebook-embedded-signup.ts`
- `src/features/whatsapp-onboarding/components/connect-whatsapp-panel.tsx`
- `src/lib/meta/embedded-signup.ts`

## Problema resuelto

En producción, al Reconectar WhatsApp con Meta Embedded Signup:
- El popup de Meta se cerraba solo
- El botón quedaba en "Esperando a Meta…" sin respuesta
- A los 3 minutos salía timeout "La conexión con Meta tardó demasiado…"
- El backend nunca recibía el POST de `embedded-signup/complete`
- No había logs para diagnosticar el problema

**Causa probable identificada**: El hook llamaba `initSdk()` dentro de `launch()` (línea 180 del código original) cuando `!initializedRef.current`, lo cual volvía a ejecutar `FB.init()`. Reinicializar el SDK de Facebook mientras hay un `FB.login()` pendiente puede invalidar el callback, causando que nunca se dispare.

## Cambios implementados

### 1. Logs de diagnóstico (siempre activos en producción)

Se agregó sistema de logs con prefijo `[ES]` (Embedded Signup) que registra:

**Al inicializar el SDK:**
```
[ES] Inicializando SDK de Meta: {
  config_id: "3646774175478909",
  config_source: "backend" | "env/fallback",
  app_id_present: true,
  graph_version: "v25.0",
  sdk_ready: true,
  already_initialized: false
}
[ES] SDK inicializado correctamente
```

**Al lanzar el popup:**
```
[ES] Lanzando Embedded Signup: {
  config_id: "3646774175478909",
  config_source: "backend",
  sdk_initialized: true,
  login_available: true
}
```

**Al recibir mensajes de Meta vía postMessage:**
```
[ES] Meta postMessage recibido: {
  type: "WA_EMBEDDED_SIGNUP",
  event: "FINISH",
  version: 3,
  current_step: "finish",
  has_waba_id: true,
  has_phone_number_id: true,
  has_error_message: false,
  error_id: undefined
}
```

**Al recibir callback de FB.login:**
```
[ES] FB.login callback recibido: {
  status: "connected",
  has_authResponse: true,
  has_code: true
}
```

**Al finalizar:**
```
[ES] Launch finalizado exitosamente: {
  has_code: true,
  has_waba_id: true,
  has_phone_number_id: true,
  event: "FINISH"
}
```

**Importante**: Los logs **NO** incluyen valores sensibles (el code de autorización, tokens, ni authResponse completo). Solo muestran presencia/ausencia de datos.

### 2. Timeout reducido a 60 segundos

- Antes: `EMBEDDED_SIGNUP_TIMEOUT_MS = 3 * 60 * 1000` (3 minutos)
- Ahora: `EMBEDDED_SIGNUP_TIMEOUT_MS = 60 * 1000` (1 minuto)

Si Meta no responde en 60s, se muestra el error de timeout y el usuario puede reintentar de inmediato.

### 3. Botón de Cancelar durante la espera

Mientras el botón muestra "Esperando a Meta…" (`status === "connecting"`), se muestra un botón **Cancelar** que:
- Corta la espera inmediatamente
- Limpia el timeout pendiente
- Permite volver a intentar conectar sin esperar

Ubicación: Aparece debajo del botón principal "Conectar con Meta" cuando `status === "connecting"`.

### 4. Manejo de evento FINISH sin code

Si Meta envía un evento `FINISH` (o variantes: `FINISH_ONLY_WABA`, `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`, etc.) con `waba_id` y `phone_number_id` pero **sin code de autorización**, ahora se muestra un error específico:

```
Meta envió FINISH con waba_id y phone_number_id pero sin code de autorización.
Esto indica un problema en la configuración de la app de Meta o permisos faltantes.
```

Esto ayuda a identificar problemas de configuración en la Facebook App (por ejemplo, falta de permisos `whatsapp_business_management` o configuración incorrecta del `config_id`).

### 5. Corrección crítica: no reinicializar el SDK durante launch()

**Antes:**
```ts
if (!initializedRef.current) {
  initSdk(); // ❌ Llamaba FB.init() de nuevo
}
```

**Ahora:**
```ts
if (!initializedRef.current) {
  log("SDK no inicializado, rechazando launch");
  return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "sdk" })));
}
```

Esto evita que `FB.init()` se ejecute mientras hay un `FB.login()` pendiente, lo cual podía invalidar el callback.

## Cómo leer los logs en la consola del navegador

1. Abre las DevTools (F12)
2. Ve a la pestaña **Console**
3. Filtra por `[ES]` para ver solo logs de Embedded Signup
4. Secuencia esperada de logs exitosa:

```
[ES] Inicializando SDK de Meta: { config_id: "...", ... }
[ES] SDK inicializado correctamente
[ES] Lanzando Embedded Signup: { config_id: "...", ... }
[ES] Meta postMessage recibido: { event: "FINISH", has_waba_id: true, ... }
[ES] FB.login callback recibido: { status: "connected", has_code: true }
[ES] Launch finalizado exitosamente: { has_code: true, ... }
```

5. Si el callback NO llega, verás:
   - El log de "Lanzando Embedded Signup"
   - Posiblemente logs de postMessage con evento `FINISH`
   - **PERO** no verás "FB.login callback recibido"
   - Después de 60s: "Timeout alcanzado (60s)"

## Estados visibles en la UI

| Estado UI anterior | Estado UI nuevo | Cambio |
|-------------------|-----------------|--------|
| "Esperando a Meta…" (sin opción de salir) | "Esperando a Meta…" + botón "Cancelar" | ✅ Nuevo |
| Timeout a 3 minutos | Timeout a 60 segundos | ✅ Mejorado |
| Error genérico si popup se cierra | Error específico si evento FINISH sin code | ✅ Mejorado |
| Sin logs en consola | Logs `[ES]` detallados en consola | ✅ Nuevo |

## API/Backend requerido

**No se requieren cambios en el backend**. El contrato con `POST /api/whatsapp/embedded-signup/complete` sigue igual:
- Recibe `code`, `pin`, y opcionalmente `waba_id`, `phone_number_id`, `business_id`, `redirect_uri`
- Devuelve la conexión creada o error

## Pasos de prueba

### Prueba 1: Flujo exitoso con logs
1. Ir a `/onboarding/whatsapp`
2. Abrir DevTools → Console
3. Filtrar por `[ES]`
4. Clic en "Conectar con Meta"
5. Completar el flujo en el popup de Meta
6. **Verificar**: Se ven los 5 logs esperados (Inicializando → Lanzando → postMessage → callback → finalizado)
7. **Verificar**: Aparece diálogo de PIN y se completa la conexión

### Prueba 2: Timeout reducido
1. Ir a `/onboarding/whatsapp`
2. Clic en "Conectar con Meta"
3. Cerrar el popup de Meta sin completar
4. **Verificar**: Aparece error de timeout en ~60 segundos (no 3 minutos)

### Prueba 3: Cancelar durante la espera
1. Ir a `/onboarding/whatsapp`
2. Clic en "Conectar con Meta"
3. Mientras dice "Esperando a Meta…"
4. **Verificar**: Aparece botón "Cancelar" debajo del botón principal
5. Clic en "Cancelar"
6. **Verificar**: Cambia a estado "cancelado" inmediatamente
7. **Verificar**: Se puede volver a intentar sin esperar

### Prueba 4: Evento FINISH sin code (requiere config incorrecta)
1. Configurar un `config_id` sin permisos correctos (solo para testing)
2. Clic en "Conectar con Meta"
3. Completar el flujo
4. **Verificar**: Si Meta envía FINISH sin code, el error es explícito sobre "problema en la configuración de la app de Meta"

## Migraciones

No aplica. Solo cambios en el frontend.

## Notas adicionales

- Los logs `[ES]` están siempre activos en producción porque **no contienen datos sensibles**
- Si el problema persiste, revisar los logs en consola para identificar si:
  - El callback nunca llega (falta log "FB.login callback recibido")
  - Meta envía eventos pero sin code
  - El SDK no se inicializa correctamente
- Si el callback sigue sin llegar, posibles causas externas:
  - Bloqueadores de popups o extensiones del navegador
  - Configuración incorrecta del `config_id` en Meta
  - Permisos faltantes en la Facebook App
  - CORS o CSP que bloqueen el iframe de Meta
