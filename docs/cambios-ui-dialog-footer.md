# Cambios UI — espaciado en footers de diálogos

## Resumen

Se corrigió el espaciado entre botones de acción (p. ej. **Cancelar** / **Borrar**) en los modales de confirmación.

## Comportamiento visible

- Los botones del footer ya no aparecen pegados; hay separación consistente en móvil (vertical) y escritorio (horizontal).
- Afecta a todos los diálogos que usan `DialogFooter`:
  - Borrar nota / borrar todas las notas (perfil de contacto)
  - Limpiar chat (ventana de conversación)
  - Resetear análisis de chats importados

## Cambio técnico

- `DialogFooter` (`src/components/ui/dialog.tsx`): patrón alineado con shadcn v4 (`gap-2` + margen entre botones adyacentes como respaldo).
- `SheetFooter`: mismo criterio de espaciado para futuros sheets con acciones.

## Prueba manual

1. Abrir una conversación con notas internas → borrar una nota → verificar separación entre **Cancelar** y **Borrar**.
2. Menú del chat → **Limpiar chat** → verificar botones del modal.
3. Importar chat → **Empezar de cero** (si hay datos) → verificar footer del modal.
