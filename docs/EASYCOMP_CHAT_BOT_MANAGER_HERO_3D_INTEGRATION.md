# easycomp-chat-bot-manager Hero 3D — Guía de integración

Módulo aislado del hero 3D (React Three Fiber). **No está cableado** a la landing todavía.

Componente que debe importar el agente de integración (Sonnet):

`EasycompChatBotManagerHero3D` desde `@/components/landing/hero-3d`

---

## Import

```tsx
import { EasycompChatBotManagerHero3D } from "@/components/landing/hero-3d";
```

## Uso básico

```tsx
<div className="relative w-full max-w-lg">
  <EasycompChatBotManagerHero3D className="w-full" />
</div>
```

## Uso con progress (futuro scroll)

```tsx
<EasycompChatBotManagerHero3D
  className="w-full"
  quality="auto"
  reducedMotion={false}
  progress={scrollProgress} // 0–1
  onReady={() => trackLandingEvent("hero_3d_ready")}
  onError={(error) => console.warn(error)}
/>
```

## Snippet sugerido para reemplazar Spline en el hero

Cuando el rediseño de la landing esté listo, en el contenedor visual del hero:

```tsx
import { EasycompChatBotManagerHero3D } from "@/components/landing/hero-3d";

// Dentro del HeroSection, solo el bloque visual (no el copy ni CTAs):
<FadeIn delay={0.15} className="w-full">
  <EasycompChatBotManagerHero3D className="mx-auto" quality="auto" />
</FadeIn>
```

No hace falta tocar navbar, CTAs, formulario ni otras secciones.

---

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases del contenedor |
| `reducedMotion` | `boolean` | `prefers-reduced-motion` | Fuerza fallback CSS |
| `quality` | `"low" \| "medium" \| "high" \| "auto"` | `"auto"` | Nivel de detalle / DPR |
| `progress` | `number` (0–1) | `0` | Variaciones sutiles (separación, conexiones, cámara, panel) |
| `onReady` | `() => void` | — | Escena lista |
| `onError` | `(error: Error) => void` | — | Error → fallback |

---

## Dimensiones recomendadas

- Contenedor: `aspect-square`, `max-w-lg` (≈ 512px)
- Desktop: columna derecha del hero (~50%)
- El canvas hace `width/height: 100%` del contenedor (ResizeObserver)

---

## Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| Desktop | Composición horizontal, núcleo ligeramente a la derecha, panel visible, cursor parallax sutil |
| Tablet | Nodos más cerca |
| Móvil | Composición compacta, menos partículas (quality auto→low), sin interacción de cursor |

---

## Fallback

Se muestra `Hero3DFallback` (CSS + logo PNG) cuando:

- WebGL no disponible
- Error de escena
- `reducedMotion` / `prefers-reduced-motion`
- Fallo de carga

El contenedor **nunca** queda vacío.

---

## Dependencias

```
three
@react-three/fiber
@react-three/drei
motion   (ya existía; overlays del fallback)
```

No usa Spline. No eliminar `@splinetool/react-spline` del proyecto.

---

## Logo 3D

- **PNG mark:** `public/easycomp-chat-bot-manager-mark.png` (fallback HTML)
- **SVG oficial:** pendiente (`docs/LANDING_ASSETS_REQUIRED.md`)
- Emblema WebGL actual: geometría **temporal** en `logo-geometry.ts` (C + ondas), documentada como reemplazable

Cuando exista `easycomp-chat-bot-manager-mark.svg`, actualizar solo:

1. `logo-geometry.ts` (paths → Shape → Extrude)
2. `LOGO_ASSET_STATUS` en `hero-3d.config.ts`

---

## Accesibilidad / rendimiento

- Contenedor `aria-hidden`; canvas decorativo
- `pointer-events: none` en el canvas (no intercepta CTAs ni scroll)
- Dynamic import con `ssr: false`
- DPR máx. ~1.5; pausa `frameloop` fuera de viewport
- Sin HDR Environment pesado; sin postprocesado

---

## Playground de desarrollo

```
http://localhost:3001/dev/hero-3d
```

Solo en `NODE_ENV === "development"` (`notFound()` en producción).

Permite quality, reducedMotion, progress, tamaños y fondo claro/oscuro.

---

## Ajustes visuales frecuentes

| Qué | Dónde |
|-----|--------|
| Colores | `hero-3d.config.ts` → `HERO_3D_COLORS` |
| Timeline intro | `INTRO_TIMELINE` |
| Posiciones de nodos | `getNodeLayouts()` |
| Calidad / partículas | `QUALITY_PRESETS` |
| Material del logo | `EasycompChatBotManagerLogo3D.tsx` |

---

## Archivos del módulo

```
src/components/landing/hero-3d/
```
