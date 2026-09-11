# Backend — implementado o cerrado

> Specs que **ya no requieren trabajo** del equipo backend, o se cerraron con decisión de producto.

---

| Documento | Estado | Notas |
|-----------|--------|-------|
| [backend-editar-mensaje-whatsapp.md](./backend-editar-mensaje-whatsapp.md) | **Cerrado** | `PATCH /messages/:id` existió; Meta Cloud API no edita in-place (duplicaba mensajes). Backend → **501**; UI sin botón editar. Ver `docs/cambios-ui-deshabilitar-editar-whatsapp.md` |

---

## Otras features en prod (sin archivo en `pending/`)

Documentadas en `docs/` con sufijo `-SALIDA` o `cambios-ui-*`:

- Reacciones y replies WhatsApp
- Importar chat / análisis de tono y FAQs
- Edición/revocación de mensajes **del cliente** (webhook ingest)
- CRUD agentes, despachos, FAQs, catálogo, conversaciones, envío mensajes

Al cerrar un ítem de [to-backend/](../to-backend/), moverlo aquí y actualizar [../README.md](../README.md).
