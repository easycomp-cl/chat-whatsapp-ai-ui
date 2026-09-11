# Configuración de Spline — easycomp-chat-bot-manager Landing

## Variable de entorno

Agrega en `.env.local` (y en Vercel):

```env
NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL=https://prod.spline.design/TU_ESCENA/scene.splinecode
```

Si la variable **no está definida**, la landing muestra el fallback visual CSS (`HeroFallback`) sin errores.

## Integración en el código

- Componente: `src/components/landing/EasycompChatBotManager3DScene.tsx`
- Configuración de objetos: `src/lib/landing/spline-config.ts`
- Carga con `dynamic import` (sin SSR)
- Lazy load cuando el hero entra al viewport
- `prefers-reduced-motion`: siempre fallback estático

## Pasos para conectar tu escena

1. Construye la escena según `docs/SPLINE_SCENE_SPEC.md`
2. Exporta desde Spline → **Export → Code → React**
3. Copia la URL pública del `.splinecode`
4. Configura `NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL`
5. Verifica en desarrollo que los objetos aparecen (warnings en consola si falta alguno)

## Rendimiento antes de publicar

- [ ] Escena &lt; 5 MB comprimida
- [ ] Máximo 2 luces en tiempo real
- [ ] Materiales transparentes al mínimo
- [ ] Sin texturas 4K
- [ ] Probar en móvil (CPU/memoria)
- [ ] Usar herramienta de estimación de carga de Spline

## Fallback

El fallback (`HeroFallback.tsx`) incluye:

- Logo PNG de easycomp-chat-bot-manager en núcleo 3D CSS
- Tarjetas del flujo conversacional
- Gradientes violeta/cian
- Animación suave (desactivada con reduced motion)

No se requiere Spline para que la landing sea usable.
