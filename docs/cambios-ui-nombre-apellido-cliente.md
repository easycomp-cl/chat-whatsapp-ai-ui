# Nombre y apellido en Datos del cliente

> **Fecha:** 2026-09-21  
> **Repositorio:** `chat-whatsapp-ai-ui`

## Qué cambió

En el panel **Datos del cliente** (lateral del chat) ahora hay **Nombre** y **Apellido** además del **Alias**.

| Campo | Uso |
|-------|-----|
| Nombre / Apellido | Datos reales del contacto (CRM / facturación). Opcionales. |
| Alias | Cómo se llama el contacto en inbox y chat. |
| Nombre WhatsApp | Solo lectura, debajo del alias. Lo sigue actualizando el webhook. |

El inbox **no** cambia: sigue mostrando alias → nombre WhatsApp → teléfono (`resolveCustomerDisplayName`).

Orden del formulario: Nombre → Apellido → Alias → Email → RUT → Documento → Despacho.

## Persistencia

La UI envía `first_name` y `last_name` en `PATCH /businesses/:id/customers/:customerId`, y también los fusiona en `profile_metadata` para no perderlos si el backend aún no tiene columnas Prisma.

GET hidrata desde columnas first-class o, si faltan, desde `profile_metadata.first_name` / `last_name`.

Ningún campo es obligatorio.

Contrato backend: [pending/to-backend/backend-customer-profile-crm.md](pending/to-backend/backend-customer-profile-crm.md) §3.1.1.
