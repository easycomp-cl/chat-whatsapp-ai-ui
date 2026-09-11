# Ventana 24 h WhatsApp + plantillas (recontacto)

> **UI:** contador y bloqueo de mensajes libres implementados en el chat.  
> **Backend pendiente:** envío de plantillas Meta (fuera de ventana).

## Regla de Meta (no se puede “corregir” desde la app)

WhatsApp Cloud API distingue dos modos:

| Situación | Qué permite Meta | Costo típico |
|-----------|------------------|--------------|
| **Dentro de ventana** — último mensaje **del cliente** hace &lt; 24 h | Texto libre, media, botones/lista de sesión | Gratis (mensajes de servicio) |
| **Fuera de ventana** — pasaron ≥ 24 h sin que el cliente escriba | Solo **plantillas aprobadas** (`UTILITY`, `MARKETING`, `AUTHENTICATION`) | Según categoría y país (desde jul-2025, por mensaje entregado) |

La ventana se **reinicia** cada vez que el cliente envía un mensaje entrante.

**No existe** forma de extender la ventana 24 h con mensajes libres. Los seguimientos de handoff, pedidos o avisos fuera de plazo **deben** ir por plantilla (idealmente **UTILITY** si son transaccionales).

Referencias: [Message templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/), roadmap interno `docs/pending/whatsapp-cta-templates-roadmap.md`.

---

## Caso Diego (56996684732) vs Israel (56940414977)

- Diego: último inbound **27-jul** → ventana cerrada el **28-jul**.
- Mensajes “hola” del **01-ago** quedan en `SENT` (Meta acepta API) pero **no entregan** al celular.
- Israel: inbound reciente → ventana abierta → `DELIVERED` / `READ`.

---

## Qué hace la UI hoy

| Pieza | Archivo |
|-------|---------|
| Cálculo ventana (último inbound + 24 h) | `src/lib/conversations/whatsapp-service-window.ts` |
| Hook con tick cada 30 s | `src/features/conversations/hooks/use-whatsapp-service-window.ts` |
| Indicador ventana 24 h (`HH:MM:SS`) junto a Vista previa | `whatsapp-service-window-indicator.tsx` |
| Bloqueo composer (texto, media, interactivos) | `reply-form.tsx` cuando `canSendSessionMessage === false` |

Estados del banner:

- **Verde** — ventana abierta, cuenta regresiva.
- **Ámbar** — menos de 1 h restante.
- **Rojo** — cerrada; explica plantillas y handoff.
- **Gris** — cliente nunca escribió (solo plantilla para iniciar).

Fuente del “último mensaje del cliente”: último `INBOUND` en el chat cargado (misma regla que Meta). `customers.last_seen_at` solo como respaldo si no hay inbound visible (p. ej. chat limpiado), parseado como UTC vía `parseAppDateTime`.

---

## Solución óptima para easycomp-chat-bot-manager (producto)

### Fase A — Ya en UI ✅

1. Contador 24 h visible en el chat.
2. Bloquear envío libre fuera de ventana (evita falsos `SENT`).
3. Mensaje claro en derivaciones: usar plantilla o esperar respuesta del cliente.

### Fase B — Backend + UI (prioridad alta)

Spec: `docs/pending/to-backend/backend-whatsapp-message-templates.md`

1. **`GET /businesses/:id/whatsapp/templates`** — listar plantillas `APPROVED` desde Meta (cache 5–15 min).
2. **`POST /conversations/:id/messages/template`** — enviar plantilla con variables.
3. **Validación servidor** — rechazar texto libre si ventana cerrada (`422 SERVICE_WINDOW_CLOSED`).
4. **Campo recomendado** `Conversation.last_customer_message_at` — evita depender solo del historial paginado / chat limpiado.

### Fase C — Plantillas recomendadas por negocio

Crear en Meta Business Manager (categoría **UTILITY** cuando aplique):

| Caso | Ejemplo plantilla | Variables |
|------|-------------------|-----------|
| Seguimiento handoff | `seguimiento_asesor_es` | `{{1}}` nombre, `{{2}}` motivo breve |
| Estado de pedido | `pedido_actualizacion_es` | `{{1}}` nº pedido, `{{2}}` estado |
| Recordatorio cita | `cita_recordatorio_es` | fecha, hora |

Evitar promociones en plantillas UTILITY (Meta puede reclasificar a MARKETING).

### Fase D — Automatización opcional (backend)

- Al **handoff** con ventana cerrada: sugerir plantilla `seguimiento_asesor_es` pre-rellenada.
- Al cambiar estado de pedido en ERP: disparar plantilla UTILITY (webhook interno).

### Fase E — CTA URL / llamar (dentro de ventana)

`docs/pending/to-backend/backend-whatsapp-cta-outbound.md` — útil pero no sustituye plantillas fuera de 24 h.

---

## Prueba manual

1. Chat con cliente que escribió hace &lt; 24 h → banner verde, envío libre OK.
2. Chat con último inbound &gt; 24 h (ej. Diego) → banner rojo, composer bloqueado, toast al intentar enviar.
3. Cliente escribe de nuevo → banner vuelve a verde sin recargar (Realtime + tick del hook).

---

## Pendiente backend

Ver [../whatsapp-meta-plantillas-plan-maestro.md](../whatsapp-meta-plantillas-plan-maestro.md) para el plan completo (manual + prioridades).
