# Backend — Plantillas de mensaje WhatsApp (fuera de ventana 24 h)

## Resumen

Permitir al **asesor humano** (y opcionalmente al bot) enviar **message templates** aprobados por Meta cuando la conversación **no está en ventana de servicio** o como mensaje estructurado de apertura.

**Bloquea en UI:** selector de plantillas en composer / acción “Enviar plantilla”.

---

## Reglas Meta (recordatorio)

- Fuera de **24 h** desde el último mensaje **del cliente**, solo plantillas (categoría UTILITY, MARKETING, AUTHENTICATION según caso).
- Plantillas deben estar **APPROVED** en el WABA del negocio.
- Componentes: `header`, `body`, `footer`, `buttons` (quick reply, URL, phone).

---

## API sugerida

### Listar plantillas del negocio

```
GET /businesses/:businessId/whatsapp/templates?status=APPROVED
```

Response:

```json
{
  "templates": [
    {
      "name": "order_update_es",
      "language": "es",
      "status": "APPROVED",
      "category": "UTILITY",
      "components": [
        { "type": "BODY", "text": "Hola {{1}}, tu pedido {{2}} está en camino." }
      ],
      "variable_count": 2
    }
  ]
}
```

Implementación: proxy a Meta `GET /{WABA_ID}/message_templates` con cache corto (5–15 min).

### Enviar plantilla en conversación

```
POST /conversations/:conversationId/messages/template
```

Body:

```json
{
  "template_name": "order_update_es",
  "language_code": "es",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "María" },
        { "type": "text", "text": "#12345" }
      ]
    }
  ],
  "agent_phone": "+569...",
  "reply_to_message_id": "uuid-opcional"
}
```

Response `201`: mensaje serializado (`content_type: TEMPLATE` o `TEXT` con metadata en `rawPayloadJson`).

---

## Persistencia

| Campo | Valor |
|-------|-------|
| `content_type` | `TEMPLATE` (nuevo enum Prisma) o `TEXT` + flag |
| `content_text` | Texto renderizado para inbox (body con variables sustituidas) |
| `rawPayloadJson.outbound.template` | `{ name, language, components, parameters }` |
| `external_id` | wamid de Meta |

Vista `messages` (Supabase): exponer `template_name` / preview si la UI lo necesita en Realtime.

---

## Validaciones

- Canal WhatsApp activo del tenant.
- Plantilla existe y `APPROVED`.
- Número de `parameters` coincide con `{{n}}` del body/header.
- Si ventana 24 h cerrada: solo permitir template (rechazar texto libre — ya debería fallar en Meta).

---

## Implementación en `chat-whatsapp-ai`

1. `WhatsAppClient.sendTemplateMessage()` — Cloud API `type: template`.
2. `messages.controller.ts` — `sendConversationTemplateMessage`.
3. Sync/list templates — job o on-demand con cache Redis/memoria.
4. `MessageIngestService.ingestHumanMessage` con `contentType: TEMPLATE`.

---

## Prueba E2E

1. Plantilla `hello_world` o custom APPROVED en WABA dev.
2. Conversación con ventana cerrada (>24 h sin inbound del cliente).
3. Dashboard: elegir plantilla, rellenar variables, enviar.
4. Cliente recibe plantilla; mensaje en BD con wamid y ticks de entrega.

---

## UI (este repo, cuando backend listo)

- Menú **+** → “Plantilla WA”.
- Modal: lista plantillas, preview, inputs por variable.
- Sin implementar hasta `GET` + `POST` estables.
