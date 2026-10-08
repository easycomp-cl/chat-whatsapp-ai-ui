# Diagnóstico y mejoras de Embedded Signup de WhatsApp

**Fecha**: 2026-10-07 (actualizado tras fix de timeout)
**Componentes afectados**: 
- `src/features/whatsapp-onboarding/use-facebook-embedded-signup.ts`
- `src/features/whatsapp-onboarding/components/connect-whatsapp-panel.tsx`
- `src/lib/meta/embedded-signup.ts`

## Problemas resueltos

### Bug crítico 1: attemptId se leía antes de generarse (corregido en commits 2 y 4)

En la implementación inicial del fix, `getCurrentAttemptId()` se llamaba en `handleConnect()` ANTES de llamar a `launch()`, pero el `attemptId` se generaba dentro de `launch()`:
- **Primer intento**: `currentFlowAttemptIdRef.current` quedaba en `null` → effect de callbacks tardíos hacía return inmediato
- **Intentos siguientes**: guardaba el id del intento ANTERIOR → code nuevo se descartaba por "intento diferente"

**Fix parcial (commit 2)**: Generar `attemptId` en `launch()` ANTES de crear la Promise y asignarlo al ref interno del hook.

**Problema persistente**: El hook asigna `currentAttemptIdRef.current` (su ref interno), pero el componente tiene su propio `currentFlowAttemptIdRef.current` que nunca se asignaba → camino tardío estaba muerto.

**Fix definitivo (commit 4)**: Después de `launch()`, obtener `attemptId` vía `getCurrentAttemptId()` y asignarlo a `currentFlowAttemptIdRef.current` del componente ANTES de `.then/.catch`. Si `launch()` rechaza síncronamente (SDK no listo), no hay attemptId y se hace return temprano.

#### Traza de verificación (flujo callback tardío)

```
1. Usuario pulsa Conectar
   → [ES] Lanzando Embedded Signup: { attempt_id: "attempt_123..." }
   → [ES] Iniciando conexión: { attempt_id: "attempt_123..." }
   → currentFlowAttemptIdRef.current = "attempt_123..." ✅

2. Usuario tarda >20s tras FINISH → timeout de gracia
   → [ES] Timeout de gracia alcanzado (20s)
   → status = "error", currentFlowAttemptIdRef.current = "attempt_123..." ✅

3. Callback llega tarde con code
   → [ES] FB.login callback recibido: { has_code: true, settled: true }
   → sessionRef.current.code = "ABC123..." (en el hook)

4. Effect detecta (cada 500ms):
   → capture = getCurrentCapture() → tiene code
   → attemptId = getCurrentAttemptId() → "attempt_123..."
   → currentFlowAttemptIdRef.current === "attempt_123..." ✅ (NO null, NO diferente)
   → [ES] Code tardío detectado, procesando automáticamente
   → currentFlowAttemptIdRef.current = null (marcar consumido)
   → setPendingCapture → abre PIN UNA SOLA VEZ ✅

5. Si POST falla, status = "error" pero currentFlowAttemptIdRef = null
   → Effect NO vuelve a detectar (ref es null) ✅
```

### Bug crítico 2: doble uso del code (corregido en commit 2)

Después de consumir un code (flujo normal o tardío), `sessionRef.current.code` y `currentFlowAttemptIdRef.current` seguían seteados. Si el POST a `complete` fallaba y el status pasaba a `'error'`, el effect volvía a detectar el mismo code y reabría el diálogo de PIN con un **code ya usado** (Meta lo rechaza, es de un solo uso).

**Fix aplicado**: Limpiar `currentFlowAttemptIdRef.current = null` inmediatamente después de `setPendingCapture` en AMBOS caminos (normal y tardío) para marcar el code como consumido y evitar procesamiento doble.

---

### Problema 1 (PR #10): Popup que se cierra sin respuesta

En producción, al Reconectar WhatsApp con Meta Embedded Signup:
- El popup de Meta se cerraba solo
- El botón quedaba en "Esperando a Meta…" sin respuesta
- A los 3 minutos salía timeout "La conexión con Meta tardó demasiado…"
- El backend nunca recibía el POST de `embedded-signup/complete`
- No había logs para diagnosticar el problema

**Causa identificada**: El hook llamaba `initSdk()` dentro de `launch()` cuando `!initializedRef.current`, lo cual volvía a ejecutar `FB.init()`. Reinicializar el SDK de Facebook mientras hay un `FB.login()` pendiente puede invalidar el callback.

### Problema 2 (Fix actual): Timeout prematuro descartaba callbacks válidos

En producción, usuario QA tardó ~68 segundos en completar el flujo de Meta:
- El timeout de 60s se alcanzó antes de que el usuario pulsara Finalizar
- Los callbacks de Meta (postMessage FINISH + FB.login code) llegaron ~8s después del timeout
- La UI mostró error de timeout y descartó el code válido
- El backend nunca recibió el POST porque la UI rechazó el code
- El popup NO se cierra automáticamente, solo cuando el usuario pulsa Finalizar en Meta

**Causa identificada**: 
1. El timeout de 60s empezaba a contar desde el launch, no desde el cierre del popup
2. Una vez que el timeout rechazaba la promesa (`settled = true`), cualquier callback que llegara después era ignorado completamente
3. No había mecanismo para procesar callbacks tardíos

## Cambios implementados

### 1. Logs de diagnóstico (siempre activos en producción)

Se agregó sistema de logs con prefijo `[ES]` (Embedded Signup) que registra:

**Al inicializar el SDK:**
```
[ES] Inicializando SDK de Meta: {
  config_id: "1046141448397539",
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
  attempt_id: "attempt_1728341234567_abc123xyz",
  config_id: "1046141448397539",
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

**Al recibir evento de cierre (FINISH o CANCEL):**
```
[ES] Evento de cierre recibido (FINISH), iniciando timeout de gracia (20s)
```

**Al recibir callback de FB.login:**
```
[ES] FB.login callback recibido: {
  status: "connected",
  has_authResponse: true,
  has_code: true,
  code_length: 245,
  settled: false,
  manual_cancellation: false,
  attempt_id: "attempt_1728341234567_abc123xyz"
}
```

**Si el callback llega tarde (después de timeout):**
```
[ES] Code llegó después del timeout pero del mismo intento, será procesado
[ES] Code tardío detectado, procesando automáticamente: {
  attempt_id: "attempt_1728341234567_abc123xyz",
  has_waba_id: true,
  has_phone_number_id: true
}
```

**Al iniciar y completar el POST a embedded-signup/complete:**
```
[ES] Iniciando POST a embedded-signup/complete: {
  code_length: 245,
  has_waba_id: true,
  has_phone_number_id: true,
  has_business_id: true,
  has_redirect_uri: false
}
[ES] POST a embedded-signup/complete completado: {
  duration_ms: 12450,
  success: true,
  has_connection: true
}
```

**Al finalizar:**
```
[ES] Launch finalizado exitosamente: {
  has_code: true,
  code_length: 245,
  has_waba_id: true,
  has_phone_number_id: true,
  event: "FINISH",
  attempt_id: "attempt_1728341234567_abc123xyz"
}
```

**Importante**: Los logs **NO** incluyen valores sensibles (el code de autorización completo, tokens, ni authResponse completo). Solo muestran presencia/ausencia y longitud de datos.

### 2. Sistema de timeouts inteligente

#### Timeout global de 5 minutos
- Constante: `EMBEDDED_SIGNUP_GLOBAL_TIMEOUT_MS = 5 * 60 * 1000`
- Se inicia cuando se llama `launch()`
- Da tiempo suficiente para que el usuario complete el flujo completo de Meta sin presión

#### Timeout de gracia de 20 segundos
- Constante: `EMBEDDED_SIGNUP_GRACE_TIMEOUT_MS = 20 * 1000`
- Se activa SOLO cuando llega el postMessage `FINISH` o `CANCEL` de Meta
- Cuando llega el evento de cierre:
  1. Se cancela el timeout global
  2. Se inicia el timeout de gracia de 20s
  3. Da tiempo para que llegue el callback de FB.login con el code

#### Lógica de activación
- Si NO llega ningún evento de cierre (FINISH/CANCEL), solo se usa el timeout global de 5 min
- Si llega el evento de cierre, se cambia automáticamente al timeout de gracia de 20s
- El botón "Cancelar" permite al usuario abortar en cualquier momento

### 3. Procesamiento de callbacks tardíos

**ID de intento único**: Cada llamada a `launch()` genera un `attemptId` único para distinguir intentos.

**Detección automática**: Si un callback (code) llega DESPUÉS de un timeout:
- Un effect verifica cada 500ms si hay un code disponible en `sessionRef.current`
- Verifica que el `attemptId` del code coincida con el `attemptId` del flujo actual
- Si no hubo cancelación manual explícita del usuario:
  1. Limpia el error de timeout
  2. Cambia el estado de "error" a "idle"
  3. Abre el diálogo de PIN automáticamente
  4. Procesa el code normalmente

**Casos descartados**:
- Si el usuario canceló explícitamente (botón Cancelar): `currentFlowAttemptIdRef.current = null`
- Si el usuario lanzó un nuevo intento: `attemptId` diferente
- Si el code es de un intento anterior: se ignora

**Log cuando se procesa un callback tardío**:
```
[ES] Error en launch (timeout), esperando posibles callbacks tardíos
[ES] Code tardío detectado, procesando automáticamente
```

### 4. Botón de Cancelar mejorado

Mientras el botón muestra "Esperando a Meta…" (`status === "connecting"`), se muestra un botón **Cancelar** que:
- Corta la espera inmediatamente
- Limpia ambos timeouts (global y gracia)
- Marca `manualCancellation = true` para que callbacks tardíos sean ignorados
- Limpia `currentFlowAttemptIdRef.current` para descartar el intento
- Permite volver a intentar conectar sin esperar

### 5. Mensaje de estado de carga claro

Cuando se envía el POST a `embedded-signup/complete`:
- Botón muestra: "Finalizando conexión con Meta…" (antes: "Guardando conexión…")
- No hay timeout del lado del cliente en el POST (puede tardar 10-20s sin problema)
- Logs muestran duración del POST en ms
- Logs incluyen status HTTP y si la conexión fue creada

### 6. No reinicializar el SDK durante launch()

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

### 7. Manejo de evento FINISH sin code

Si Meta envía un evento `FINISH` (o variantes: `FINISH_ONLY_WABA`, `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`, etc.) con `waba_id` y `phone_number_id` pero **sin code de autorización**, se muestra un error específico:

```
Meta envió FINISH con waba_id y phone_number_id pero sin code de autorización.
Esto indica un problema en la configuración de la app de Meta o permisos faltantes.
```

Esto ayuda a identificar problemas de configuración en la Facebook App (por ejemplo, falta de permisos `whatsapp_business_management` o configuración incorrecta del `config_id`).

## Cómo leer los logs en la consola del navegador

1. Abre las DevTools (F12)
2. Ve a la pestaña **Console**
3. Filtra por `[ES]` para ver solo logs de Embedded Signup
4. Secuencia esperada de logs exitosa (flujo completo en <5 min):

```
[ES] Inicializando SDK de Meta: { ... }
[ES] SDK inicializado correctamente
[ES] Iniciando conexión: { attempt_id: "..." }
[ES] Lanzando Embedded Signup: { attempt_id: "...", ... }
[ES] Meta postMessage recibido: { event: "FINISH", has_waba_id: true, ... }
[ES] Evento de cierre recibido (FINISH), iniciando timeout de gracia (20s)
[ES] FB.login callback recibido: { status: "connected", has_code: true, settled: false, ... }
[ES] Launch finalizado exitosamente: { has_code: true, ... }
[ES] Iniciando POST a embedded-signup/complete: { ... }
[ES] POST a embedded-signup/complete completado: { duration_ms: 12450, success: true }
```

5. Si el callback llega tarde (>60s pero <5min o >20s tras FINISH), verás:

```
[ES] Lanzando Embedded Signup: { attempt_id: "attempt_123", ... }
[ES] Evento de cierre recibido (FINISH), iniciando timeout de gracia (20s)
[ES] Timeout de gracia alcanzado (20s)
[ES] Error en launch (timeout), esperando posibles callbacks tardíos
[ES] FB.login callback recibido: { has_code: true, settled: true, ... }
[ES] Code llegó después del timeout pero del mismo intento, será procesado
[ES] Code tardío detectado, procesando automáticamente: { ... }
[ES] Iniciando POST a embedded-signup/complete: { ... }
[ES] POST a embedded-signup/complete completado: { success: true }
```

6. Si el callback NO llega nunca, verás:
   - El log de "Lanzando Embedded Signup"
   - Posiblemente logs de postMessage con evento `FINISH`
   - **PERO** no verás "FB.login callback recibido"
   - Después de 5 min (o 20s tras FINISH): "Timeout global/de gracia alcanzado"

## Estados visibles en la UI

| Estado UI | Descripción | Timeout activo |
|-----------|-------------|----------------|
| "Esperando a Meta…" + botón Cancelar | Usuario está en el popup de Meta | Timeout global (5 min) o gracia (20s tras FINISH) |
| "Finalizando conexión con Meta…" | POST a embedded-signup/complete en curso | Sin timeout del cliente |
| Error de timeout + callback llega después | Se procesa automáticamente, limpia error, abre diálogo PIN | No aplica |
| Error de timeout + no llega callback | Usuario puede reintentar | No aplica |
| Cancelado manualmente | Usuario pulsó Cancelar, callbacks tardíos se ignoran | Ninguno |

## API/Backend requerido

**No se requieren cambios en el backend**. El contrato con `POST /api/whatsapp/embedded-signup/complete` sigue igual:
- Recibe `code`, `pin`, y opcionalmente `waba_id`, `phone_number_id`, `business_id`, `redirect_uri`
- Puede tardar 10-20s (llamadas a Meta)
- No hay timeout del lado del cliente (el POST espera hasta que termine)
- Devuelve la conexión creada o error

## Pasos de prueba

### Prueba 1: Flujo exitoso rápido (<60s)
1. Ir a `/onboarding/whatsapp`
2. Abrir DevTools → Console → Filtrar por `[ES]`
3. Clic en "Conectar con Meta"
4. Completar el flujo en el popup de Meta en <60s
5. **Verificar**: Se ven todos los logs esperados (Inicializando → Lanzando → postMessage → evento de cierre → callback → finalizado)
6. **Verificar**: No se activa ningún timeout
7. **Verificar**: Aparece diálogo de PIN y se completa la conexión

### Prueba 2: Flujo lento (60-90s, activa timeout de gracia)
1. Ir a `/onboarding/whatsapp`
2. Abrir DevTools → Console → Filtrar por `[ES]`
3. Clic en "Conectar con Meta"
4. Tomarse 70s en el popup de Meta
5. **Verificar**: Log "Evento de cierre recibido (FINISH), iniciando timeout de gracia (20s)" aparece cuando llegas a la pantalla final
6. **Verificar**: Si pulsas Finalizar antes de 20s, el callback llega a tiempo
7. **Verificar**: Si pulsas Finalizar después de 20s, se activa timeout pero el callback tardío se procesa automáticamente
8. **Verificar**: Se limpia el error y se abre el diálogo de PIN

### Prueba 3: Callback tardío procesado
1. Ir a `/onboarding/whatsapp`
2. Abrir DevTools → Console → Filtrar por `[ES]`
3. Clic en "Conectar con Meta"
4. En el popup, llegar hasta la última pantalla pero NO pulsar Finalizar durante 25s
5. **Verificar**: Log "Timeout de gracia alcanzado (20s)" aparece
6. Ahora pulsar Finalizar en el popup (popup aún abierto)
7. **Verificar**: Log "Code llegó después del timeout pero del mismo intento, será procesado"
8. **Verificar**: Log "Code tardío detectado, procesando automáticamente"
9. **Verificar**: Error de timeout desaparece
10. **Verificar**: Se abre el diálogo de PIN automáticamente

### Prueba 4: Timeout global (>5 min sin respuesta)
1. Ir a `/onboarding/whatsapp`
2. Clic en "Conectar con Meta"
3. Dejar el popup abierto SIN avanzar por 5 minutos (no llegar a la pantalla final)
4. **Verificar**: Log "Timeout global alcanzado (5 min)" aparece
5. **Verificar**: Aparece error de timeout
6. **Verificar**: Se puede volver a intentar

### Prueba 5: Cancelar durante la espera
1. Ir a `/onboarding/whatsapp`
2. Clic en "Conectar con Meta"
3. Mientras dice "Esperando a Meta…"
4. **Verificar**: Aparece botón "Cancelar" debajo del botón principal
5. Clic en "Cancelar"
6. **Verificar**: Log "Launch cancelado manualmente por el usuario"
7. **Verificar**: Cambia a estado "cancelado" inmediatamente
8. Si el callback llega después, **verificar**: Log "Code llegó tarde pero se ignora (cancelación manual o intento diferente)"
9. **Verificar**: Se puede volver a intentar sin esperar

### Prueba 6: POST a embedded-signup/complete con duración
1. Ir a `/onboarding/whatsapp`
2. Abrir DevTools → Console → Filtrar por `[ES]`
3. Completar flujo hasta el diálogo de PIN
4. Ingresar PIN y confirmar
5. **Verificar**: Log "Iniciando POST a embedded-signup/complete" con detalles
6. **Verificar**: Botón muestra "Finalizando conexión con Meta…"
7. **Verificar**: Después de 10-20s, log "POST a embedded-signup/complete completado" con duración en ms
8. **Verificar**: Se completa la conexión

### Prueba 7: Reintentar después de error
1. Provocar un error (cerrar popup, timeout, etc.)
2. Clic en "Conectar con Meta" de nuevo
3. **Verificar**: Se genera un nuevo `attempt_id` en los logs
4. Completar el flujo normalmente
5. **Verificar**: Callbacks del intento anterior (si llegan) son ignorados
6. **Verificar**: Log "Code llegó tarde pero se ignora (cancelación manual o intento diferente)"

## Migraciones

No aplica. Solo cambios en el frontend.

## Notas adicionales

- Los logs `[ES]` están siempre activos en producción porque **no contienen datos sensibles**
- El `attemptId` permite distinguir entre intentos múltiples y evitar mezclar callbacks
- El timeout de gracia (20s) se activa solo cuando el usuario llegó a la última pantalla (evento FINISH)
- Si el usuario tarda mucho en las pantallas intermedias, tiene los 5 minutos completos
- Una vez que llega el evento FINISH, el sistema espera 20s adicionales para el callback
- Los callbacks que llegan tarde (después del timeout) se procesan si son del mismo intento y no hubo cancelación manual
- El POST a `embedded-signup/complete` puede tardar 10-20s y no tiene timeout del lado del cliente
- Si el problema persiste, revisar los logs en consola para identificar si:
  - El callback nunca llega (falta log "FB.login callback recibido")
  - Meta envía eventos pero sin code
  - El SDK no se inicializa correctamente
- Si el callback sigue sin llegar, posibles causas externas:
  - Bloqueadores de popups o extensiones del navegador
  - Configuración incorrecta del `config_id` en Meta
  - Permisos faltantes en la Facebook App (`whatsapp_business_management`)
  - CORS o CSP que bloqueen el iframe/postMessage de Meta
