# Cambios UI — WhatsApp Embedded Signup

## Resumen

La UI permite a un administrador de negocio conectar su WhatsApp Business con **Embedded Signup de Meta** (Facebook JS SDK + `config_id` existente). Tras el alta, el front envía el `code` y los IDs al backend; **no intercambia el code por token en el browser**.

## Rutas de UI

| Path | Uso |
|------|-----|
| `/onboarding` | Redirige a conectar WhatsApp |
| `/onboarding/whatsapp` | CTA **Conectar con Meta** (pantalla de App Review) |
| `/onboarding/whatsapp/callback` | Retorno OAuth / resultado conectado |
| `/app/settings` | Tarjeta WhatsApp Business |
| `/app/dashboard` | CTA si el canal no está conectado |

El wizard de alta, al terminar el paso 5, redirige a `/onboarding/whatsapp`.

## Valid OAuth Redirect URIs (pegar en Meta)

App Dashboard → **Facebook Login for Business** → **Settings** → **Valid OAuth Redirect URIs**:

```
https://chatbotmanager.easycomp.cl/api/auth/callback/facebook
https://chatbotmanager.easycomp.cl/onboarding/whatsapp/callback
https://chatbotmanager.easycomp.cl/onboarding/whatsapp
```

HTTPS only, match exacto. También conviene:

- **App Domains:** `chatbotmanager.easycomp.cl`
- **Site URL:** `https://chatbotmanager.easycomp.cl`

La ruta `/api/auth/callback/facebook` redirige a `/onboarding/whatsapp/callback` conservando `code` / `error`.

## Fix QA — crash RSC al volver de Embedded Signup (2026-09-14)

QA veía badge **Error** con el texto ofuscado de producción:

`An error occurred in the Server Components render...`

Causa en front:

1. `completeWhatsappEmbeddedSignupAction` hacía `throw new Error(...)`. En producción Next.js ofusca ese mensaje con el texto RSC.
2. Tras el POST, `revalidatePath` re-renderizaba páginas que llamaban **Server Actions** desde Server Components (`getWhatsappConnectionAction`).
3. `redirect_uri` se enviaba siempre como `/onboarding/whatsapp/callback`, pero FB.login emite el `code` desde `/onboarding/whatsapp`. El exchange del backend falla y el throw anterior pintaba el crash.
4. El snapshot local solo se guardaba si el action devolvía OK, así que un refresh volvía a **Sin conectar**.

Qué hace ahora la UI (alineado con el backend, 2026-09-14):

- El action **no lanza**: devuelve `{ ok, connection, error }` con el `message` del backend.
- **FB.login / popup:** no envía `redirect_uri`. Espera `WA_EMBEDDED_SIGNUP` con `waba_id` y `phone_number_id` (string, nunca `null`) y recién ahí hace POST.
- **`redirect_uri` solo** si el `code` vino de `?code=` (callback OAuth o cookie de `/api/auth/callback/facebook`).
- Si `complete` falla (404/501/5xx u otro), badge **Error**, se muestra el mensaje del backend y se pide volver a abrir el popup. **No** se pinta “Autorizado en Meta”.
- `GET /whatsapp/connection` con `connected: false` o 404 → **Sin conectar**. El GET en `/onboarding/whatsapp/callback` está envuelto para que no tire la página.
- 200 del complete → badge **Conectado** + `display_phone_number`. Un refresh sigue en **Conectado** solo si el GET confirma `connected: true`. Dashboard y settings siguen el GET, no el snapshot local.
- `sessionInfoVersion: "3"` para recibir `WA_EMBEDDED_SIGNUP`.
- Error boundary en `/onboarding` si un Server Component todavía explota.

El número E.164 solo aparece si el backend lo devuelve en el 200 de `POST /whatsapp/embedded-signup/complete` o en `GET .../whatsapp/connection`.

El nombre **Agent-Chatbot-AI** del popup es el display name de la app en Meta Developer; el copy “EasyComp” sale de la Embedded Signup Configuration. No se corrige en este repo.

## Payload al backend

El BFF (server action, `X-API-Key`) hace:

```
POST {BOT_API_BASE_URL}/whatsapp/embedded-signup/complete
```

Producción: `https://api-chatbotmanager.easycomp.cl/whatsapp/embedded-signup/complete`

Popup FB.login (sin `redirect_uri`):

```json
{
  "code": "<auth_code>",
  "waba_id": "123",
  "phone_number_id": "456",
  "business_id": "789",
  "tenant_id": "<business_id del cliente actual>"
}
```

`waba_id` y `phone_number_id` van como **string**; si no hay valor, el campo se omite (nunca `null`). `redirect_uri` **no se envía** en el popup.

Solo si el `code` vino de `?code=` en `/onboarding/whatsapp/callback` (o de `/api/auth/callback/facebook`) se agrega:

```json
{ "redirect_uri": "https://chatbotmanager.easycomp.cl/onboarding/whatsapp/callback" }
```

El exchange `code → token` lo hace **solo el backend**.

Lectura de estado:

```
GET {BOT_API_BASE_URL}/businesses/:businessId/whatsapp/connection
```

`connected: false` o 404 → UI **Sin conectar**. 200 con `connected: true` → **Conectado** + `display_phone_number`. Spec: [pending/to-backend/backend-whatsapp-embedded-signup-template-provisioning.md](./pending/to-backend/backend-whatsapp-embedded-signup-template-provisioning.md).

## Variables de entorno (Vercel Production)

```
NEXT_PUBLIC_APP_URL=https://chatbotmanager.easycomp.cl
NEXT_PUBLIC_META_APP_ID=1642810900259407
NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID=1919146745399628
NEXT_PUBLIC_META_GRAPH_VERSION=v25.0
NEXT_PUBLIC_BOT_API_BASE_URL=https://api-chatbotmanager.easycomp.cl
BOT_API_BASE_URL=https://api-chatbotmanager.easycomp.cl
BOT_API_SECRET=<mismo INTERNAL_API_KEY del backend>
```

No hay tokens de larga duración en el front. `config_id` y `app_id` sí son públicos (`NEXT_PUBLIC_`).

## Embedded Signup (docs vigentes)

`FB.login` se llama **síncrono en el click** (si hay un `await` antes, Chrome bloquea el popup). Parámetros:

- `config_id`: `1919146745399628`
- `response_type`: `"code"`
- `override_default_response_type`: `true`
- `extras.setup`: `{}`

- Graph JS SDK: `v25.0`. Se envía `sessionInfoVersion: "3"` para recibir `WA_EMBEDDED_SIGNUP` con `waba_id` / `phone_number_id`. No se envía `featureType`.

Evento `message` con `type === "WA_EMBEDDED_SIGNUP"`: se capturan `phone_number_id`, `waba_id`, `business_id`.

## Estados visibles

| Estado | UI |
|--------|----|
| Idle | Botón **Conectar con Meta** |
| Connecting | “Esperando a Meta…” |
| Completing | “Guardando conexión…” |
| Connected | Badge **Conectado** + `display_phone_number` / IDs |
| Complete falló | Badge **Error** + `message` del backend; reabrir popup |
| GET 404 / `connected: false` | Badge **Sin conectar** |
| Canceló el usuario | Mensaje en español, puede reintentar |
| Rechazo / error Meta | Error legible en español |
| Timeout (3 min) | Error de tiempo agotado |

## Screencast App Review (1–2 min)

Cuenta: Tester de la app Meta **Agent-Chatbot-AI** + usuario `BUSINESS_ADMIN` en https://chatbotmanager.easycomp.cl

1. Abrir https://chatbotmanager.easycomp.cl/login e iniciar sesión.
2. Ir a https://chatbotmanager.easycomp.cl/onboarding/whatsapp (o Dashboard → **Conectar WhatsApp**).
3. Mostrar el título **Conectar WhatsApp** y el botón **Conectar con Meta**.
4. Pulsar **Conectar con Meta**. Permitir el popup.
5. En Facebook: iniciar sesión Tester → elegir Business / WABA / número → permitir permisos.
6. Volver a la UI: la misma página (o `/onboarding/whatsapp/callback` si Meta redirige). Estado **Conectado** + número si el complete devolvió 200. Si falló, el `message` del backend y reabrir el popup. No debe aparecer el error RSC de Server Components.
7. Mostrar `phone_number_id` (y número si el backend lo devuelve).
8. Opcional: **Configuración** → tarjeta WhatsApp Business.

Si el Tester cancela, grabar el mensaje “Cancelaste la conexión con Meta” y un reintento.

## Cómo probar en local

1. Copiar variables Meta a `.env.local`. `NEXT_PUBLIC_APP_URL=http://localhost:3001`.
2. `npm run dev` → login → `/onboarding/whatsapp`.
3. Embedded Signup real requiere que `localhost` esté en App Domains / OAuth URIs del **entorno de desarrollo** de la app Meta (no mezclar con las URIs de producción de arriba).

## Fuera de alcance (sin cambios)

- Webhook Meta `https://api-chatbotmanager.easycomp.cl/webhooks/whatsapp`
- DNS legacy, App Review submit, display name del número, Partner Solution
