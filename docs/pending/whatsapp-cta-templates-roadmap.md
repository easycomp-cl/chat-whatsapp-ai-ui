# Roadmap — CTA y plantillas WhatsApp (easycomp-chat-bot-manager)

> **Repo UI:** `chat-whatsapp-ai-ui` · **Backend:** `chat-whatsapp-ai`  
> Complemento a botones/lista interactivos (ya en UI). Este doc prioriza **qué sigue** y **cuándo** tiene sentido para la app.

---

## Contexto

Hoy el dashboard cubre bien la **ventana de 24 h** (cliente escribió recientemente):

| Canal | Estado |
|-------|--------|
| Texto, media, notas de voz | ✅ UI + backend |
| Botones / lista (choice) | ✅ UI lista; backend humano en [to-backend/backend-whatsapp-interactive-outbound-human.md](./to-backend/backend-whatsapp-interactive-outbound-human.md) |
| Bot en flujos (choice) | ✅ Backend |

**Fuera de la ventana 24 h** Meta solo permite iniciar conversación con **plantilla aprobada**.  
**CTA** (botón URL / llamar) mejora mensajes dentro de ventana sin depender de texto plano con links.

---

## Prioridad sugerida (producto)

### Fase 1 — Plantillas de mensaje (alta, si hay recontacto)

**Cuándo importa:** negocio quiere escribir al cliente **después de 24 h** sin esperar que escriba primero (seguimiento, campañas suaves, “¿sigues interesado?”).

**Qué habilita:**

- Asesor elige plantilla aprobada en Meta → envía desde dashboard.
- Variables `{{1}}`, `{{2}}` rellenables en UI.
- Historial con `content_type: TEMPLATE` (o similar).

**Esfuerzo:** medio–alto (sync plantillas Meta, UI selector, reglas de ventana).

**Spec backend:** [to-backend/backend-whatsapp-message-templates.md](./to-backend/backend-whatsapp-message-templates.md)

---

### Fase 2 — CTA URL / llamar (media)

**Cuándo importa:** dentro de 24 h, botones que **abren un link** o **inician llamada** (más claro que URL en texto).

**Qué habilita:**

- Mensaje con 1–2 botones CTA (URL o `tel:`).
- Útil para: rastreo, catálogo web, “Llamar a soporte”.

**No reemplaza** botones de respuesta (choice); es otro tipo de mensaje Meta.

**Esfuerzo:** medio (nuevo `WhatsAppClient.sendCtaMessage`, persistencia, preview UI).

**Spec backend:** [to-backend/backend-whatsapp-cta-outbound.md](./to-backend/backend-whatsapp-cta-outbound.md)

---

### Fase 3 — Catálogo / productos (baja, solo e-commerce)

**Cuándo importa:** negocio usa **WhatsApp Commerce** / catálogo Meta y quiere enviar productos desde el dashboard.

**Esfuerzo:** alto (integración catálogo, SKUs, inventario).

**Decisión:** posponer hasta que un cliente concrete venta por WA con catálogo nativo.

---

### Fase 4 — WhatsApp Flows (baja)

Formularios nativos de Meta (encuestas, registro). Potente pero **paralelo** a los flujos propios del bot. No prioritario mientras `choice` + texto cubren los casos.

---

## Qué haría la UI (cuando backend exista)

| Fase | Menú **+** | Composer |
|------|------------|----------|
| 1 Plantillas | “Plantilla WA” | Selector plantilla + variables + preview |
| 2 CTA | “Botón enlace” / “Botón llamar” | Burbuja editable (similar a interactivo) con URL/tel |
| 3 Catálogo | “Producto” | Buscador catálogo Meta |

Hasta entonces **no** se añaden opciones al **+** para no prometer envío sin API.

---

## Resumen ejecutivo

| Tipo | ¿Importante para easycomp-chat-bot-manager? | Prioridad |
|------|----------------------------|-----------|
| Plantillas | **Sí**, si recontacto fuera de 24 h | **1** |
| CTA URL/llamar | **Útil**, no bloqueante | **2** |
| Catálogo | Solo retail con catálogo WA | **3** |
| Flows Meta | Bajo; flujos propios bastan | **4** |

---

## Referencias

- Interactivos actuales: `docs/cambios-ui-whatsapp-delivery-interactive.md`
- Meta: [Message templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates), [Interactive CTA](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-cta-url-messages)
