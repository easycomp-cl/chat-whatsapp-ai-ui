# Backend — Embedded Signup + provisión de plantillas WhatsApp

> **Repo:** `chat-whatsapp-ai`  
> **Bloquea en UI:** “Conectar WhatsApp” en onboarding + creación automática de pack UTILITY  
> **Prerequisito manual:** app Meta configurada — ver [../whatsapp-meta-plantillas-plan-maestro.md](../whatsapp-meta-plantillas-plan-maestro.md)

---

## Resumen

1. **Embedded Signup:** el admin del negocio autoriza a easycomp-chat-bot-manager; guardamos `waba_id`, `phone_number_id`, tokens.
2. **Provisión de plantillas:** tras conectar (o al completar onboarding), el backend crea un pack UTILITY en la WABA del negocio vía Graph API y persiste estado hasta aprobación Meta.

**Envío** de plantillas ya aprobadas: ver [backend-whatsapp-message-templates.md](./backend-whatsapp-message-templates.md).

---

## Parte 1 — Embedded Signup

### Flujo

```
UI → abre FB.login / Embedded Signup con META_CONFIG_ID
Meta → usuario elige WABA + número
Meta → redirect / postMessage con code
Backend → intercambia code por access_token
Backend → GET debug_token, owned WABAs, phone numbers
Backend → guarda TenantChannel { tenantId, wabaId, phoneNumberId, encryptedToken, expiresAt }
```

### Persistencia sugerida

Extender `TenantChannel` (o tabla `whatsapp_connections`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `tenantId` | FK | Negocio |
| `wabaId` | string | WABA de Meta |
| `phoneNumberId` | string | ID del número Cloud API |
| `displayPhoneNumber` | string | E.164 para UI |
| `accessTokenEncrypted` | string | Cifrado en reposo |
| `tokenExpiresAt` | datetime? | Si aplica |
| `connectedAt` | datetime | |
| `connectedByUserId` | uuid? | Perfil que conectó |

### API que la UI ya llama (implementar en `chat-whatsapp-ai`)

Base: `https://api-chatbotmanager.easycomp.cl`  
Auth: `X-API-Key` (igual que el resto del bot API).  
**No** intercambiar el `code` en el browser.

```
POST /whatsapp/embedded-signup/complete
```

Body (la UI envía exactamente esto):

```json
{
  "code": "<exchangeable token code de FB.login>",
  "waba_id": "123",
  "phone_number_id": "456",
  "business_id": "789",
  "tenant_id": "<uuid del negocio en easyCOMP>",
  "redirect_uri": "https://chatbotmanager.easycomp.cl/onboarding/whatsapp/callback"
}
```

Campos `waba_id` / `phone_number_id` / `business_id` pueden venir `null` si el `postMessage` no llegó; el backend debe descubrirlos con `debug_token` + Graph.

Respuesta 200 esperada:

```json
{
  "connected": true,
  "phone_number": "+56912345678",
  "phone_number_id": "456",
  "waba_id": "123",
  "business_id": "789",
  "status": "connected"
}
```

```
GET /businesses/:businessId/whatsapp/connection
→ { connected, waba_id, phone_number, phone_number_id, business_id, status }
```

Alias aceptable (si prefieren anidar en el negocio):

```
POST /businesses/:businessId/whatsapp/connection/complete
```

Hoy la UI **no** usa ese alias: implementen `POST /whatsapp/embedded-signup/complete` o avisen para cambiar el path.

### Persistencia sugerida

### Permisos Meta requeridos

- `whatsapp_business_management`
- `whatsapp_business_messaging`
- `business_management`

### UI (este repo — ya implementado)

- `/onboarding/whatsapp` — botón **Conectar con Meta**.
- Tras Embedded Signup: `POST /whatsapp/embedded-signup/complete`.
- Si el endpoint aún no existe, la UI muestra IDs y estado “autorizado en Meta”.
- Detalle de rutas y OAuth URIs: [../../cambios-ui-whatsapp-embedded-signup.md](../../cambios-ui-whatsapp-embedded-signup.md).

---

## Parte 2 — Crear plantillas (provisión)

### Graph API

```
POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates
```

Body ejemplo:

```json
{
  "name": "seguimiento_asesor_es",
  "language": "es",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "Hola {{1}}, recibimos tu consulta en {{2}}. Un asesor te contactará pronto por este chat.",
      "example": {
        "body_text": [["María", "Mi Negocio"]]
      }
    }
  ]
}
```

Respuesta: `{ "id": "...", "status": "PENDING", "category": "UTILITY" }`

### Pack inicial (constante en backend)

Definir array `DEFAULT_UTILITY_TEMPLATES` con los 3 templates del [plan maestro](../whatsapp-meta-plantillas-plan-maestro.md):

- `seguimiento_asesor_es`
- `pedido_actualizacion_es`
- `recordatorio_cita_es`

### API sugerida

```
POST /businesses/:businessId/whatsapp/templates/provision-defaults
     → crea las que falten (idempotente por name+language)
     Response: { created: [...], skipped: [...], pending: [...] }

GET  /businesses/:businessId/whatsapp/templates?status=APPROVED|PENDING|REJECTED
     → proxy Meta + merge con tabla local de estado
```

### Tabla local opcional `WhatsappTemplate` (recomendada)

| Campo | Uso |
|-------|-----|
| `tenantId` | Negocio |
| `metaTemplateId` | ID Meta |
| `name` | `seguimiento_asesor_es` |
| `language` | `es` |
| `category` | UTILITY |
| `status` | PENDING / APPROVED / REJECTED |
| `rejectionReason` | Si Meta rechaza |
| `bodyPreview` | Texto para UI |
| `variableCount` | Para formulario envío |
| `provisionedAt` | |

### Webhook Meta — cambio de estado plantilla

Suscribir campo `message_template_status_update` en el webhook de la app.

Al recibir evento:
- Actualizar `WhatsappTemplate.status`
- Opcional: notificar UI vía Realtime o email al admin del negocio

Payload típico incluye `message_template_id`, `event` (`APPROVED` | `REJECTED`), `reason`.

---

## Parte 3 — Validaciones

- Solo `BUSINESS_ADMIN` (o rol equivalente) puede conectar WABA y provisionar plantillas.
- No crear duplicado si `name` + `language` ya existe en WABA (consultar Meta antes o capturar error).
- Rate limit Meta: máx. **100 plantillas / hora / WABA** — el pack de 3 es seguro.
- Categoría UTILITY: validar texto en backend antes de POST (sin palabras promo flaggeadas).

---

## Parte 4 — Errores comunes

| Error Meta | Causa | Acción |
|------------|-------|--------|
| Template name already exists | Duplicado | Skip o versionar nombre |
| Invalid parameter | Variables mal formadas | Revisar `{{1}}` consecutivos |
| Category mismatch | Texto promocional en UTILITY | Reescribir o usar MARKETING |
| OAuth token expired | Token vencido | Refrescar / reconectar |

---

## Prueba E2E

1. Negocio nuevo completa Embedded Signup.
2. `POST .../templates/provision-defaults` → 3× `PENDING`.
3. Esperar webhook o poll → `APPROVED`.
4. `GET .../templates?status=APPROVED` → 3 plantillas.
5. Enviar una con `POST .../conversations/:id/messages/template` (spec hermana).

---

## Orden vs `backend-whatsapp-message-templates.md`

| Orden | Documento | Por qué |
|-------|-----------|---------|
| 1º | Este doc (P1 Embedded Signup) | Sin WABA no hay dónde crear/enviar |
| 2º | message-templates (listar + enviar) | MVP con plantillas creadas a mano en Meta |
| 3º | Este doc (P2 provisión API) | Automatizar pack al onboarding |
