# Informe para backend — despliegue pendiente en producción

> **Fecha:** 2026-07-28  
> **Estado:** ⏳ **Pendiente deploy prod** (código inbox en repo; 404 en `api.conversai.easycomp.cl`)  
> **Carpeta:** `docs/pending/to-backend/`

---

## Resumen ejecutivo

La UI **sí se conecta correctamente** a producción (`BOT_API_BASE_URL=https://api.conversai.easycomp.cl`). El error que aparece en consola **no es de conexión ni de credenciales**: el servidor de producción tiene una **versión anterior** del backend que **no incluye** el endpoint optimizado de inbox.

Mientras tanto, la UI **sigue funcionando** porque hace fallback a Supabase. El log es informativo, pero indica que falta desplegar código que ya existe en el repo `chat-whatsapp-ai`.

| Funcionalidad UI | Endpoint requerido | Estado en prod (2026-07-28) |
|------------------|-------------------|-------------------------------|
| Lista de conversaciones (optimizada) | `GET /businesses/:id/conversations/inbox` | ❌ **404 — no desplegado** |
| Lista de conversaciones (legacy) | `GET /businesses/:id/conversations` | ✅ 200 |
| Editar mensaje humano (<15 min) | `PATCH /messages/:id` | ✅ Cerrado — **501** (Meta no soporta; UI sin editar) |
| Reenviar mensaje fallido | `POST /messages/:id/resend` | ✅ desplegado (responde JSON) |
| Enviar mensaje | `POST /conversations/:id/messages` | ✅ (ya en uso) |
| Health básico | `GET /businesses/:id` | ✅ 200 |

---

## Error que ve la UI hoy

Al abrir `/app/conversations/[id]`, el servidor Next ejecuta:

```ts
// src/lib/conversations/load-conversations.ts
botApi.listConversationsInbox(businessId, { assigned_admin_id, limit: 100 })
```

Eso llama a:

```http
GET https://api.conversai.easycomp.cl/businesses/{businessId}/conversations/inbox?limit=100
X-API-Key: {BOT_API_SECRET}
```

**Respuesta actual en producción:**

```http
HTTP/1.1 404 Not Found
Cannot GET /businesses/{businessId}/conversations/inbox
```

La UI captura el error y usa **plan B**: carga conversaciones directo desde **Supabase** (`loadConversations`). Por eso el chat funciona, pero:

- Se pierde la query optimizada del backend (1 request vs 3 queries).
- Aparece el log en consola del servidor Next.
- No se aplica el cache HTTP del inbox (`max-age=5`).

---

## Qué versión falta desplegar

El código **ya está implementado** en el repo `chat-whatsapp-ai` (rama principal / últimos commits). Producción está **atrasada** respecto a al menos estos cambios:

### 1. Inbox optimizado (prioridad alta — causa el 404)

| Item | Ubicación en repo |
|------|-------------------|
| Ruta | `src/modules/api/router.ts` → `GET /businesses/:businessId/conversations/inbox` |
| Controller | `src/modules/api/conversations.controller.ts` → `listConversationsInbox` |
| Servicio | `src/modules/conversations/conversations-inbox.service.ts` |
| Spec | `docs/spec-ui-performance-conversaciones-faqs.md` |
| Migración BD | `prisma/migrations/20260713010000_inbox_performance/migration.sql` |

**Contrato esperado por la UI:**

```http
GET /businesses/{businessId}/conversations/inbox?assigned_admin_id={opcional}&limit=100
X-API-Key: {BOT_API_SECRET}
```

**Response 200:**

```json
{
  "conversations": [
    {
      "id": "cuid",
      "business_id": "...",
      "customer_id": "...",
      "channel": "WHATSAPP",
      "channel_phone_number": "+56...",
      "status": "OPEN",
      "mode": "HUMAN",
      "assigned_admin_id": null,
      "handoff_reason": null,
      "bot_resume_at": null,
      "last_message_at": "2026-07-28T...",
      "chat_cleared_at": null,
      "created_at": "...",
      "updated_at": "...",
      "customers": {
        "id": "...",
        "business_id": "...",
        "phone_number": "+569...",
        "name": "Cliente",
        "first_seen_at": null,
        "last_seen_at": null
      },
      "last_message_preview": "Último mensaje visible"
    }
  ]
}
```

**Notas:**

- Campos en **snake_case** (alineado con Supabase / tipos UI).
- `last_message_preview` respeta `chat_cleared_at` (no mostrar mensajes anteriores al clear).
- Cache sugerido: `Cache-Control: private, max-age=5, stale-while-revalidate=10`.

### 2. Editar mensajes WhatsApp — cerrado (no requiere deploy)

| Item | Estado |
|------|--------|
| Ruta | `PATCH /messages/:id` → **501** (Meta no soporta edición real) |
| UI | Sin botón editar — ver `docs/cambios-ui-deshabilitar-editar-whatsapp.md` |
| Spec histórica | `docs/pending/done/backend-editar-mensaje-whatsapp.md` |

No incluir en checklist de deploy salvo que Meta habilite edición por API.

### 3. Migración de base de datos (requerida para inbox)

Aplicar en la misma base que usa Prisma / Supabase:

```bash
# En chat-whatsapp-ai
npm run prisma:migrate
# o manualmente:
# prisma/migrations/20260713010000_inbox_performance/migration.sql
```

Índices creados (performance del preview):

- `Message(conversationId, createdAt DESC)`
- `Message(tenantId, createdAt DESC)`

Sin esta migración, el deploy del código puede fallar o degradar performance del inbox.

---

## Pasos de deploy recomendados

1. **Merge / tag** de `chat-whatsapp-ai` con los cambios de inbox + edit (si no están en la rama que despliegan).
2. **Aplicar migración** `20260713010000_inbox_performance` en Supabase prod.
3. **Build y deploy** imagen ECS / servicio en `api.conversai.easycomp.cl`.
4. **Verificar endpoints** (ver checklist abajo).
5. **No cambiar** `BOT_API_BASE_URL` ni `BOT_API_SECRET` en Vercel (ya apuntan bien).
6. Opcional: redeploy UI en Vercel (no obligatorio solo por inbox; el fallback ya funciona).

---

## Checklist de verificación post-deploy

Ejecutar con `X-API-Key` válido y un `businessId` real:

```bash
BASE="https://api.conversai.easycomp.cl"
BIZ="<business_id>"
KEY="<BOT_API_SECRET>"

# 1. Inbox — debe ser 200, no 404
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "X-API-Key: $KEY" \
  "$BASE/businesses/$BIZ/conversations/inbox?limit=5"

# 2. Body del inbox
curl -s -H "X-API-Key: $KEY" \
  "$BASE/businesses/$BIZ/conversations/inbox?limit=2" | jq '.conversations | length'

# 3. Editar mensaje (mensaje humano <15 min, SENT, con external_id)
curl -s -X PATCH "$BASE/messages/<message_id>" \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Prueba edición"}'

# 4. Cache FAQs (opcional, misma release de performance)
curl -sI -H "X-API-Key: $KEY" \
  "$BASE/businesses/$BIZ/faqs" | grep -i cache-control
```

**Resultado esperado:**

| Prueba | Esperado |
|--------|----------|
| Inbox status | `200` |
| Inbox JSON | `{ "conversations": [ ... ] }` con `last_message_preview` |
| PATCH edit | `200` o `400` con JSON (nunca HTML 502/503) |
| FAQs cache | `Cache-Control: private, max-age=60...` |

---

## Impacto en la UI si no se despliega

| Área | Sin deploy inbox | Con deploy inbox |
|------|------------------|------------------|
| Cargar conversaciones | Fallback Supabase (3 queries) | 1 request al bot API |
| Log en consola Next | Sí (404 silenciado para inbox) | No |
| Editar mensajes | N/A (cerrado — 501) | N/A |
| Experiencia usuario | Normal | Más rápida en lista lateral |

---

## Archivos de referencia cruzada

| Documento | Repo | Contenido |
|-----------|------|-----------|
| `docs/spec-ui-performance-conversaciones-faqs.md` | chat-whatsapp-ai | Spec backend inbox + índices |
| `docs/cambios-ui-performance-conversaciones-faqs.md` | chat-whatsapp-ai-ui | Qué consume la UI |
| `docs/pending/done/backend-editar-mensaje-whatsapp.md` | chat-whatsapp-ai-ui | Contrato PATCH editar (cerrado — 501) |
| `src/lib/conversations/load-conversations.ts` | chat-whatsapp-ai-ui | Fallback Supabase |
| `src/modules/api/router.ts` | chat-whatsapp-ai | Rutas a desplegar |

---

## Contacto / cierre

Cuando `GET /businesses/:id/conversations/inbox` responda **200** en producción, el error de consola desaparecerá y la UI usará automáticamente el inbox optimizado (sin cambios adicionales en frontend).
