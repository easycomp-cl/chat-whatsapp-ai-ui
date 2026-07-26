# Cambios UI — performance Conversaciones y FAQs

> **Fecha:** 2026-07-13  
> **Repositorio:** `chat-whatsapp-ai-ui`  
> **Backend relacionado:** `GET /businesses/:id/conversations/inbox`, cache en `GET /businesses/:id/faqs`  
> **Spec backend:** `chat-whatsapp-ai/docs/spec-ui-performance-conversaciones-faqs.md`

## Resumen

Reducir tiempo de carga en **Conversaciones** y **Preguntas frecuentes**: usar el inbox del bot API (1 request en lugar de 3 queries Supabase), cachear FAQs en el servidor Next.js, y limitar `PendingMessagesProvider` solo a rutas de conversaciones.

## Archivos a tocar

| Archivo | Cambio |
|---------|--------|
| `src/lib/bot-api/client.ts` | `listConversationsInbox()`; `unstable_cache` / `revalidate` en `listFaqs` |
| `src/lib/conversations/load-conversations.ts` | Opcional: delegar a bot API o eliminar si migra 100% |
| `src/features/conversations/components/conversations-page-content.tsx` | Cargar inbox vía `botApi.listConversationsInbox` |
| `src/features/conversations/hooks/use-live-conversations-list.ts` | No repetir refresh inicial si SSR ya trae datos; subir `POLL_MS` a 15–30s |
| `src/components/layout/app-shell.tsx` | Mover `PendingMessagesProvider` a layout de `/app/conversations` |
| `src/app/app/conversations/layout.tsx` | Envolver con `PendingMessagesProvider` |
| `src/features/faqs/components/faqs-page-content.tsx` | Usar `listFaqs` cacheado (60s) |

## Dependencias de deploy

1. **Backend** desplegado con migración `20260713010000_inbox_performance`.
2. Endpoint `GET /businesses/:id/conversations/inbox` disponible en `BOT_API_BASE_URL`.
3. `BOT_API_SECRET` sin cambios.
4. Vercel redeploy tras merge UI.

## Implementación sugerida

### 1. Bot API — inbox

```typescript
// src/lib/bot-api/client.ts
listConversationsInbox: (
  businessId: string,
  params?: { assigned_admin_id?: string; limit?: number }
) =>
  botFetch<{ conversations: InboxConversation[] }>(
    `/businesses/${businessId}/conversations/inbox`,
    { searchParams: params }
  ),
```

Tipo `InboxConversation` alineado con `ConversationRow` actual (snake_case del backend).

### 2. Conversaciones — SSR

```typescript
// conversations-page-content.tsx
const profile = await requireAppAccess();
const agentFilter = isAgent(profile.role) && profile.agent_id ? profile.agent_id : undefined;
const { conversations } = await botApi.listConversationsInbox(profile.business_id!, {
  assigned_admin_id: agentFilter,
  limit: 100,
});
```

Mapear a `ConversationRow` si hace falta (el shape ya coincide con Supabase).

### 3. FAQs — cache servidor

`botFetch` hoy fuerza `cache: "no-store"`. Para FAQs:

```typescript
import { unstable_cache } from "next/cache";

export const getCachedFaqs = (businessId: string) =>
  unstable_cache(
    () => botApi.listFaqs(businessId),
    [`faqs-${businessId}`],
    { revalidate: 60, tags: [`faqs-${businessId}`] }
  )();
```

En `createFaqAction` / `updateFaqAction` / `deleteFaqAction`: `revalidateTag(\`faqs-${businessId}\`)`.

Alternativa: pasar `next: { revalidate: 60 }` solo en `listFaqs` sin tocar el resto de `botFetch`.

### 4. PendingMessages solo en conversaciones

**Quitar** de `app-shell.tsx`:

```tsx
<PendingMessagesProvider businessId={businessId}>
```

**Agregar** en `src/app/app/conversations/layout.tsx`:

```tsx
import { PendingMessagesProvider } from "@/features/conversations/context/pending-messages-context";

export default async function ConversationsLayout({ children }) {
  const profile = await requireAppAccess();
  return (
    <PendingMessagesProvider businessId={profile.business_id!}>
      <div className="...">{children}</div>
    </PendingMessagesProvider>
  );
}
```

El badge del menú lateral necesita `pendingCount` fuera de conversaciones: opciones:

- **A)** Badge solo visible en ruta conversaciones (más simple).
- **B)** Provider liviano en shell que solo escucha Realtime (sin poll 500 msgs).

Recomendación fase 1: **A**.

### 5. Live list — menos agresivo

En `use-live-conversations-list.ts`:

- `POLL_MS`: `4000` → `15000` o `30000`.
- Al montar: si `initial.length > 0`, **no** llamar `refresh()` hasta el primer intervalo.
- Ideal: tras migrar inbox, el poll puede reemplazarse por Realtime + refresh puntual.

## Cómo probar

1. **FAQs:** abrir `/app/faqs` dos veces — segunda carga notablemente más rápida (cache 60s).
2. **Conversaciones:** Network → una llamada server-side al bot API (no 3× Supabase en documento inicial).
3. **FAQs sin poll:** en `/app/faqs`, Network → no debe haber ráfagas cada 5s a `messages` (tras mover provider).
4. **Inbox:** comparar TTFB antes/después en preview Vercel.
5. Backend: `curl -sI .../faqs` debe mostrar `Cache-Control: private, max-age=60`.

## Checklist

- [ ] `listConversationsInbox` en client
- [ ] `conversations-page-content` usa bot API
- [ ] Cache FAQs + `revalidateTag` en mutaciones
- [ ] `PendingMessagesProvider` solo en `/app/conversations`
- [ ] Poll live list ≥ 15s
- [ ] Probar como ADMIN y AGENT (`assigned_admin_id`)

## No hacer en UI (ya resuelto en backend)

- No optimizar manualmente la query de 300 mensajes en Supabase para preview (usar inbox API).
- No depender solo de `Cache-Control` del backend en FAQs sin `unstable_cache` en Next (el serverless de Vercel igual re-fetch AWS cada navegación sin cache Next).
