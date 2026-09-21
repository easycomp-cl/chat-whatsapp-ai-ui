# Backend — Eliminar vehículo o producto del garage del contacto

**Repo:** `chat-whatsapp-ai`  
**UI:** panel → **Vehículos y productos** (basura).  
**Fecha:** 2026-09-21 · **Estado:** UI usa DELETE dedicado (contrato backend 2026-09-21).

## Qué hace la UI

| Acción | Request |
|--------|---------|
| Eliminar vehículo | `DELETE /businesses/:id/customers/:customerId/vehicles/:vehicleKey` |
| Eliminar producto | `DELETE /businesses/:id/customers/:customerId/products` |

Body común:

```json
{
  "conversation_id": "<chat abierto>",
  "actor_name": "Israel Gonzalez"
}
```

Producto además:

```json
{
  "bucket": "consulted",
  "identity": "sku-or-name"
}
```

`vehicleKey` va URL-encoded (`encodeURIComponent`). La UI **no** reenvía el garage completo por PATCH (evita pisar `products_*`).

Espera píldora azul `profile_updated` / `HUMAN` / `blue_pill` con:

```text
se eliminó: vehículo: KK RS 47 · DONGFENG JOYEAR 2018
```

```ts
payload: {
  actor_name: "Israel Gonzalez",
  removed: ["vehículo: …"],
  added: [],
  modified: [],
  source: "inbox_garage_remove"
}
```

## Prueba

1. Eliminar un auto → globo azul + **se eliminó:** + nombre del asesor. Recargar: sigue.
2. Eliminar un SKU → **se eliminó: producto: …**.
3. Historial de productos intacto al borrar un auto.
4. WhatsApp no recibe el globo.
