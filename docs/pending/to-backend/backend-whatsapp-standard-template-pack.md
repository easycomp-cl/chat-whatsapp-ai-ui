# Backend — Pack estándar de plantillas (auto al conectar WhatsApp)

> **Repo:** `chat-whatsapp-ai`  
> **UI:** este repo lista estados y envía las `APPROVED`.  
> Relacionado: [backend-whatsapp-embedded-signup-template-provisioning.md](./backend-whatsapp-embedded-signup-template-provisioning.md), [backend-whatsapp-message-templates.md](./backend-whatsapp-message-templates.md), [backend-admin-phone-verification.md](./backend-admin-phone-verification.md)

## ¿Se puede automatizar?

**Sí.** Tras Embedded Signup el backend llama a Graph API:

```
POST https://graph.facebook.com/{version}/{WABA_ID}/message_templates
```

Cada negocio recibe **su propia copia** del mismo pack (misma redacción, distinta WABA). easyCOMP no comparte una plantilla global entre clientes.

**No.** Meta **siempre** revisa. El API solo crea en `PENDING`. Horas o 1–2 días después pasa a `APPROVED` o `REJECTED`. Nadie (ni UI ni backend) puede saltarse esa cola.

## Quién hace qué

| Paso | Quién |
|------|--------|
| 1. Cliente conecta WhatsApp (Embedded Signup) | UI ya lo dispara |
| 2. Guardar WABA + token | Backend |
| 3. `POST message_templates` del pack (idempotente) | Backend, **automático** al `complete` del signup (y reintento si falló) |
| 4. Revisión humana/automática de Meta | Meta |
| 5. Webhook `message_template_status_update` | Backend persiste `APPROVED` / `REJECTED` |
| 6. Composer: “Plantilla WA” + OTP responsable | UI, solo si `APPROVED` |

## Cuándo disparar

Al éxito de `POST /whatsapp/embedded-signup/complete`:

1. Persistir canal.
2. Encolar job `provisionStandardTemplates(businessId)` (no bloquear el HTTP del signup).
3. Job: para cada item del pack, si no existe `name+language` en esa WABA → crear.
4. Guardar filas `WhatsappTemplate`.
5. Reintentos: 3× con backoff si Graph 5xx / rate limit.

También: `POST /businesses/:id/whatsapp/templates/provision-defaults` para reintentar a mano desde **Mis plantillas**.

## Pack estándar (`STANDARD_TEMPLATE_PACK`)

Idioma `es`. Textos **UTILITY** sin promo (sin “oferta”, “descuento”, “aprovecha”).

| name | category | Uso en producto |
|------|----------|-----------------|
| `verificar_responsable_es` | UTILITY | Confirmar WhatsApp personal del admin (botón Confirmar) |
| `aviso_handoff_es` | UTILITY | Aviso al responsable: cliente necesita humano |
| `seguimiento_asesor_es` | UTILITY | Recontacto al **cliente** con ventana 24 h cerrada |
| `pedido_actualizacion_es` | UTILITY | Estado de pedido (ventana cerrada o abierta) |
| `recordatorio_cita_es` | UTILITY | Recordatorio de cita |
| `reabrir_conversacion_es` | UTILITY | Reabrir chat de forma controlada (“¿sigues necesitando ayuda?”) |
| `link_pago_es` | UTILITY | Link de pago (cuerpo + botón URL) |
| `muestra_producto_es` | UTILITY | Detalle del producto consultado |

### 1. `verificar_responsable_es` (UTILITY)

```
Hola {{1}}, fuiste agregado al equipo de {{2}}. Confirma que este número es correcto.
```

Ejemplo: `María` · `EasyComp Repuestos`

Botón URL `Confirmar` → `https://chatbotmanager.easycomp.cl/verify-phone/{{1}}` (sufijo = token). No es AUTHENTICATION/OTP.

### 2. `aviso_handoff_es`

**No** poner el link completo como variable de cuerpo (`{{4}}` = `https://…`). Meta suele rechazar URLs en `BODY` y el texto queda feo. El enlace va en un **botón URL** cuyo sufijo dinámico es el **id** de la conversación.

Cuerpo (3 variables de texto):

```
Hola {{1}}, un cliente de {{2}} espera un humano. Conversación: {{3}}
```

Ejemplo body: `María` · `Panadería Aurora` · `Israel G.`

Botón URL (variable **aparte** del body; en Graph es `{{1}}` del botón, no `{{4}}` del texto):

```
text: Abrir chat
url:  https://chatbotmanager.easycomp.cl/app/conversations/{{1}}
```

Al enviar el aviso, el worker rellena:

| Pieza | Valor |
|-------|--------|
| `body` `{{1}}` | Nombre del responsable |
| `body` `{{2}}` | Nombre del negocio |
| `body` `{{3}}` | Nombre del cliente |
| `button` sufijo | `conversation.id` (UUID). **No** el URL entero |

```json
{
  "name": "aviso_handoff_es",
  "language": { "code": "es" },
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "María" },
        { "type": "text", "text": "Panadería Aurora" },
        { "type": "text", "text": "Israel G." }
      ]
    },
    {
      "type": "button",
      "sub_type": "url",
      "index": "0",
      "parameters": [{ "type": "text", "text": "CONVERSATION_UUID" }]
    }
  ]
}
```

Provisión Graph (`BUTTONS`):

```json
{
  "type": "BUTTONS",
  "buttons": [
    {
      "type": "URL",
      "text": "Abrir chat",
      "url": "https://chatbotmanager.easycomp.cl/app/conversations/{{1}}"
    }
  ]
}
```

Si `aviso_handoff_es` **ya existe** en la WABA sin botón, no se puede editar: crear `aviso_handoff_v2_es` con el botón (o borrar y reprovisionar, vuelve a `PENDING`).

### 3. `seguimiento_asesor_es`

```
Hola {{1}}, recibimos tu consulta en {{2}}. Un asesor te contactará pronto por este chat.
```

Ejemplo: `Camila` · `Panadería Aurora`

### 4. `pedido_actualizacion_es`

```
Hola {{1}}, tu pedido {{2}} tiene el siguiente estado: {{3}}.
```

Ejemplo: `Juan` · `#1042` · `En preparación`

### 5. `recordatorio_cita_es`

```
Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. Si necesitas cambiarla, responde este chat.
```

Ejemplo: `Ana` · `05/08/2026` · `10:30`

### 6. `reabrir_conversacion_es`

Para hablar **controlado** con un cliente cuya ventana 24 h ya cerró (no es texto libre):

```
Hola {{1}}, te escribimos de {{2}} por tu consulta. ¿Sigues necesitando ayuda? Responde este chat y te atendemos.
```

Ejemplo: `Pedro` · `Panadería Aurora`

Eso **reabre la ventana 24 h** cuando el cliente responde. Hasta entonces solo plantilla.

### 7. `link_pago_es`

```
Hola {{1}}, aquí tienes el link de pago de {{2}}.
```

Ejemplo body: `Juan` · `Pedido #1042`

Botón URL `Pagar` → `https://chatbotmanager.easycomp.cl/pay/{{1}}`. Al enviar, `button_parameters: ["pedido-1042"]` (sufijo, no el URL completo). El backend guarda el código y la UI sirve `/pay/:code`.

### 8. `muestra_producto_es`

```
Hola {{1}}, sobre {{2}}: {{3}}.
```

Ejemplo: `Camila` · `Tabla de pino 2x4` · `18 mm, $12.900`

## API (contrato vigente)

```
GET  /businesses/:businessId/whatsapp/templates
GET  /businesses/:businessId/whatsapp/templates?status=APPROVED
POST /businesses/:businessId/whatsapp/templates/provision-defaults
POST /conversations/:id/messages/template
```

Respuesta GET:

```json
{
  "templates": [
    {
      "name": "reabrir_conversacion_es",
      "language": "es",
      "category": "UTILITY",
      "status": "PENDING",
      "quality": null,
      "rejection_reason": null,
      "body_preview": "Hola {{1}}, te escribimos de {{2}} por tu consulta...",
      "variable_count": 2,
      "parameter_fields": [
        { "component": "body", "index": 1, "label": "Nombre del cliente", "example": "Pedro" },
        { "component": "body", "index": 2, "label": "Nombre del negocio", "example": "Panadería Aurora" }
      ],
      "in_pack": true,
      "product_use": "Reabrir chat de forma controlada",
      "meta_template_id": "123",
      "last_error": null,
      "updated_at": "2026-09-15T00:00:00.000Z"
    }
  ],
  "pack": "standard_v1",
  "connected": true
}
```

Envío (solo `APPROVED`): `{ "template_name", "language_code", "body_parameters", "agent_phone" }`. `link_pago_es` también acepta `button_parameters`. Un `201` es Graph `SENT`; fallos de cobro llegan después por Realtime (`FAILED` + `whatsapp_delivery_error_*`).

Detalle UI: [../whatsapp-templates-ui.md](../whatsapp-templates-ui.md).

## UI (este repo)

- **Mis plantillas** (`/app/templates`): lista del pack con chips Pendiente / Aprobada / Rechazada.
- Composer con ventana cerrada: solo plantillas `APPROVED` del pack (más las que el negocio cree después), vía `parameter_fields` + `body_preview`.
- Confirmación del responsable: solo si `verificar_responsable_es` está `APPROVED` (botón Confirmar, no OTP).

## Prueba

1. Signup WABA de un negocio de prueba.
2. Job crea 8 plantillas → `PENDING` en Graph y en BD.
3. Aprobar en WhatsApp Manager **o** esperar webhook.
4. Ventana cerrada → enviar `reabrir_conversacion_es` → llega al cliente.
5. Cliente responde → ventana 24 h abierta → texto libre otra vez.
6. Confirmación admin con `verificar_responsable_es` (botón Confirmar).
7. Handoff → `aviso_handoff_es` al personal verificado.
