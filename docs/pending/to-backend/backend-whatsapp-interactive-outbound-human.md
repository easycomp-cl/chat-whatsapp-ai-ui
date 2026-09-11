# Backend — Envío de mensajes interactivos desde el dashboard (asesor humano)

## Resumen

La UI permite **editar y enviar** mensajes interactivos (botones o lista) desde el menú **+** del composer de conversaciones. El asesor puede probar respuestas del cliente en WhatsApp real.

**Bloqueo actual:** el endpoint humano `POST /conversations/:id/messages` solo acepta `text`. La UI llama a un endpoint nuevo que el backend debe implementar.

---

## Endpoint requerido

```
POST /conversations/:conversationId/messages/interactive
```

### Request body

```json
{
  "interactive": {
    "type": "button",
    "body": "¿Cómo prefieres recibir tu pedido?",
    "buttons": [
      { "id": "delivery", "title": "Despacho" },
      { "id": "pickup", "title": "Retiro en tienda" }
    ]
  },
  "agent_phone": "+569...",
  "reply_to_message_id": "uuid-opcional"
}
```

Lista:

```json
{
  "interactive": {
    "type": "list",
    "body": "Elige el horario de entrega:",
    "buttonText": "Ver opciones",
    "sections": [
      {
        "title": "Horarios",
        "rows": [
          { "id": "morning", "title": "Mañana", "description": "09:00 – 13:00" }
        ]
      }
    ]
  }
}
```

### Validación (ya existe en `whatsapp-interactive.ts`)

| Regla | Valor |
|-------|-------|
| Botones | 1–3 |
| Filas lista | 1–10 |
| `body` | máx. 1024 |
| `button.title` | máx. 20 |
| `row.title` | máx. 24 |
| `row.description` | máx. 72 |
| `buttonText` (lista) | máx. 20 |

### Response `201`

Mismo shape que `POST /conversations/:id/messages` / media (serializer con `content_type: INTERACTIVE`, `interactive`, `whatsapp_delivery_status`, etc.).

---

## Implementación sugerida en `chat-whatsapp-ai`

Reutilizar lógica existente:

1. `OutboundWhatsAppReplyService.sendToWhatsApp()` — ya envía botones/lista vía `WhatsAppClient`.
2. `MessageIngestService.ingestHumanMessage()` — extender para:
   - `contentType: INTERACTIVE`
   - `rawPayloadJson: { outbound: { interactive } }`
   - `contentText: summarizeOutboundInteractive(interactive)`

Flujo en controller (similar a `sendConversationMessage`):

1. Resolver conversación + canal activo.
2. Validar body con Zod (mismo shape que UI `outboundInteractiveSchema`).
3. Opcional: resolver `reply_to_message_id` → `replyToExternalId`.
4. Llamar WhatsApp API (`sendInteractiveButtonMessage` / `sendInteractiveListMessage`).
5. Persistir mensaje humano con `externalId` (wamid).
6. Devolver mensaje serializado.

**Router:** añadir en `router.ts`:

```ts
router.post("/conversations/:id/messages/interactive", sendConversationInteractiveMessage);
```

---

## Recepción de respuestas del cliente

Ya implementado: inbound `button_reply` / `list_reply` → `interactiveSelection` en mapper → flujo/router.

Para pruebas manuales desde dashboard **sin flujo**, el mensaje entrante del cliente aparecerá como `TEXT` con `content_text` = título elegido (comportamiento actual documentado en `whatsapp-interactive-ui.md`).

---

## Prueba E2E

1. Backend desplegado con el endpoint.
2. UI: conversación abierta → **+** → **Botones WA** o **Lista WA**.
3. Editar cuerpo y opciones → **Enviar por WhatsApp**.
4. Cliente recibe botones/lista nativos en WhatsApp.
5. Cliente toca opción → mensaje entrante en dashboard.
6. Mensaje saliente con `content_type: INTERACTIVE` y ticks de entrega.

---

## UI (este repo)

- `InteractiveComposeBubble` — burbuja editable en el composer (reemplaza el textarea).
- `sendConversationInteractiveAction` → `botApi.sendConversationInteractiveMessage`.
- Optimistic `buildOptimisticInteractiveMessage` con `sender_type: HUMAN`.
