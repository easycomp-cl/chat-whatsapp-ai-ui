# Cambios UI — columnas redimensionables en conversaciones

## Resumen

La vista de conversaciones (`/app/conversations`) permite redimensionar las columnas del inbox en desktop y contraer/expandir el panel de información del contacto.

## Comportamiento visible

### Desktop (`md+`, ≥768px)

- **Lista de chats ↔ chat**: al pasar el mouse sobre el borde entre columnas aparece un handle de resize. Arrastrar cambia el ancho de la lista (80–480px).
- **Chat ↔ info contacto** (`xl+`, ≥1280px): segundo handle entre el chat y el panel derecho (200–480px).
- **Lista compacta**: si la lista queda por debajo de ~160px, se activa la vista compacta (avatares + nombre corto), igual que en móvil.
- **Panel contacto compacto**: si el panel derecho queda por debajo de ~240px, reduce padding y tamaño de texto.
- **Contraer panel contacto**: botón en el header del chat (`PanelRightClose`) oculta la columna derecha. Un botón flotante en el borde derecho del chat permite volver a mostrarla (`PanelRightOpen`).

### Móvil y tablet (`< xl`, <1280px)

- Sin columna derecha fija.
- Botón en el header del chat abre un **panel superpuesto** con la info del contacto.
- Se cierra con la X, clic en el fondo oscuro, o al cambiar de conversación.
- Al expandir la ventana a `xl+`, el overlay se cierra automáticamente y vuelve la columna fija.

### Móvil (`< md`)

- Sin resize. Lista fija a 80px con vista compacta.
- Panel de contacto no visible (igual que antes en `< xl`).

### Persistencia

Preferencias guardadas en `localStorage` (`conversations-inbox-layout`):

- `listWidth`
- `contactWidth`
- `contactCollapsed`

## Archivos principales

- `src/features/conversations/components/inbox-column-layout.tsx` — layout con handles y estado
- `src/lib/conversations/inbox-column-layout-storage.ts` — constantes y persistencia
- `src/features/conversations/context/inbox-column-layout-context.tsx` — contexto compartido
- `src/features/conversations/components/column-resize-handle.tsx` — handle visual
- `src/features/conversations/components/conversations-inbox.tsx` — integración
- `src/features/conversations/components/conversation-list-panel.tsx` — vista compacta dinámica
- `src/features/conversations/components/contact-details-panel.tsx` — vista compacta dinámica
- `src/features/conversations/components/chat-window.tsx` — toggle contraer/expandir

## Backend / BD

No requiere cambios en backend ni migraciones.

## Notas de layout

- La columna del chat usa `h-full min-h-0` en toda la cadena flex para que el footer (formulario de envío) no quede fuera del área visible.
- El footer del chat tiene `shrink-0` para no colapsar cuando el espacio es limitado.
- En resize de ventana, lista y panel de contacto se recalcan para no recortar el panel derecho.

## Pasos de prueba

1. Abrir `/app/conversations/[id]` en pantalla ≥1280px.
2. Arrastrar el borde entre lista y chat; verificar que el ancho cambia y que al estrechar mucho la lista se vuelve compacta.
3. Arrastrar el borde entre chat y panel contacto; verificar resize y modo compacto del panel.
4. Clic en ocultar panel contacto en header del chat; verificar que desaparece y aparece botón para reabrir.
5. Recargar página; verificar que anchos y estado contraído se mantienen.
6. Reducir ventana a `< md`; verificar que no hay handles y la lista vuelve a 80px compacta.
7. Ventana entre `md` y `xl`; verificar resize lista/chat sin panel contacto.
