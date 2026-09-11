# Backend — Mensajes CTA WhatsApp (URL / llamar)

## Resumen

Botones **Call-to-Action** dentro de la ventana de 24 h: el cliente toca y **abre un enlace** o **inicia una llamada**. Distinto de botones de **respuesta** (choice) que ya existen.

**Prioridad:** después de plantillas. **Bloquea en UI:** opciones “Enlace WA” / “Llamar WA” en menú **+**.

---

## Tipos Meta (Cloud API)

### CTA URL (recomendado primero)

```json
{
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": { "text": "Revisa el estado de tu pedido" },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Ver pedido",
        "url": "https://tienda.ejemplo.cl/pedido/123"
      }
    }
  }
}
```

### Botón con URL en mensaje interactivo clásico (legacy)

Algunas cuentas usan `button` + `url` en templates; para sesión usar `cta_url` según doc actual de Meta.

### Llamar (phone)

Interactive con botón que dispara llamada — verificar versión API; alternativa: CTA con `tel:` en flujos permitidos o plantilla con botón PHONE_NUMBER.

---

## API sugerida

```
POST /conversations/:conversationId/messages/cta
```

Body (URL):

```json
{
  "type": "url",
  "body": "Aquí puedes ver tu pedido:",
  "display_text": "Ver pedido",
  "url": "https://tienda.ejemplo.cl/pedido/123",
  "agent_phone": "+569..."
}
```

Body (llamar — si API lo soporta en interactive):

```json
{
  "type": "phone",
  "body": "¿Necesitas ayuda? Llámanos:",
  "display_text": "Llamar soporte",
  "phone_number": "+56221234567"
}
```

Response `201`: mensaje serializado.

---

## Persistencia

| Campo | Valor |
|-------|-------|
| `content_type` | `INTERACTIVE` o `CTA` |
| `content_text` | body + `[display_text]` |
| `rawPayloadJson.outbound.cta` | `{ type, body, display_text, url \| phone_number }` |

Reutilizar componente UI de preview similar a botones (1–2 acciones, sin “respuesta” del cliente en dashboard).

---

## Validaciones

- Ventana 24 h activa (último inbound del cliente < 24 h).
- `body` ≤ 1024 caracteres.
- `display_text` ≤ 20 caracteres.
- `url` HTTPS válida (Meta rechaza HTTP en producción).
- `phone_number` E.164.

---

## Implementación en `chat-whatsapp-ai`

1. `WhatsAppClient.sendCtaUrlMessage()` (y phone si aplica).
2. Controller + ingest análogo a `sendConversationInteractiveMessage`.
3. No confundir con `sendInteractiveButtonMessage` (reply buttons).

---

## Prueba E2E

1. Cliente escribió hace < 24 h.
2. Asesor envía CTA URL desde dashboard.
3. Cliente ve botón “Ver pedido”; al tocar abre navegador.
4. Mensaje en hilo con preview CTA (no clicable en web).

---

## UI (este repo, cuando backend listo)

- **+** → “Enlace WA” / “Llamar WA”.
- Composer: burbuja editable (body + texto botón + URL/tel), mismo patrón que `InteractiveComposeBubble`.
