# Para el equipo backend (`chat-whatsapp-ai`)

> **Última revisión:** 2026-09-21  
> Solo specs **pendientes de implementación o deploy**. Lo ya resuelto está en [../done/](../done/).

---

## Prioridad sugerida

| # | Documento | Qué falta | Esfuerzo |
|---|-----------|-----------|----------|
| 1 | [backend-globo-cambio-datos-cliente.md](./backend-globo-cambio-datos-cliente.md) | Al cambiar datos del contacto, persistir píldora azul con quién y el valor nuevo | Bajo |
| 1b | [backend-globo-patente.md](./backend-globo-patente.md) | Persistir el globo negro de la patente y aceptar formato de moto | Bajo |
| 1c | [backend-human-mode-timeout.md](./backend-human-mode-timeout.md) | `human_mode_until` + evento `bot_mode_resumed` (30 min → BOT, solo la conversación) | Bajo |
| 2 | [backend-deploy-pendiente-produccion.md](./backend-deploy-pendiente-produccion.md) | Desplegar `GET .../conversations/inbox` + migración índices en **prod** | Bajo (ops) |
| 3 | [backend-whatsapp-delivery-status-read.md](./backend-whatsapp-delivery-status-read.md) | Enum `DELIVERED`/`READ` + webhooks `statuses` Meta | Medio |
| 4 | [backend-customer-profile-crm.md](./backend-customer-profile-crm.md) | `displayAlias`, RUT, direcciones, factura + `GET/PATCH` customer | Medio |
| 5 | [backend-team-roles-collaborador.md](./backend-team-roles-collaborador.md) | Enum `COLLABORATOR` en `profiles.role` | Bajo |
| 6 | [backend-cotizacion-productos-pdf.md](./backend-cotizacion-productos-pdf.md) | `POST .../quotes/preview` + `POST .../quotes/pdf` | Medio |
| 7 | [backend-onboarding-draft-persistence.md](./backend-onboarding-draft-persistence.md) | Borrador parcial + `current_step` + `draft_updated_at` | Medio |
| 8 | [backend-flow-subscriptions.md](./backend-flow-subscriptions.md) | Self-serve: Business+Profile al signup + checkout Flow **después** de WhatsApp | Alto |

### WhatsApp — roadmap (no urgente)

**Plan maestro (manual + prioridades):** [../whatsapp-meta-plantillas-plan-maestro.md](../whatsapp-meta-plantillas-plan-maestro.md)

Ver también [../whatsapp-cta-templates-roadmap.md](../whatsapp-cta-templates-roadmap.md).

| Fase | Documento | Qué falta | Esfuerzo |
|------|-----------|-----------|----------|
| P1 | [backend-whatsapp-embedded-signup-template-provisioning.md](./backend-whatsapp-embedded-signup-template-provisioning.md) | **UI lista.** Falta `POST /whatsapp/embedded-signup/complete` + persistir WABA/token | Alto |
| — | [backend-whatsapp-interactive-outbound-human.md](./backend-whatsapp-interactive-outbound-human.md) | `POST .../messages/interactive` asesor humano | Medio |
| P2–P3 | [backend-whatsapp-message-templates.md](./backend-whatsapp-message-templates.md) | **UI lista.** Listar + enviar según [../whatsapp-templates-ui.md](../whatsapp-templates-ui.md) | Hecho (falta deploy si 404) |
| P5–P6 | [backend-whatsapp-embedded-signup-template-provisioning.md](./backend-whatsapp-embedded-signup-template-provisioning.md) | Crear pack al conectar WABA | Alto |
| — | [backend-whatsapp-standard-template-pack.md](./backend-whatsapp-standard-template-pack.md) | Copy del pack (8 plantillas `standard_v1`) | — |
| — | [backend-admin-phone-verification.md](./backend-admin-phone-verification.md) | Confirmación UTILITY + aviso handoff | Medio |
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

### Billing Flow (SaaS)

- 3 planes: Starter $99.990 + IVA (oferta $79.990 + IVA × 3 meses), Pro $149.990 + IVA, Business $249.990 + IVA.
- Día de cobro 5 / 15 / 30, inmutable. Primer ciclo prorrateado.
- Mora: aviso 5 días, premium cortado día 6, paywall día 11. Gracia 10 días.
- Cancelación: usa hasta día de cobro − 1.
- Upgrade: dos facturas (días usados plan actual + días restantes plan nuevo).
- Spec: [backend-flow-subscriptions.md](./backend-flow-subscriptions.md).

---

## Verificación rápida prod (2026-07-28)

```bash
BASE="https://api-chatbotmanager.easycomp.cl"
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
