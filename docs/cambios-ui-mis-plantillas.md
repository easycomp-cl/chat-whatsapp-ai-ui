# Cambios UI — Mis plantillas

## Resumen

Ítem de menú **Mis plantillas** (`/app/templates`) para administradores. Lista el pack `standard_v1` con chips de estado en Meta y permite enviarlo otra vez con **Crear pack en Meta**.

Con la ventana de 24 h cerrada, el composer abre **+ → Plantilla WA** y envía solo plantillas `APPROVED` al chat del cliente.

## Comportamiento

- El listado muestra cada plantilla como globo de WhatsApp (fondo de chat, burbuja verde, ticks). El nombre interno (`aviso_handoff_es`) no se muestra; solo el título en español.
- Tag de Meta (Utilidad / Autenticación) y tag interno (consulta, servicio, etc.) van al pie de la tarjeta. El chip de estado (Pendiente / Aprobada / Sin crear) sigue arriba a la derecha.
- **Crear pack en Meta:** botón azul Meta (`#1877F2`) arriba a la derecha. `POST .../whatsapp/templates/provision-defaults`. Sin WhatsApp conectado queda deshabilitado.
- Composer (modo humano): menú **Plantilla WA**. Abre un **catálogo** de plantillas `APPROVED`. Al hacer clic, se precarga en la caja de texto: variables compactas arriba, globo live abajo y **X** para cancelar. Cliente y negocio se rellenan con datos del chat; pedido/producto/cita quedan vacíos con aviso si no hay dato. El envío sigue siendo `POST /conversations/:id/messages/template`.
- `verificar_responsable_es` es **UTILITY** con botón **Confirmar** (ya no OTP). Si está `NOT_CREATED`, el globo usa el copy del pack y no un `body_preview` viejo.
- `aviso_handoff_es` muestra el botón **Abrir chat**. El backend debe enviar el UUID de la conversación como sufijo del URL (`/app/conversations/{id}`), no el link completo en el cuerpo.
- Si Meta rechaza o Graph falla al crear, se muestra el error abajo de la tarjeta. `rejection_reason: NONE` (plantillas pendientes) no se muestra.

## Pack `standard_v1`

`verificar_responsable_es`, `aviso_handoff_es`, `seguimiento_asesor_es`, `pedido_actualizacion_es`, `recordatorio_cita_es`, `reabrir_conversacion_es`, `link_pago_es`, `muestra_producto_es`.

## Backend

Spec: `docs/pending/whatsapp-templates-ui.md`. El backend debe estar desplegado (migración + worker + webhook `message_template_status_update`).
