# SPEC TÉCNICO — Proyecto 2: EasyComp Dashboard Web

## 1. Objetivo

Construir un portal web SaaS para que los clientes de EasyComp puedan administrar, visualizar y controlar el comportamiento del Bot IA conectado a WhatsApp.

Este proyecto se conecta al backend del bot mediante APIs y/o directamente a Supabase según el nivel de permisos definido.

---

# 2. Stack técnico

## Frontend

```txt
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui
```

## Backend web

```txt
Next.js API Routes / Server Actions
```

## Base de datos

```txt
Supabase PostgreSQL
```

## Autenticación

```txt
Supabase Auth
```

## Hosting

```txt
Vercel
```

## Gráficos

```txt
Recharts
```

## Formularios

```txt
React Hook Form
Zod
```

---

# 3. Alcance del dashboard

## Incluye

* Login de usuarios.
* Multi-tenant por negocio.
* Vista resumen de estadísticas.
* Control global del bot.
* Gestión de conversaciones.
* Cambio BOT/HUMAN por conversación.
* Gestión de FAQs.
* Gestión de base de conocimiento.
* Gestión de agentes/vendedores.
* Visualización de uso mensual.
* Preparado para inbox futuro.

## No incluye en primera versión

* Responder mensajes desde el dashboard.
* Inbox omnicanal completo.
* Instagram DM.
* Messenger.
* Telegram.
* Facturación automática.
* Pasarela de pago.
* CRM avanzado.

---

# 4. Roles de usuario

## SUPER_ADMIN

Usuario EasyComp.

Puede:

```txt
- Ver todos los negocios.
- Crear negocios.
- Configurar cuentas WhatsApp.
- Ver métricas globales.
- Administrar planes.
```

## BUSINESS_ADMIN

Dueño o administrador del negocio.

Puede:

```txt
- Ver su negocio.
- Activar/desactivar bot.
- Administrar FAQs.
- Administrar base de conocimiento.
- Ver conversaciones.
- Cambiar conversación BOT/HUMAN.
- Agregar agentes.
- Ver estadísticas.
```

## AGENT

Vendedor o persona del negocio.

Puede:

```txt
- Ver conversaciones asignadas.
- Cambiar conversación a HUMAN.
- Ver historial.
- Agregar notas internas.
```

---

# 5. Rutas principales

## Públicas

```txt
/login
/register, opcional futuro
/forgot-password
```

## Privadas

```txt
/app
/app/dashboard
/app/conversations
/app/conversations/[id]
/app/faqs
/app/knowledge
/app/agents
/app/settings
/app/usage
/app/billing, futuro
```

## Admin EasyComp

```txt
/admin
/admin/businesses
/admin/businesses/[id]
/admin/whatsapp-accounts
/admin/plans
/admin/usage
```

---

# 6. Layout general

## Sidebar

Debe incluir:

```txt
Dashboard
Conversaciones
Preguntas frecuentes
Base de conocimiento
Agentes
Uso del plan
Configuración
```

En versión futura:

```txt
WhatsApp
Instagram
Messenger
Telegram
Webchat
```

## Header

Debe mostrar:

```txt
Nombre del negocio
Estado del bot: Activo / Pausado
Usuario actual
Botón cerrar sesión
```

---

# 7. Módulo Dashboard

## Objetivo

Mostrar el estado general del bot y métricas de valor para el negocio.

## Componentes

### 7.1 Bot Status Card

Debe mostrar:

```txt
Bot activo
Bot pausado
Última actualización
```

Acción:

```txt
Activar / Pausar bot global
```

Este switch actualiza:

```txt
businesses.bot_global_enabled
```

---

### 7.2 Métricas principales

Cards:

```txt
Conversaciones del mes
Mensajes recibidos
Respuestas IA
Derivaciones humanas
Horas ahorradas
Costo IA estimado
```

---

### 7.3 Gráfico de actividad

Mostrar conversaciones por día.

```txt
Fecha
Total mensajes
Respuestas IA
Derivaciones
```

---

### 7.4 Preguntas frecuentes detectadas

Tabla:

```txt
Pregunta
Cantidad
Última vez consultada
Respondida por FAQ/RAG/HUMAN
```

---

# 8. Módulo Conversaciones

## Vista lista

Columnas:

```txt
Cliente
Teléfono
Canal
Último mensaje
Estado BOT/HUMAN
Estado conversación
Fecha último mensaje
Motivo derivación
```

Filtros:

```txt
Todas
Modo BOT
Modo HUMAN
Derivadas
No leídas
Canal
Fecha
```

Acciones:

```txt
Ver detalle
Pasar a HUMAN
Devolver a BOT
Cerrar conversación
```

---

## Vista detalle

Debe mostrar:

```txt
Información del cliente
Historial de mensajes
Estado BOT/HUMAN
Motivo de derivación
Notas internas
Eventos de IA
```

Acciones:

```txt
Cambiar a HUMAN
Cambiar a BOT
Agregar nota interna
```

No se responderá desde esta vista en MVP, solo visualización y control.

---

# 9. Módulo FAQs

## Objetivo

Permitir al negocio administrar respuestas frecuentes.

## Vista lista

Columnas:

```txt
Pregunta
Respuesta
Categoría
Prioridad
Activa
Fecha actualización
```

Acciones:

```txt
Crear
Editar
Activar/desactivar
Eliminar
```

## Formulario FAQ

Campos:

```txt
question
answer
category
priority
active
```

Validaciones:

```txt
question requerido
answer requerido
business_id automático
```

---

# 10. Módulo Base de Conocimiento

## Objetivo

Permitir subir y administrar información que el bot usará para RAG.

## Funciones MVP

```txt
Crear documento manual
Subir archivo TXT/PDF/DOCX, opcional según backend
Ver documentos indexados
Reindexar documento
Eliminar documento
Activar/desactivar documento
```

## Campos

```txt
title
source_type
raw_text
file_url
status
```

Estados:

```txt
PENDING
INDEXED
ERROR
```

---

# 11. Módulo Agentes

## Objetivo

Configurar personas que reciben notificaciones cuando el bot deriva a humano.

## Campos

```txt
name
phone
role
notify_on_handoff
active
```

Acciones:

```txt
Crear agente
Editar agente
Activar/desactivar
Eliminar
```

---

# 12. Módulo Configuración

## Configuración general

Campos:

```txt
Nombre del negocio
Zona horaria
Bot global activo/inactivo
Confidence threshold
Modelo IA
```

## Mensajes personalizados

```txt
Mensaje de bienvenida
Mensaje de derivación
Mensaje fuera de horario
```

## Reglas

```txt
Reactivar bot automáticamente después de X horas
Horario de atención
Derivar siempre reclamos
Derivar siempre garantías
```

---

# 13. Módulo Uso del Plan

Debe mostrar:

```txt
Mensajes usados este mes
Respuestas IA usadas este mes
Derivaciones humanas
Costo IA estimado
Límite del plan
Porcentaje usado
```

Tabla sugerida:

```txt
Día
Mensajes
Respuestas IA
Costo estimado
```

---

# 14. Modelo de datos esperado

El dashboard leerá principalmente estas tablas:

```txt
businesses
whatsapp_accounts
customers
conversations
messages
faqs
knowledge_documents
knowledge_chunks
business_agents
usage_events
```

Tablas propias del dashboard:

```sql
profiles
- id
- user_id
- business_id
- full_name
- role
- active
- created_at
- updated_at
```

```sql
conversation_notes
- id
- business_id
- conversation_id
- user_id
- note
- created_at
```

---

# 15. Seguridad y permisos

## Row Level Security

Supabase debe usar RLS.

Reglas:

```txt
SUPER_ADMIN puede ver todo.
BUSINESS_ADMIN solo ve business_id asignado.
AGENT solo ve business_id asignado.
```

Ningún usuario debe poder consultar datos de otro negocio.

---

# 16. Integración con Bot IA

El dashboard debe conectarse al Bot IA para acciones críticas.

## Endpoints esperados

```http
PATCH /businesses/:id/settings
PATCH /conversations/:id/mode
POST /businesses/:id/faqs
PATCH /faqs/:id
DELETE /faqs/:id
POST /businesses/:id/knowledge-documents
POST /knowledge-documents/:id/index
POST /businesses/:id/agents
PATCH /agents/:id
```

## Acciones críticas

Estas acciones deben llamar al backend del bot:

```txt
Activar/desactivar bot global
Cambiar conversación BOT/HUMAN
Crear/editar FAQ
Subir/reindexar base de conocimiento
Crear/editar agentes
```

---

# 17. Estructura sugerida del proyecto

```txt
easycomp-dashboard/
├── app/
│   ├── login/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── conversations/
│   │   │   └── [id]/
│   │   ├── faqs/
│   │   ├── knowledge/
│   │   ├── agents/
│   │   ├── settings/
│   │   └── usage/
│   ├── admin/
│   └── api/
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── conversations/
│   ├── faqs/
│   ├── knowledge/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── api/
│   ├── auth/
│   ├── validators/
│   └── utils/
├── types/
├── hooks/
└── middleware.ts
```

---

# 18. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
BOT_API_BASE_URL=
BOT_API_SECRET=
```

---

# 19. UI recomendada

Estilo:

```txt
SaaS moderno
Limpio
Minimalista
Sidebar lateral
Cards de métricas
Tablas filtrables
Estados con badges
```

Colores sugeridos:

```txt
Verde para bot activo
Amarillo para derivación
Rojo para bot pausado/error
Azul para estadísticas
```

---

# 20. Criterios de aceptación MVP

El dashboard estará listo cuando:

```txt
1. Usuario pueda iniciar sesión.
2. Usuario vea solo su negocio.
3. Usuario pueda activar/desactivar bot global.
4. Usuario pueda ver métricas básicas.
5. Usuario pueda listar conversaciones.
6. Usuario pueda ver detalle de conversación.
7. Usuario pueda cambiar conversación BOT/HUMAN.
8. Usuario pueda crear/editar/eliminar FAQs.
9. Usuario pueda administrar documentos de conocimiento.
10. Usuario pueda crear/editar agentes.
11. Dashboard esté desplegado en Vercel.
12. Todo respete permisos por business_id.
```

---

# 21. Roadmap

## Fase 1

```txt
Dashboard estadísticas + control del bot
```

## Fase 2

```txt
Inbox visual para responder chats desde web
```

## Fase 3

```txt
Instagram DM + Messenger
```

## Fase 4

```txt
Omnicanal completo + planes + facturación
```
