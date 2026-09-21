# Backend — PDF de cotización de productos

> **Repo:** `chat-whatsapp-ai`  
> **UI:** `chat-whatsapp-ai-ui` (modal + composer ya listos)  
> Relacionado: catálogo `GET /businesses/:id/catalog/products`, media `POST /conversations/:id/messages/media`

## Resumen

La UI arma una cotización desde el catálogo y necesita dos endpoints. **No envían a WhatsApp.** El asesor adjunta el PDF al composer y lo manda con el flujo de media existente. El bot puede reutilizar el mismo PDF por `POST .../quotes/send` (no lo llama el modal humano).

**Bloqueo actual:** sin estos endpoints, el dashboard muestra preview local y deshabilita **Adjuntar**.

## Auth

Igual que el resto (`X-API-Key` vía BFF / `BOT_API_SECRET`).

## Preview

```
POST /conversations/:conversationId/quotes/preview
Content-Type: application/json
```

```json
{
  "lines": [
    { "product_id": "clxyz...", "quantity": 2 }
  ],
  "customer_note": "Toyota Hilux 2018",
  "delivery_method": "delivery",
  "commune": "Maipú"
}
```

`delivery_method`: `none` | `pickup` | `delivery`.

**200:**

```json
{
  "quote_number": "BORRADOR",
  "business_name": "EasyComp Repuestos",
  "customer_name": "Camila R.",
  "currency": "CLP",
  "customer_note": "Toyota Hilux 2018",
  "delivery": {
    "method": "delivery",
    "label": "Despacho a Maipú",
    "price": 5500
  },
  "lines": [
    {
      "product_id": "clxyz",
      "sku": "ECP-ACE-006",
      "name": "LIQUI MOLY Molygen New Generation 10W-40 4 L",
      "quantity": 1,
      "unit_price": 41990,
      "line_total": 41990
    }
  ],
  "products_subtotal": 41990,
  "delivery_price": 5500,
  "net_amount": 39908,
  "iva_amount": 7582,
  "total": 47490,
  "notes": []
}
```

Si el flete aún no se calcula, devolver `delivery.price: null` / `delivery_price: null`. La UI muestra “Flete a confirmar” y no lo suma al total.

Los precios de catálogo van **con IVA incluido**. El pie de la hoja (preview y PDF) debe ser:

1. **Valor neto** (`net_amount`) = `round(total / 1.19)`
2. **IVA** (`iva_amount`) = `total - net_amount` (19 %)
3. **Total** (`total`) = productos + flete conocido (bruto)

Si `net_amount` / `iva_amount` no vienen, la UI los deriva del `total`. El PDF debe imprimir las mismas tres líneas, sin pies legales.

Errores: `400` línea con producto inactivo o sin precio; `404` conversación.

## PDF (blob, no envía)

```
POST /conversations/:conversationId/quotes/pdf
Content-Type: application/json
```

Mismo body que preview. Respuesta:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="cotizacion-COT-2026-0042.pdf"`
- Header opcional `X-Quote-Number: COT-2026-0042`

La UI crea un `File` y lo pone en el composer. Filename esperado: `cotizacion-{quote_number}.pdf`.

**Pies legales:** no incluir en el PDF (ni en `notes` del preview) textos del tipo “IVA incluido · despacho no incluido”, “Precios de demostración…”, “No confirma stock…” ni avisos de dashboard. El pie es Valor neto, IVA y Total.

Bucket: el mismo `chat-media` al enviar (el PDF generado puede ser efímero; el persistente ocurre en `messages/media`).

## Envío automático (solo bot)

```
POST /conversations/:conversationId/quotes/send
```

El modal humano **no** llama este endpoint. Si un asesor quiere mandar al toque: Adjuntar → caption → `POST .../messages/media`.

## Catálogo (ya existe)

`GET /businesses/:businessId/catalog/products`

Hoy la UI acepta objetos Prisma camelCase y también snake_case (`is_active`, `tenant_id`, etc.). `price` puede venir número o string.

Campos usados: `id`, `sku`, `name`, `description`, `price`, `currency`, `category`, `tags`, `isActive`.

## WhatsApp

Hace falta ventana 24 h abierta para el documento. Si está cerrada, el envío de media falla igual que hoy; no usar cotización para reabrir (usar plantilla).

## Prueba de integración

1. Catálogo demo con SKUs `ECP-ACE-006` (41990) y `ECP-AMP-001` (4490).
2. Preview de 1× aceite + 2× H4 → subtotal 50970.
3. PDF con `quote_number` real, no `BORRADOR`.
4. UI adjunta el blob y envía media con caption.
5. Cliente recibe documento; dashboard globo `DOCUMENT`.
