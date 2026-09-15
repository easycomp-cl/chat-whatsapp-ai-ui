# Cambios UI — Mis plantillas

## Resumen

Ítem de menú **Mis plantillas** (`/app/templates`) para administradores. Lista el pack `standard_v1` con chips de estado en Meta y permite enviarlo otra vez con **Crear pack en Meta**.

Con la ventana de 24 h cerrada, el composer abre **+ → Plantilla WA** y envía solo plantillas `APPROVED` al chat del cliente.

## Comportamiento

- El listado muestra cada plantilla como globo de WhatsApp (fondo de chat, burbuja verde, ticks). Los parámetros van rellenados con datos del negocio, la sesión, un cliente y un producto del catálogo; cada valor se ve como `{valor}` con el número de parámetro en superíndice (`¹`, `²`, `³`). Ya no hay diálogo de Preview.
- Tag de Meta (Utilidad / Autenticación) y tag **interno** de uso: consulta, servicio, producto, pedido, notificación, pago, autenticación.
- **Crear pack en Meta:** botón azul Meta (`#1877F2`) arriba a la derecha. `POST .../whatsapp/templates/provision-defaults`. Sin WhatsApp conectado queda deshabilitado.
- Composer (modo humano): menú **Plantilla WA**. Modal con `parameter_fields`, preview de `body_preview` y envío `POST /conversations/:id/messages/template`.
- No se ofrecen en el chat del cliente `verificar_responsable_es` ni `aviso_handoff_es` (van a otro número; otro endpoint).
- `aviso_handoff_es` muestra el botón **Abrir chat**. El backend debe enviar el UUID de la conversación como sufijo del URL (`/app/conversations/{id}`), no el link completo en el cuerpo.
- Burbuja: `content_type === "TEMPLATE"` muestra `content_text` con etiqueta Plantilla.

## Pack `standard_v1`

`verificar_responsable_es`, `aviso_handoff_es`, `seguimiento_asesor_es`, `pedido_actualizacion_es`, `recordatorio_cita_es`, `reabrir_conversacion_es`, `link_pago_es`, `muestra_producto_es`.

## Backend

Spec: `docs/pending/whatsapp-templates-ui.md`. El backend debe estar desplegado (migración + worker + webhook `message_template_status_update`).
