# Cambios UI — Cotización de productos (Herramientas EasyComp)

**Fecha:** 2026-09-17  
**Backend requerido:** [pending/to-backend/backend-cotizacion-productos-pdf.md](./pending/to-backend/backend-cotizacion-productos-pdf.md)  
**Catálogo:** `GET /businesses/:businessId/catalog/products` (ya existe)  
**Envío:** `POST /conversations/:id/messages/media` (ya existe)

## Resumen

En el menú **+** del composer hay una sección **Herramientas EasyComp** con **Crear cotización**. El asesor elige productos del catálogo, cantidades y entrega, ve un preview tipo hoja A4 y pulsa **Adjuntar**. Eso pide el PDF al backend y lo deja en el composer **sin enviarlo**. El caption y el envío siguen el flujo de media actual.

Hasta que existan `POST .../quotes/preview` y `POST .../quotes/pdf`:

- El preview se calcula en el cliente (`qty × price`, título **Cotización**, “Flete a confirmar” si hay despacho).
- **Adjuntar** queda deshabilitado con el texto: *“La generación de PDF se activa cuando el backend publique cotizaciones”*.
- La UI **no** genera PDF en el navegador.

## Cambios visibles

### Menú +

1. Adjuntar archivo (imágenes / PDF / Excel / Word).
2. Plantilla WhatsApp.
3. Mensaje interactivo (ya existía).
4. Separador → **Herramientas EasyComp** → **Crear cotización**.

No abre el file picker. Si no hay `businessId` o falló el catálogo (`GET` 404/500), el ítem queda atenuado y un toast dice “No se pudo cargar el catálogo”.

### Modal

- Título **Cotización de productos**; subtítulo contacto + negocio.
- Entrega (`Sin definir` / `Retiro en local` / `Despacho`) y comuna si hay despacho. La nota del vehículo está oculta por ahora.
- Buscador por nombre, SKU, categoría o tag; agrupado por categoría.
- Productos sin precio: badge **Sin precio**, no seleccionables. Máximo 30 líneas.
- El preview tipo hoja se actualiza al marcar productos, cantidades y entrega. El pie es **Valor neto**, **IVA** y **Total** (precios de catálogo con IVA incluido, desglosados al 19 %). No hay pies legales.
- **Adjuntar** no envía a WhatsApp. Si el composer ya tenía un archivo, pregunta si se reemplaza.

### Chat

Tras enviar, el globo es `DOCUMENT` como cualquier PDF (`cotizacion-COT-….pdf` + caption). Si el bot envía la misma cotización no hay UI extra.

## Archivos principales

| Área | Ruta |
|------|------|
| Menú + | `src/features/conversations/components/compose-attach-menu.tsx` |
| Composer | `src/features/conversations/components/reply-form.tsx` |
| Modal | `src/features/quotes/product-quote-modal.tsx` |
| Preview A4 | `src/features/quotes/product-quote-preview.tsx` |
| Actions | `src/lib/actions/quote-actions.ts` |
| Bot API | `src/lib/bot-api/client.ts` (`previewConversationQuote`, `generateConversationQuotePdf`) |
| Tipos | `types/quote.ts` |

## Cómo probar

1. Negocio con catálogo (EasyComp Repuestos, SKUs demo).
2. Conversación en modo humano, ventana 24 h abierta.
3. **+** → Herramientas EasyComp → Crear cotización.
4. Buscar `10W-40` cantidad 1; `H4` cantidad 2. El preview a la derecha muestra los totales.
5. Totales locales de `1×41990 + 2×4490 = 50970` bruto: valor neto / IVA / Total.
6. Si el PDF aún no está en staging: Adjuntar deshabilitado con el mensaje de backend pendiente.
7. Cuando el backend publique el PDF: **Adjuntar** → composer muestra el archivo → caption “Te dejo la cotización” → enviar.
8. En WhatsApp del cliente llega el PDF; en el dashboard el globo es documento.

## Fuera de alcance UI

Editor visual del PDF, stock, fitment VIN, cobro Webpay, recálculo de IVA, alta de productos desde el modal.
