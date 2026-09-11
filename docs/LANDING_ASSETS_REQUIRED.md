# Assets requeridos — Landing easycomp-chat-bot-manager

## Logo

| Asset | Estado | Uso |
|-------|--------|-----|
| `public/easycomp-chat-bot-manager-logo.png` | ✅ Existe | Navbar, favicon |
| `public/easycomp-chat-bot-manager-mark.png` | ✅ Existe (fondo transparente, solo ícono) | Núcleo 3D del hero fallback (`HeroFallback.tsx`) |
| `public/easycomp-chat-bot-manager-lockup-transparent.png` | ✅ Existe (fondo transparente, ícono + wordmark) | Disponible para futuros usos (ej. OG image) |
| `easycomp-chat-bot-manager-logo.svg` | ❌ Pendiente | Extrusión 3D precisa en Spline, OG image vectorial |

**Acción:** proporcionar SVG del logo con proporciones originales para reemplazar la aproximación 3D en Spline.

## Open Graph

| Asset | Estado | Uso |
|-------|--------|-----|
| `public/og-landing.png` (1200×630) | ❌ Pendiente | Open Graph / Twitter card |

**Acción:** captura o diseño de imagen social con logo, headline y gradiente de marca.

## Escena Spline

| Asset | Estado | Uso |
|-------|--------|-----|
| Archivo `.spline` | ❌ Pendiente | Edición de la escena 3D |
| URL `.splinecode` | ❌ Pendiente | `NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL` |

Ver `docs/SPLINE_SCENE_SPEC.md` para construir la escena.

## Dominio

| Asset | Estado |
|-------|--------|
| Dominio canónico productivo | ❌ Pendiente (`LEGAL_CANONICAL_BASE` en `src/lib/legal/constants.ts`) |

## Placeholders actuales

- Hero 3D: fallback CSS con logo PNG y tarjetas HTML
- OG image: no configurada (metadata sin `images`)
- Formulario demo: modo prueba sin backend (ver `backend-demo-request.md`)
