# Assets requeridos — Landing easyCOMP Chat Bot Manager

## Logo

| Asset | Estado | Uso |
|-------|--------|-----|
| `public/easycomp-chat-bot-manager-mark.png` | ✅ Isotipo EasyComp (robot + C, fondo transparente) | Navbar, sidebar, favicon, núcleo 3D del hero |
| `public/easycomp-chat-bot-manager-lockup-transparent.png` | ✅ Lockup EasyComp (isotipo + easyCOMP + chat bot manager) | Login, recuperar contraseña, footer, páginas legales |
| `public/favicon.png` | ✅ Mark 192×192 | Favicon del navegador |
| `easycomp-chat-bot-manager-mark.svg` | ❌ Pendiente | Extrusión 3D vectorial en Spline |

**Uso correcto:** el isotipo (`mark`) en espacios compactos; el lockup apilado en pantallas de acceso y pie de página. No mezclar con assets antiguos.

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
