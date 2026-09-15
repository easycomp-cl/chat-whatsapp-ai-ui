# Cambios UI — orden de notas y menú Flujos

## Resumen

- Las notas internas del contacto se muestran de la más antigua a la más nueva.
- Nuevo ítem **Flujos** en el menú lateral (solo `BUSINESS_ADMIN`).

## Comportamiento visible

### Notas del contacto
- En el panel derecho de una conversación, las notas aparecen en orden cronológico ascendente (la primera creada arriba, la última abajo).

### Menú Flujos
- Ruta: `/app/flows`
- Ubicación en sidebar: debajo de **Conversaciones**
- Página placeholder con mensaje “Próximamente…”

## Archivos tocados

- `src/app/app/conversations/[id]/page.tsx` — query `order("created_at", { ascending: true })`
- `src/features/conversations/components/contact-notes-section.tsx` — orden defensivo en cliente
- `src/components/layout/app-shell.tsx` — ítem de navegación
- `src/app/app/flows/page.tsx` — página inicial

## Prueba manual

1. Abrir una conversación con varias notas → verificar orden cronológico (antigua → nueva).
2. Como admin del negocio → ver **Flujos** en el menú izquierdo y abrir la ruta.
