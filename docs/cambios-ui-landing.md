# Cambios UI — Landing pública easycomp-chat-bot-manager

## Resumen

Se implementó la landing pública en `/` con secciones orientadas a conversión, hero con escena 3D (Spline) y fallback CSS, formulario de demostración y SEO básico. En una segunda fase se refinó la dirección artística: nueva paleta, hero con núcleo 3D real y narrativa de 7 elementos, sección oscura de flujo IA→humano, mockup de producto y menor repetición visual entre secciones.

## Comportamiento visible

- `/` muestra la landing **sin requerir sesión**
- `/app/*` y `/admin/*` siguen protegidos por middleware
- Navbar sticky con anclas suaves y menú móvil
- CTA principal: «Solicitar una demostración»
- CTA secundaria: «Ver cómo funciona»
- Formulario demo con validación y estados loading/success/error
- Hero con núcleo 3D (paneles apilados + logo) y 7 elementos flotantes: mensaje entrante,
  intención, conocimiento, respuesta, derivación y miniatura de bandeja
- Sin Spline configurado: fallback visual profesional con logo transparente (no placeholder)
- Tres ambientes visuales alternados: claro, degradado violeta suave y sección oscura
  (`#090B1A`) de alto impacto para narrar el flujo IA → humano
- Mockup fiel de la bandeja real de easycomp-chat-bot-manager (`ProductShowcaseSection`) como sección
  protagonista del producto
- Secciones de bandeja compartida, IA con conocimiento y colaboración bot/humano se
  fusionaron en una sola narrativa (`AIWorkflowSection`) para reducir repetición
- Canales futuros marcados como «Próximamente»

## Archivos principales

| Ruta | Descripción |
|------|-------------|
| `src/app/page.tsx` | Página pública con metadata y JSON-LD |
| `src/components/landing/*` | Componentes de sección |
| `src/components/landing/ProductShowcaseSection.tsx` | Mockup fiel de la bandeja real |
| `src/components/landing/AIWorkflowSection.tsx` | Sección oscura del flujo IA → humano |
| `src/lib/landing/*` | Constants, metadata, Spline, analytics, demo adapter |
| `public/easycomp-chat-bot-manager-mark.png` | Ícono transparente usado en el núcleo 3D del hero |
| `src/app/robots.ts` | Robots.txt |
| `src/app/sitemap.ts` | Sitemap |

## Variables de entorno

```env
NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL=   # opcional
NEXT_PUBLIC_DEMO_REQUEST_API_URL=         # opcional, backend pendiente
```

## Documentación relacionada

- `docs/SPLINE_SETUP.md`
- `docs/SPLINE_SCENE_SPEC.md`
- `docs/LANDING_ASSETS_REQUIRED.md`
- `docs/pending/to-backend/backend-demo-request.md`

## Cómo probar

1. `npm run dev` → abrir `http://localhost:3001/`
2. Verificar landing sin login
3. Navegar anclas del navbar
4. Probar formulario demo
5. Confirmar `/app/dashboard` requiere login
6. Probar responsive y `prefers-reduced-motion`
