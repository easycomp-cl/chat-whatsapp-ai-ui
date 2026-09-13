# Para el equipo backend (`chat-whatsapp-ai`)

> **Última revisión:** 2026-07-28  
> Solo specs **pendientes de implementación o deploy**. Lo ya resuelto está en [../done/](../done/).

---

## Prioridad sugerida

| # | Documento | Qué falta | Esfuerzo |
|---|-----------|-----------|----------|
| 1 | [backend-deploy-pendiente-produccion.md](./backend-deploy-pendiente-produccion.md) | Desplegar `GET .../conversations/inbox` + migración índices en **prod** | Bajo (ops) |
| 2 | [backend-whatsapp-delivery-status-read.md](./backend-whatsapp-delivery-status-read.md) | Enum `DELIVERED`/`READ` + webhooks `statuses` Meta | Medio |
| 3 | [backend-customer-profile-crm.md](./backend-customer-profile-crm.md) | `displayAlias`, RUT, direcciones, factura + `GET/PATCH` customer | Medio |
| 4 | [backend-team-roles-collaborador.md](./backend-team-roles-collaborador.md) | Enum `COLLABORATOR` en `profiles.role` | Bajo |

### WhatsApp — roadmap (no urgente)

**Plan maestro (manual + prioridades):** [../whatsapp-meta-plantillas-plan-maestro.md](../whatsapp-meta-plantillas-plan-maestro.md)

Ver también [../whatsapp-cta-templates-roadmap.md](../whatsapp-cta-templates-roadmap.md).

| Fase | Documento | Qué falta | Esfuerzo |
|------|-----------|-----------|----------|
| P1 | [backend-whatsapp-embedded-signup-template-provisioning.md](./backend-whatsapp-embedded-signup-template-provisioning.md) | **UI lista.** Falta `POST /whatsapp/embedded-signup/complete` + persistir WABA/token | Alto |
| — | [backend-whatsapp-interactive-outbound-human.md](./backend-whatsapp-interactive-outbound-human.md) | `POST .../messages/interactive` asesor humano | Medio |
| P2–P3 | [backend-whatsapp-message-templates.md](./backend-whatsapp-message-templates.md) | Listar + enviar plantillas Meta | Medio–alto |
| P5–P6 | [backend-whatsapp-embedded-signup-template-provisioning.md](./backend-whatsapp-embedded-signup-template-provisioning.md) | Crear pack UTILITY desde app | Alto |
| P7 | [backend-whatsapp-cta-outbound.md](./backend-whatsapp-cta-outbound.md) | CTA URL / llamar en ventana 24 h | Medio |

---

## Decisiones de producto (cerradas — listas para implementar)

### Perfil contacto (CRM)

- Admin edita; colaborador solo lectura.
- Alias, RUT validado (formato visual), boleta/factura + giro.
- 2 despachos + facturación; comuna/región desde **Despachos**.
- Ningún campo obligatorio; bot puede completar perfil.

### Roles

- `COLLABORATOR` reemplaza `AGENT` en login.
- UI ya dice **Mi equipo** / **Colaborador** (`src/lib/roles/labels.ts`).

### WhatsApp entrega

- UI lista para `pending` → `sent` → `delivered` → `read`.
- Backend hoy solo persiste hasta `SENT`.

---

## Verificación rápida prod (2026-07-28)

```bash
BASE="https://api.conversai.easycomp.cl"
# Inbox — hoy 404, debe pasar a 200 tras deploy
curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: $KEY" \
  "$BASE/businesses/$BIZ/conversations/inbox?limit=5"
```

---

## Contratos UI ya preparados (esperan backend)

| Área | Archivo UI |
|------|------------|
| Ticks entrega | `message-delivery-status.tsx`, `delivery-status.ts` |
| Perfil contacto | `contact-details-panel.tsx` (lectura hoy) |
| Mi equipo / roles | `src/lib/roles/labels.ts`, `rbac.ts` |
| Inbox optimizado | `load-conversations.ts` (fallback Supabase si 404) |

---

## No incluido aquí (ya hecho)

Ver [../done/](../done/) — p. ej. editar mensaje WhatsApp (cerrado con API 501 + UI sin edición).
