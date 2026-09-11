# Plan maestro — Meta, WABA, plantillas UTILITY y ventana 24 h

> **Repos:** UI `chat-whatsapp-ai-ui` · Backend `chat-whatsapp-ai`  
> **Última actualización:** 2026-08-01  
> **Audiencia:** producto, ops (tú) y equipos de desarrollo

Este documento consolida **todo lo pendiente**, en **orden de prioridad**, y separa claramente **qué debes hacer tú a mano en Meta** vs **qué se implementa en código**.

---

## Resumen en 30 segundos

| Pregunta | Respuesta |
|----------|-----------|
| ¿Plantillas compartidas entre TWD, panadería y ferretería? | **No.** Cada negocio tiene su WABA y sus plantillas en Meta. |
| ¿Se pueden crear desde easycomp-chat-bot-manager? | **Sí, es el objetivo** — con permisos del negocio vía Embedded Signup + API de Meta. **Hoy no está implementado.** |
| ¿Se salta la aprobación de Meta? | **Nunca.** Siempre `PENDING` → `APPROVED` / `REJECTED`. |
| ¿Qué ya funciona en la UI? | Contador 24 h, bloqueo de mensajes libres fuera de ventana, media con reintentos. |
| ¿Qué bloquea recontacto fuera de 24 h? | Backend: listar + enviar plantillas. Meta: plantillas aprobadas por negocio. |

---

## ✅ Ya hecho (UI — este repo)

| Pieza | Estado |
|-------|--------|
| Contador ventana 24 h (`HH:MM:SS`) junto a Vista previa | ✅ |
| Bloqueo composer fuera de ventana | ✅ |
| Tooltip explicativo ventana | ✅ |
| Reintentos carga imágenes (404 ingest) | ✅ |
| Spec envío plantillas | 📄 `to-backend/backend-whatsapp-message-templates.md` |
| Spec Embedded Signup + provisión plantillas | 📄 `to-backend/backend-whatsapp-embedded-signup-template-provisioning.md` |

---

## 🔴 LO QUE DEBES HACER TÚ MANUALMENTE (Meta / ops)

Haz esto **antes o en paralelo** al desarrollo. Sin esto, el código no puede probarse en serio.

### A. Cuenta y app Meta (una vez — easycomp-chat-bot-manager como plataforma)

- [ ] **Meta Business Manager** de EasyComp / easycomp-chat-bot-manager verificado ([business.facebook.com](https://business.facebook.com)).
- [ ] **App en Meta for Developers** con producto **WhatsApp** activado ([developers.facebook.com](https://developers.facebook.com)).
- [ ] Anotar y guardar en gestor de secretos (nunca en Git):
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `META_CONFIG_ID` (para Embedded Signup, cuando lo configuren)
- [ ] Solicitar permisos avanzados si aplica:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
  - `business_management`
- [ ] Configurar **Embedded Signup** en la app Meta (cuando backend esté listo para integrar):
  - Callback URL de OAuth
  - Dominios permitidos (prod + staging + `localhost` dev)
  - Doc Meta: [Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [ ] **Webhook** de la app apuntando al backend prod (`chat-whatsapp-ai`):
  - Verificar que llegan `messages` y `statuses` (entrega/leído)
  - Campo `message_template_status_update` (cuando implementen provisión automática)
- [ ] Método de pago en Meta Business (mensajes plantilla pueden tener costo por país).

### B. Por cada negocio piloto (TWD, panadería, etc.)

- [ ] El admin del negocio tiene acceso de **admin** al **Meta Business** que posee el número WhatsApp.
- [ ] Número WhatsApp Business **no usado** en la app móvil personal (o migrado a API).
- [ ] Completar **Conectar WhatsApp** en easycomp-chat-bot-manager (cuando exista Embedded Signup) **o** vincular manualmente WABA + `phone_number_id` en backend hoy.
- [ ] Anotar por negocio:
  - `WABA_ID`
  - `phone_number_id`
  - Número visible al cliente (`+56…`)

### C. Plantillas UTILITY — piloto manual (mientras no exista creación desde app)

Para **cada negocio piloto**, crear en [WhatsApp Manager → Plantillas](https://business.facebook.com/wa/manage/message-templates/):

| Nombre sugerido | Categoría | Cuerpo (ejemplo) | Variables |
|-----------------|-----------|------------------|-----------|
| `seguimiento_asesor_es` | UTILITY | Hola {{1}}, recibimos tu consulta en {{2}}. Un asesor te contactará pronto. | nombre, negocio |
| `pedido_actualizacion_es` | UTILITY | Hola {{1}}, tu pedido {{2}} está: {{3}}. | nombre, nº pedido, estado |
| `recordatorio_cita_es` | UTILITY | Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. | nombre, fecha, hora |

**Reglas al redactar (evitar rechazo):**
- Sin promociones, descuentos ni “aprovecha” en UTILITY.
- Sin URLs acortadas sospechosas en el cuerpo si no hace falta.
- Idioma `es` / `es_CL` consistente con el envío.
- Esperar estado **APPROVED** antes de probar envío.

- [ ] Crear las 3 plantillas en WABA de **TWD** (piloto 1).
- [ ] Repetir en WABA de **segundo negocio** cuando prueben multitenancy.
- [ ] Guardar captura o export de nombres exactos (`seguimiento_asesor_es`, etc.) — el backend los usa tal cual.

### D. Pruebas manuales que puedes hacer hoy (sin plantillas en app)

- [ ] Cliente escribe → ventana abierta → responder texto libre → llega al celular.
- [ ] Pasadas 24 h sin inbound → contador `00:00:00` → composer bloqueado.
- [ ] Cliente escribe de nuevo → contador se reinicia.
- [ ] Enviar imagen inbound → debe cargar en dashboard (puede tardar unos segundos).

---

## 📋 Prioridades de implementación (orden de trabajo)

| Prioridad | Qué | Repo | Depende de | Esfuerzo |
|-----------|-----|------|------------|----------|
| **P0** | Prerrequisitos Meta (sección A y B arriba) | **Tú (manual)** | — | 1–3 días |
| **P1** | Embedded Signup: conectar WABA del negocio | Backend + UI | P0, app Meta | Alto |
| **P2** | Listar plantillas `APPROVED` del negocio | Backend | P1 o WABA manual | Medio |
| **P3** | Enviar plantilla en conversación | Backend + UI | P2, plantillas APPROVED | Medio |
| **P4** | Validar ventana 24 h en servidor (`422` si texto libre fuera de ventana) | Backend | P3 | Bajo |
| **P5** | Crear plantillas desde app (pack UTILITY al onboarding) | Backend + UI | P1, permisos Meta | Alto |
| **P6** | Webhook `message_template_status_update` → UI estado pendiente/aprobada | Backend + UI | P5 | Medio |
| **P7** | CTA URL / llamar (dentro ventana 24 h) | Backend + UI | — | Medio |
| **P8** | `Conversation.last_customer_message_at` en BD | Backend | — | Bajo |

**Recomendación:** no empezar P5 hasta tener P1–P3 funcionando con plantillas creadas **a mano** en Meta (sección C).

---

## Fase P1 — Conectar WhatsApp del negocio (Embedded Signup)

**Objetivo:** al registrarse, el negocio autoriza a easycomp-chat-bot-manager y quedan guardados `waba_id`, `phone_number_id`, token.

| Quién | Tarea |
|-------|--------|
| **Tú** | Configurar Embedded Signup en Meta Developers (sección A). |
| **Backend** | OAuth callback, guardar tokens cifrados, `TenantChannel`, refresco de token. |
| **UI** | Botón “Conectar WhatsApp” en onboarding / ajustes; estado conectado / pendiente. |

**Spec detallada:** [to-backend/backend-whatsapp-embedded-signup-template-provisioning.md](./to-backend/backend-whatsapp-embedded-signup-template-provisioning.md)

**Criterio de listo:** negocio piloto conecta su número sin que ops pegue tokens a mano en `.env`.

---

## Fase P2–P3 — Listar y enviar plantillas

**Objetivo:** asesor envía plantilla UTILITY con ventana cerrada (`00:00:00`).

| Quién | Tarea |
|-------|--------|
| **Tú** | Plantillas APPROVED en Meta por negocio (sección C). |
| **Backend** | `GET /businesses/:id/whatsapp/templates`, `POST /conversations/:id/messages/template`. |
| **UI** | Menú **+ → Plantilla WA**, modal variables + preview, historial `TEMPLATE`. |

**Spec:** [to-backend/backend-whatsapp-message-templates.md](./to-backend/backend-whatsapp-message-templates.md)

**Criterio de listo:** conversación con ventana cerrada → enviar `seguimiento_asesor_es` → cliente recibe en WhatsApp → mensaje en BD con wamid.

---

## Fase P5–P6 — Crear plantillas desde easycomp-chat-bot-manager

**Objetivo:** al terminar onboarding (o en Ajustes → Plantillas), easycomp-chat-bot-manager propone pack UTILITY y llama `POST /{WABA_ID}/message_templates`; la UI muestra “Pendiente de Meta” hasta `APPROVED`.

| Quién | Tarea |
|-------|--------|
| **Tú** | Permisos `whatsapp_business_management` aprobados en app Meta. |
| **Backend** | Crear plantilla, listar estados, webhook status update. |
| **UI** | Pantalla plantillas: crear / ver estado / reintentar si REJECTED. |

**Spec:** misma que P1, sección “Provisión de plantillas”.

**Criterio de listo:** negocio nuevo → un clic “Activar pack UTILITY” → 3 plantillas en PENDING → tras horas APPROVED → enviables desde chat.

---

## Multitenancy (recordatorio)

```
Empresa TWD     → su WABA → sus plantillas → sus clientes
Panadería       → su WABA → sus plantillas → sus clientes
Ferretería Pepe → su WABA → sus plantillas → sus clientes
```

easycomp-chat-bot-manager **no** comparte plantillas entre negocios. Puede **sugerir el mismo texto**, pero cada una se crea y aprueba en la WABA de ese negocio.

---

## Pack UTILITY sugerido (copy-paste Meta o API)

Usar como definición del “pack inicial” en backend:

### 1. `seguimiento_asesor_es`

- **Categoría:** UTILITY  
- **Idioma:** `es`  
- **Body:** `Hola {{1}}, recibimos tu consulta en {{2}}. Un asesor te contactará pronto por este chat.`  
- **Ejemplo variables:** `María` · `Panadería Don Pepe`

### 2. `pedido_actualizacion_es`

- **Body:** `Hola {{1}}, tu pedido {{2}} tiene el siguiente estado: {{3}}.`  
- **Ejemplo:** `Juan` · `#1042` · `En preparación`

### 3. `recordatorio_cita_es`

- **Body:** `Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. Si necesitas cambiarla, responde por este chat.`  
- **Ejemplo:** `Ana` · `05/08/2026` · `10:30`

---

## Prueba E2E completa (cuando P1–P3 estén listos)

1. Negocio conectado vía Embedded Signup (o WABA manual).
2. Plantilla `seguimiento_asesor_es` en estado **APPROVED**.
3. Conversación sin inbound > 24 h → contador `00:00:00`.
4. **+ → Plantilla WA** → elegir plantilla → rellenar variables → enviar.
5. Cliente recibe mensaje en WhatsApp.
6. Dashboard: mensaje saliente, ticks de entrega, ventana sigue cerrada hasta que el cliente responda.

---

## Referencias internas

| Documento | Contenido |
|-----------|-----------|
| [whatsapp-service-window-and-templates.md](./whatsapp-service-window-and-templates.md) | Ventana 24 h + UI actual |
| [whatsapp-cta-templates-roadmap.md](./whatsapp-cta-templates-roadmap.md) | Roadmap CTA y plantillas |
| [to-backend/backend-whatsapp-message-templates.md](./to-backend/backend-whatsapp-message-templates.md) | API listar + enviar |
| [to-backend/backend-whatsapp-embedded-signup-template-provisioning.md](./to-backend/backend-whatsapp-embedded-signup-template-provisioning.md) | Conectar Meta + crear plantillas |
| [onboarding-setup-wizard-ui.md](./onboarding-setup-wizard-ui.md) | Wizard; CTA “Conectar WhatsApp” pendiente |

## Referencias Meta

- [Message templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/)
- [Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Template categories (UTILITY)](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/)

---

## Checklist rápido “¿qué hago esta semana?”

**Si eres ops / producto (tú):**

1. Completar sección **A** (app Meta + webhooks + billing).
2. Elegir **1 negocio piloto** (ej. TWD) y sección **B**.
3. Crear **3 plantillas UTILITY** a mano (sección **C**) y esperar APPROVED.
4. Pasar al backend los nombres exactos + WABA_ID para pruebas de P2–P3.

**Si eres backend:**

1. Leer `backend-whatsapp-message-templates.md` → implementar P2–P3.
2. Leer `backend-whatsapp-embedded-signup-template-provisioning.md` → planificar P1.

**Si eres UI (este repo):**

1. Esperar P2–P3 en API.
2. Implementar modal **Plantilla WA** en composer.
3. Tras P1: botón Conectar WhatsApp en onboarding.
4. Tras P5: pantalla gestión plantillas + estados.
