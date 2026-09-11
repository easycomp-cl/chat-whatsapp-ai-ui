# Datos del contacto (cliente WhatsApp)

> **Fecha:** 2026-07-28  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Tabla backend:** `Customer` (vista Supabase `public.customers`)

## Qué guardamos hoy

La UI lee la vista `customers`, que mapea la tabla Prisma `Customer`:

| Campo UI | Columna Prisma | Origen / uso |
|----------|----------------|--------------|
| `id` | `id` | Identificador interno (cuid) |
| `business_id` | `tenantId` | Negocio al que pertenece |
| `phone_number` | `phoneNumber` | WhatsApp del contacto (normalizado, único por negocio) |
| `name` | `name` | Nombre de perfil WhatsApp (`contacts[].profile.name` del webhook), actualizado al escribir |
| `first_seen_at` | `firstSeenAt` | Primera vez que contactó (creación del registro) |
| `last_seen_at` | `lastSeenAt` | Última interacción registrada por backend |

**No guardamos** (hoy): email, foto de perfil, dirección, etiquetas CRM propias, notas en `Customer` (las notas van en `conversation_notes` por conversación).

## Cómo se crea / actualiza (backend)

Al llegar un mensaje entrante, el backend hace `upsert` del cliente por `(tenantId, phoneNumber)`:

- **create:** `name` desde webhook, `firstSeenAt` / `lastSeenAt` = timestamp del mensaje  
- **update:** `name` si Meta envía nombre nuevo, `lastSeenAt` = timestamp del mensaje  

La UI **no escribe** en `Customer`; solo muestra lo persistido.

## Dónde se muestra en la UI

| Lugar | Datos usados |
|-------|----------------|
| Lista de conversaciones | `name` o `phone_number`, avatar con iniciales + color por `customer_id` |
| Cabecera del chat | Igual |
| Burbujas entrantes | Nombre + `ConversationAvatar` (iniciales, color por `customer_id`) |
| Panel lateral contacto | Teléfono, nombre WhatsApp, primer contacto, última actividad, conversación |

## Avatar (color e iniciales)

- **Iniciales:** hasta 2 letras del `name`; si no hay nombre, últimos 2 dígitos del teléfono.  
- **Color:** hash estable de `customer_id` → paleta fija (`getAvatarColor` en `src/lib/conversations/utils.ts`).

## Multitenancy: mismo teléfono, distintos negocios

**Sí está controlado.** `business_id` en `customers` significa *a qué empresa pertenece este registro de contacto*, no “el rubro del cliente”.

Ejemplo: `56940414977` escribe a **TWD** (tablas) y después a **Pastelería Don Pepe** (tortas):

| Capa | Comportamiento |
|------|----------------|
| **BD** | Clave única `(tenantId, phoneNumber)` → **dos filas** `Customer` distintas (mismo teléfono, distinto `business_id` e `id`) |
| **Conversaciones** | Cada una ligada a su `customer_id` + `tenantId`; historiales separados |
| **Webhook** | Meta envía `phone_number_id` del **número de WhatsApp del negocio** que recibió el mensaje → backend resuelve el tenant por `TenantChannel` |
| **UI** | Usuario logueado solo ve su `profile.business_id`; RLS `can_access_tenant(tenantId)` en `Customer`, `Conversation`, `Message` |

Don Pepe **no ve** chats de tablas de TWD ni al revés, aunque el celular del cliente sea el mismo.

**Requisito operativo:** cada negocio debe tener su propio canal WhatsApp (`TenantChannel` con `phone_number_id` único). Si dos tenants compartieran mal el mismo `phone_number_id`, el routing sería ambiguo (error de configuración, no del modelo de datos).

**Nota:** El nombre “Nombre en WhatsApp” puede repetirse entre tenants; lo que aísla es `business_id` + `phone_number`, no el nombre mostrado.


Documentar en `docs/pending/` si se piden:

- Foto de perfil WhatsApp (Meta no siempre la expone en Cloud API).  
- Campos CRM editables (`metadata`, etiquetas).  
- Sincronizar nombre solo si cambió en webhook (ya ocurre en ingest).
