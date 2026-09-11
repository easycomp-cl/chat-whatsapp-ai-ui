# Pendientes backend — índice

> **Repo UI:** `chat-whatsapp-ai-ui` · **Backend:** `chat-whatsapp-ai`  
> La UI no implementa estos cambios; solo documenta contratos para el equipo backend.

---

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| **[to-backend/](./to-backend/)** | Specs **sin implementar** o **sin desplegar** — trabajo pendiente para backend |
| **[done/](./done/)** | Backend **ya resuelto** (implementado o cerrado con decisión explícita) |

---

## Pendiente para backend → [to-backend/](./to-backend/)

| Prioridad | Documento | Estado backend | Bloquea en UI |
|-----------|-----------|----------------|---------------|
| 1 | [backend-deploy-pendiente-produccion.md](./to-backend/backend-deploy-pendiente-produccion.md) | Código inbox en repo; **404 en prod** | Lista conversaciones optimizada |
| 2 | [backend-whatsapp-delivery-status-read.md](./to-backend/backend-whatsapp-delivery-status-read.md) | No implementado | Ticks entregado / visto reales |
| 3 | [backend-customer-profile-crm.md](./to-backend/backend-customer-profile-crm.md) | No implementado | Perfil contacto (alias, RUT, direcciones) |
| 4 | [backend-team-roles-collaborador.md](./to-backend/backend-team-roles-collaborador.md) | No implementado | Rol `COLLABORATOR` en BD |

**Roadmap WhatsApp (fases futuras):** [whatsapp-cta-templates-roadmap.md](./whatsapp-cta-templates-roadmap.md)

| Fase | Documento | Estado |
|------|-----------|--------|
| — | [backend-whatsapp-interactive-outbound-human.md](./to-backend/backend-whatsapp-interactive-outbound-human.md) | Pendiente — envío botones/lista desde dashboard |
| 1 | [backend-whatsapp-message-templates.md](./to-backend/backend-whatsapp-message-templates.md) | Pendiente — plantillas fuera 24 h |
| 2 | [backend-whatsapp-cta-outbound.md](./to-backend/backend-whatsapp-cta-outbound.md) | Pendiente — botón URL / llamar |

Resumen priorizado: [to-backend/README.md](./to-backend/README.md)

---

## Ya hecho en backend → [done/](./done/)

| Documento | Estado |
|-----------|--------|
| [backend-editar-mensaje-whatsapp.md](./done/backend-editar-mensaje-whatsapp.md) | Endpoint existió; **cerrado** — Meta no soporta edición real → API **501**, UI sin lápiz |

Otras features ya en producción (documentadas fuera de `pending/`):

| Tema | Documento |
|------|-------------|
| Reacciones y replies | `docs/spec-bot-reacciones-replies-SALIDA.md` |
| Importar chat / análisis | `docs/spec-ui-chat-analysis-SALIDA.md` |
| Mensajes editados/borrados por cliente | `docs/cambios-ui-mensajes-cliente-editados-revocados.md` |
| Agentes / despachos / FAQs / catálogo | En uso vía bot API (sin spec pendiente) |

---

## Regla para nuevos pendientes

Crear specs en **`docs/pending/to-backend/backend-<tema>.md`**. Al cerrar, mover a **`docs/pending/done/`** y actualizar este README.

Ver también `.cursor/rules/frontend-only-no-backend.mdc`.
