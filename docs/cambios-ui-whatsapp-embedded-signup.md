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

## Payload al backend

El BFF (server action, `X-API-Key`) hace:

```
POST {BOT_API_BASE_URL}/whatsapp/embedded-signup/complete
```

Producción: `https://api-chatbotmanager.easycomp.cl/whatsapp/embedded-signup/complete`

```json
{
  "code": "<auth_code>",
  "waba_id": "...",
  "phone_number_id": "...",
  "business_id": "...",
  "tenant_id": "<business_id del cliente actual>",
  "redirect_uri": "https://chatbotmanager.easycomp.cl/onboarding/whatsapp/callback"
}
```

`redirect_uri` es la URL registrada en Meta. El exchange `code → token` lo hace **solo el backend**.

Lectura de estado:

```
GET {BOT_API_BASE_URL}/businesses/:businessId/whatsapp/connection
```

Si esos endpoints aún no existen (404/501), la UI muestra **Autorizado en Meta** con `phone_number_id` / `waba_id` / `business_id` y avisa que falta persistir. Spec: [pending/to-backend/backend-whatsapp-embedded-signup-template-provisioning.md](./pending/to-backend/backend-whatsapp-embedded-signup-template-provisioning.md).

## Variables de entorno (Vercel Production)

```
NEXT_PUBLIC_APP_URL=https://chatbotmanager.easycomp.cl
NEXT_PUBLIC_META_APP_ID=1642810900259407
NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID=1919146745399628
NEXT_PUBLIC_META_GRAPH_VERSION=v21.0
NEXT_PUBLIC_BOT_API_BASE_URL=https://api-chatbotmanager.easycomp.cl
BOT_API_BASE_URL=https://api-chatbotmanager.easycomp.cl
BOT_API_SECRET=<mismo INTERNAL_API_KEY del backend>
```

No hay tokens de larga duración en el front. `config_id` y `app_id` sí son públicos (`NEXT_PUBLIC_`).

## Embedded Signup (docs vigentes)

`FB.login` con:

- `config_id`: `1919146745399628`
- `response_type`: `"code"`
- `override_default_response_type`: `true`
- `extras.setup`: `{}`
- `extras.sessionInfoVersion`: `"3"` (session logging actual para IDs)

No se envía `featureType` (eso es Coexistence / WhatsApp Business app). No se envían campos deprecados de versión Embedded Signup.

Evento `message` con `type === "WA_EMBEDDED_SIGNUP"`: se capturan `phone_number_id`, `waba_id`, `business_id`.

## Estados visibles

| Estado | UI |
|--------|----|
| Idle | Botón **Conectar con Meta** |
| Connecting | “Esperando a Meta…” |
| Completing | “Guardando conexión…” |
| Connected | Badge **Conectado** + número / IDs |
| Autorizado, backend 404 | Badge **Autorizado en Meta** + aviso de persistencia |
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
6. Volver a la UI: URL `/onboarding/whatsapp/callback` y estado **Conectado** (o **Autorizado en Meta** si el backend aún no persiste).
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
