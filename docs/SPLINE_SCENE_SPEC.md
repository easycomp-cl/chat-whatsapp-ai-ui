# SPLINE_SCENE_SPEC — easycomp-chat-bot-manager Conversation Engine

> Especificación para construir la escena 3D en Spline.  
> El archivo `.spline` **no** está incluido en este repositorio.

## Dimensiones y viewport

| Breakpoint | Comportamiento |
|------------|----------------|
| Desktop | Escena 600×600 px lógicos, cámara frontal ligeramente elevada |
| Tablet | Escena 480×480, menos partículas |
| Móvil | Fallback CSS (no cargar Spline) |

## Jerarquía de objetos (nombres exactos)

```
Scene
├── MainCamera
├── AmbientParticles
├── EasycompChatBotManagerCore          ← núcleo central con logo
├── IncomingMessage        ← tarjeta mensaje entrante
├── IntentNode             ← “Intención detectada: cotización”
├── KnowledgeNodes         ← grupo de nodos (productos, precios, etc.)
├── AIResponse             ← tarjeta respuesta generada
├── HumanHandoff           ← “Asignado a Camila”
├── DashboardPanel         ← miniatura bandeja
├── WhatsAppChannel        ← canal principal destacado
└── FutureChannels         ← grupo secundario (IG, Messenger, etc.)
```

## Materiales

### EasycompChatBotManagerCore

- Color base: `#4438ca` → `#6d5ef5` → `#397bff` gradiente (tres paneles apilados, ver
  `HeroFallback.tsx` para la referencia CSS exacta que debe imitar la escena)
- Detalles emisivos: `#3ee6d0` (cian), rim light en el borde superior-izquierdo del núcleo
- Roughness: 0.35
- Metalness: 0.15
- Transmisión/translucidez: ligera (10–15%)
- Halo: point light violeta `#6d5ef5`, intensity 0.8, distance 4
- Logo: textura frontal centrada usando `/easycomp-chat-bot-manager-mark.png` (fondo transparente, sin
  aplicar inversión de color — el archivo ya tiene el degradado violeta→cian correcto)

### Tarjetas (IncomingMessage, IntentNode, KnowledgeNodes, AIResponse, HumanHandoff)

- Fondo: blanco `#ffffff` con opacity 0.85–0.9, `backdrop-blur`
- Borde sutil: `#6d5ef5` 20% opacity
- Border radius: 16–18px equivalente
- Sombra suave, ligeramente más pronunciada en IncomingMessage y AIResponse (primer y
  penúltimo paso del recorrido)
- Texto: eyebrow en mayúsculas `#6d5ef5` o `#397bff`, cuerpo en `#111326`

### DashboardPanel (miniatura de bandeja)

- Réplica reducida del mockup de `ProductShowcaseSection.tsx`: lista corta de 2 chats con
  un indicador verde `#00a884` para "asignada" y uno violeta `#6d5ef5` para "bot"
- Debe leerse como una ventana flotante pequeña anclada bajo el núcleo, no como una tarjeta
  más del mismo tamaño que las demás

## Luces

1. **Key light** — directional, blanco cálido, desde arriba-derecha
2. **Fill light** — point, `#6d5ef5`, intensity baja
3. **Rim light** — `#3ee6d0`, detrás del núcleo

## Cámara (MainCamera)

- Posición inicial: `[0, 0.5, 5]`
- Look at: `[0, 0, 0]`
- FOV: 45°

## Estados de animación

| Estado | Objetos visibles | Descripción |
|--------|------------------|-------------|
| `hero` | Core + partículas | Núcleo flotando, rotación lenta Y |
| `incoming` | + IncomingMessage | Tarjeta entra desde la izquierda |
| `intent` | + IntentNode | Conexión línea core → intent |
| `knowledge` | + KnowledgeNodes | Nodos se iluminan secuencialmente |
| `response` | + AIResponse | Respuesta aparece abajo-derecha |
| `handoff` | + HumanHandoff | Derivación elegante |
| `dashboard` | + DashboardPanel | Panel bandeja se revela |
| `omnichannel` | + WhatsApp + Future | Canales orbitan discretamente |

## Interacciones

- **Hover core**: escala 1.05, emisión +10%
- **Mouse move**: parallax suave de cámara (±0.3 unidades)
- **Scroll** (controlado desde React): transición entre estados

## Timeline de scroll (referencia)

| Scroll % | Estado |
|----------|--------|
| 0–10% | hero |
| 10–20% | incoming |
| 20–30% | intent |
| 30–45% | knowledge |
| 45–55% | response |
| 55–65% | handoff |
| 65–80% | dashboard |
| 80–90% | omnichannel |
| 90–100% | hero (simplificado) |

## Composición de referencia (fallback CSS actual)

El fallback en `HeroFallback.tsx` es la fuente de verdad visual mientras no exista una
escena `.spline` terminada. Contiene exactamente estos 7 elementos, en este orden de
aparición:

1. Núcleo 3D con el logo (`EasycompChatBotManagerCore`)
2. Mensaje entrante: *"Hola, necesito cotizar 20 unidades"* (`IncomingMessage`)
3. Nodo *"Intención: cotización"* (`IntentNode`)
4. Nodo *"Consultando información del negocio"* (`KnowledgeNodes`)
5. Respuesta: *"Necesito el tamaño y el archivo de tu logo"* (`AIResponse`)
6. Derivación: *"Asignado a Camila"* (`HumanHandoff`)
7. Miniatura de bandeja organizada (`DashboardPanel`)

La escena Spline definitiva debe respetar esta misma composición y orden para que la
transición entre fallback y escena cargada (ver `EasycompChatBotManager3DScene.tsx`) no genere un salto
visual perceptible.

## Texturas requeridas

- **Logo easycomp-chat-bot-manager**: importar PNG `/easycomp-chat-bot-manager-mark.png` (versión transparente) como
  textura en el núcleo
- Para extrusión 3D precisa: proporcionar **SVG** del logo (ver `LANDING_ASSETS_REQUIRED.md`)

## Exportación

1. File → Export → Code → React
2. Verificar nombres de objetos con la lista anterior
3. Optimizar geometrías (menos polígonos en móvil)
4. Copiar URL del `.splinecode`
5. Configurar `NEXT_PUBLIC_SPLINE_EASYCOMP_CHAT_BOT_MANAGER_SCENE_URL`

## Prueba móvil

- Desactivar escena Spline en viewport &lt; 768px (ya implementado vía fallback)
- Validar que el fallback CSS se ve profesional

## Control desde React

Los nombres están centralizados en `src/lib/landing/spline-config.ts`:

```ts
export const SPLINE_OBJECTS = {
  core: "EasycompChatBotManagerCore",
  incomingMessage: "IncomingMessage",
  // ...
} as const;
```

Si un objeto no existe en la escena, se registra `console.warn` solo en desarrollo.
