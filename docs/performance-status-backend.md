# Reporte de performance — UI → Backend (`chat-whatsapp-ai`)

**Fecha:** 11 jul 2026  
**UI:** `chat-whatsapp-ai-ui` (Next.js 16, puerto 3001, dev local)  
**Backend:** `https://api.conversai.easycomp.cl`  
**Negocio de prueba:** `cmrgmk5vf0000gbngos6i7jnt` (EasyComp Piloto)  
**Auth:** header `X-API-Key`

---

## Resumen ejecutivo

Cada navegación del menú tarda **>1 s** porque la UI espera datos del servidor antes de renderizar. El cuello de botella principal **no es React**, sino:

1. **Latencia del bot API en AWS** — la mayoría de endpoints tarda **700 ms – 1.9 s** por request.
2. **Varias llamadas por página** — Dashboard e Importar chat disparan 3+ requests al backend.
3. **Overhead fijo de auth** — middleware + Supabase (~**200–400 ms**) en cada navegación, independiente del backend.

**Meta sugerida para backend:** endpoints de lectura simple **< 300 ms** (p95); agregaciones/métricas **< 500 ms** (p95).

---

## Tiempos medidos por página (UI completa)

Mediciones del servidor Next.js (`application-code` = tiempo esperando datos):

| Página | Tiempo total | Código app | ¿Usa bot API? |
|--------|-------------|------------|---------------|
| **Dashboard** | **2.6 – 3.0 s** | ~2.4 – 2.7 s | Sí — 3 endpoints métricas |
| **Importar chat** | **3.0 s** | ~2.8 s | Sí — 3 endpoints |
| **Uso del plan** | **2.7 – 3.2 s** | ~2.3 – 2.7 s | Sí — `metrics/summary` |
| **Settings** | **5.9 s** (1ra carga) / ~2 s | ~5.5 s / ~2 s | Sí — `GET /businesses/:id` |
| **Knowledge** | **1.4 – 1.6 s** | ~1.3 s | Sí — `knowledge-documents` |
| **FAQs** | **1.3 – 2.4 s** | ~1.0 – 2.2 s | Sí — `faqs` |
| **Despachos** | ~2.1 s | ~1.8 s | Sí — `delivery/regions` + `chile-regions` |
| **Conversaciones** | **~1.1 s** | ~890 ms | **No** — solo Supabase |
| **Agentes** | **~1.2 s** | ~542 ms | **No** — solo Supabase |

Overhead fijo por request (no backend bot):

- **Middleware (`proxy.ts`):** ~170–300 ms (validación sesión Supabase)
- **Next.js framework:** ~2–80 ms

---

## Benchmark directo al bot API (11 jul 2026)

Requests individuales con `X-API-Key`, secuenciales:

| Endpoint | Método | Status | Tiempo |
|----------|--------|--------|--------|
| `/businesses/:id/metrics/summary` | GET | 200 | **1924 ms** |
| `/businesses/:id/tone-analysis/consolidated?ai=true` | GET | 404 | **1925 ms** |
| `/businesses/:id` | GET | 200 | **1449 ms** |
| `/businesses/:id/metrics/usage` | GET | 200 | **1374 ms** |
| `/businesses/:id/chat-imports` | GET | 200 | **1330 ms** |
| `/businesses/:id/faq-suggestions/pending` | GET | 200 | **1330 ms** |
| `/businesses/:id/knowledge-documents` | GET | 200 | **994 ms** |
| `/businesses/:id/delivery/regions` | GET | 200 | **837 ms** |
| `/businesses/:id/metrics/questions` | GET | 200 | **712 ms** |
| `/businesses/:id/faqs` | GET | 200 | **697 ms** |
| `/businesses/:id/catalog/products` | GET | 200 | **695 ms** |
| `/delivery/chile-regions` | GET | 200 | **408 ms** |

**Observaciones críticas:**

- Un 404 (`tone-analysis/consolidated`) tarda **1.9 s** igual que un 200 — posible timeout o query pesada antes de fallar.
- `GET /delivery/chile-regions` devuelve un array estático de 16 strings y tarda **408 ms** — debería ser <50 ms con cache.
- `GET /businesses/:id` tarda **1.4 s** para un solo registro — probable N+1 o conexión fría a BD.

---

## Mapa página → endpoints del backend

### Dashboard (`/app/dashboard`) — **CRÍTICO**

```
GET /businesses/:id/metrics/summary?from=...
GET /businesses/:id/metrics/questions?from=...&limit=10
GET /businesses/:id/metrics/usage?from=...
```

+ 1 query Supabase (`conversations` count).

Las 3 llamadas van en **paralelo**; el tiempo de página ≈ la más lenta (**~1.9 s** solo en backend).

### Importar chat (`/app/importar-chat`) — **CRÍTICO**

```
GET /businesses/:id/chat-imports?page=1&limit=10
GET /businesses/:id/faq-suggestions/pending
GET /businesses/:id/tone-analysis/consolidated?ai=true  → 404 pero lento
```

En paralelo; tiempo ≈ **~1.3–1.9 s** (limitado por el más lento).

### Uso del plan (`/app/usage`) — **ALTO**

```
GET /businesses/:id/metrics/summary?from=...   (~1.9 s)
```

+ Supabase `usage_events` (secuencial después del bot API).

### Configuración (`/app/settings`) — **ALTO**

```
GET /businesses/:id   (~1.4 s)
```

+ Supabase `businesses` (duplicado parcial con el endpoint del bot).

### Despachos (`/app/despachos`) — **MEDIO**

```
GET /businesses/:id/delivery/regions     (~837 ms)
GET /delivery/chile-regions              (~408 ms)
```

En paralelo → ~**837 ms** de backend.

### FAQs, Catálogo, Knowledge — **MEDIO-BAJO**

```
GET /businesses/:id/faqs                  (~697 ms)
GET /businesses/:id/catalog/products      (~695 ms)
GET /businesses/:id/knowledge-documents   (~994 ms)
```

### Conversaciones y Agentes — **NO es backend bot**

Solo Supabase (`conversations`, `customers`, `messages`, `business_agents`). Si mejoran, es tema Supabase/índices, no `chat-whatsapp-ai`.

---

## Desglose de responsabilidades

```
Tiempo total página ≈ middleware (~200ms) + auth Supabase (~100-200ms) + datos página
```

| Componente | Responsable | Tiempo típico |
|------------|-------------|---------------|
| Middleware sesión | Frontend (Supabase) | 170–300 ms |
| Auth/perfil duplicado | Frontend (ya optimizado con cache) | 100–200 ms |
| **Bot API AWS** | **Backend** | **700–1900 ms por endpoint** |
| Queries Supabase | Supabase / vistas | 200–600 ms |
| Render React | Frontend | <50 ms |

**Conclusión:** para bajar de 1 s de forma consistente, el backend debe responder en **<300 ms** en lecturas simples. Hoy un solo endpoint ya supera ese umbral.

---

## Recomendaciones para el equipo backend

### Prioridad 1 — Endpoints más lentos

1. **`GET /businesses/:id/metrics/summary`** (~1.9 s)
   - Revisar agregaciones en BD, índices por `tenantId` + `createdAt`, evitar full table scans.
   - Considerar vista materializada o cache de 1–5 min para métricas del mes.

2. **`GET /businesses/:id`** (~1.4 s)
   - Un solo tenant no debería tardar >100 ms. Revisar joins, settings embebidos, cold start.

3. **`GET /businesses/:id/metrics/usage`** (~1.4 s)
   - Posiblemente devuelve muchos eventos; paginar o agregar en BD.

4. **`GET /businesses/:id/tone-analysis/consolidated`** (404 en **1.9 s**)
   - Fallar rápido si no hay datos; no ejecutar lógica de IA en un GET vacío.

### Prioridad 2 — Listados

5. **`chat-imports`, `faq-suggestions/pending`** (~1.3 s cada uno)
   - Índices en `tenantId`, `status`, `createdAt`. Limitar columnas del SELECT.

6. **`knowledge-documents`, `delivery/regions`** (~800 ms – 1 s)
   - Listados simples; objetivo <200 ms.

### Prioridad 3 — Datos estáticos

7. **`GET /delivery/chile-regions`** (~408 ms para 16 strings)
   - Cache en memoria o CDN; respuesta debería ser instantánea.

### Infraestructura

8. **Cold start / 502 / 504** — hubo incidentes de gateway timeout; revisar health checks, timeouts del ALB, pool de conexiones Prisma/Postgres.
9. **Connection pooling** — PgBouncer o pool de Prisma si cada request abre conexión nueva.
10. **Logging de timing** — middleware que loguee `X-Response-Time` por ruta para medir p50/p95 en producción.

### API design (opcional, reduce round-trips)

11. **Endpoint compuesto para Dashboard:**
    `GET /businesses/:id/metrics/dashboard?from=...` → summary + questions + usage en 1 response.

12. **Endpoint compuesto para Importar chat:**
    `GET /businesses/:id/chat-imports/overview` → history + pending FAQs + tone status.

---

## Lo que ya optimizó el frontend (para contexto)

- `loading.tsx` con skeletons (mejora percepción, no reduce tiempo real).
- `Promise.all` en Dashboard, Despachos e Importar chat (reduce tiempo de ~suma a ~máximo).
- `React.cache()` en perfil y negocio (evita queries duplicadas entre layout y página).

Aun con eso, si el endpoint más lento tarda **1.9 s**, la página no puede bajar de **~2 s** sin mejoras en backend.

---

## Cómo reproducir (para el equipo backend)

```bash
# Reemplazar SECRET y BUSINESS_ID
curl -w "\nTiempo: %{time_total}s\n" \
  -H "X-API-Key: SECRET" \
  "https://api.conversai.easycomp.cl/businesses/BUSINESS_ID/metrics/summary?from=2026-07-01T00:00:00.000Z"
```

Endpoints a benchmarkear en orden de prioridad:

1. `/metrics/summary`
2. `/businesses/:id`
3. `/metrics/usage`
4. `/chat-imports`
5. `/faq-suggestions/pending`
6. `/delivery/chile-regions`
