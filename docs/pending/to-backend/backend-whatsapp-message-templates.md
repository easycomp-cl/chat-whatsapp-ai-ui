# Backend — Plantillas de mensaje WhatsApp (fuera de ventana 24 h)

> **Estado:** contrato vigente en [../whatsapp-templates-ui.md](../whatsapp-templates-ui.md). El backend ya lista, provisiona y envía; la UI consume ese contrato.

## Resumen

Permitir al **asesor humano** (y opcionalmente al bot) enviar **message templates** aprobados por Meta cuando la conversación **no está en ventana de servicio** o como mensaje estructurado de apertura.

**UI:** selector de plantillas en composer / acción “Plantilla WA”.

---

## Reglas Meta (recordatorio)

- Fuera de **24 h** desde el último mensaje **del cliente**, solo plantillas (categoría UTILITY, MARKETING, AUTHENTICATION según caso).
- Plantillas deben estar **APPROVED** en el WABA del negocio.
- Componentes: `header`, `body`, `footer`, `buttons` (quick reply, URL, phone).

---

## API

### Listar plantillas del negocio

```
GET /businesses/:businessId/whatsapp/templates?status=APPROVED
```

Campos: `name`, `language`, `category`, `status`, `quality`, `rejection_reason`, `body_preview`, `variable_count`, `parameter_fields`, `in_pack`, `product_use`, `meta_template_id`, `last_error`, `updated_at`, más `pack` y `connected` en el envelope.

### Enviar plantilla en conversación

```
POST /conversations/:conversationId/messages/template
```

```json
{
  "template_name": "pedido_actualizacion_es",
  "language_code": "es",
  "body_parameters": ["Juan", "#1042", "En preparación"],
  "button_parameters": ["pedido-1042"],
  "agent_phone": "+569...",
  "reply_to_message_id": "uuid-opcional"
}
```

Respuesta `201`: mensaje serializado con `content_type: "TEMPLATE"`, `template_name` y `template`. Eso es Graph `SENT` + `wamid`. La entrega (o `FAILED` por cobro) llega por webhook / Realtime.

Errores inmediatos: `409 template_not_approved` | `409 not_connected` | `400 parameter_mismatch` | `502/503 whatsapp_send_failed` / `token_expired`.

---

## Persistencia

| Campo | Valor |
|-------|--------|
| `content_type` | `TEMPLATE` |
| `content_text` | Texto renderizado para inbox (body con variables sustituidas) |
| `template_name` / `template` | Nombre y payload de la plantilla |
| `external_id` | wamid de Meta |
| `whatsapp_delivery_error_kind` | Clasificación del fallo asíncrono (`billing_*`, etc.) |

---

## Validaciones

- Canal WhatsApp activo del tenant.
- Plantilla existe y `APPROVED`.
- Número de `body_parameters` coincide con `{{n}}` del body.
- Si ventana 24 h cerrada: solo permitir template (rechazar texto libre — ya debería fallar en Meta).

---

## UI (este repo)

- Menú **+** → “Plantilla WA”.
- Modal: lista `APPROVED`, preview con `body_preview`, inputs por `parameter_fields`.
- Toast si Realtime marca `FAILED` con `whatsapp_delivery_error_message`.
