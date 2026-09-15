import type { WhatsappTemplateCategory } from "@/lib/bot-api/types";

export type TemplateInternalKind =
  | "autenticacion"
  | "servicio"
  | "consulta"
  | "producto"
  | "pedido"
  | "notificacion"
  | "pago"
  | "otro";

export type TemplateExample = {
  label: string;
  value: string;
};

export type StandardTemplateDefinition = {
  name: string;
  category: WhatsappTemplateCategory;
  kind: TemplateInternalKind;
  title: string;
  description: string;
  body: string;
  examples: TemplateExample[];
  footer?: string;
  buttonLabel?: string;
};

export const TEMPLATE_INTERNAL_KIND_LABEL: Record<TemplateInternalKind, string> = {
  autenticacion: "Autenticación",
  servicio: "Servicio",
  consulta: "Consulta",
  producto: "Producto",
  pedido: "Pedido",
  notificacion: "Notificación",
  pago: "Pago",
  otro: "Otro",
};

export const TEMPLATE_INTERNAL_KIND_CLASS: Record<TemplateInternalKind, string> = {
  autenticacion: "border-indigo-200 bg-indigo-50 text-indigo-700",
  servicio: "border-sky-200 bg-sky-50 text-sky-800",
  consulta: "border-violet-200 bg-violet-50 text-violet-700",
  producto: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pedido: "border-amber-200 bg-amber-50 text-amber-800",
  notificacion: "border-orange-200 bg-orange-50 text-orange-800",
  pago: "border-teal-200 bg-teal-50 text-teal-800",
  otro: "border-slate-200 bg-slate-50 text-slate-600",
};

export const STANDARD_WHATSAPP_TEMPLATES: StandardTemplateDefinition[] = [
  {
    name: "verificar_responsable_es",
    category: "AUTHENTICATION",
    kind: "autenticacion",
    title: "Validar número del responsable",
    description: "Código al WhatsApp personal para confirmar avisos.",
    body: "Tu código de verificación es {{1}}. Válido 10 minutos. No lo compartas.",
    examples: [{ label: "Código OTP", value: "482193" }],
    footer: "No lo compartas con nadie",
  },
  {
    name: "aviso_handoff_es",
    category: "UTILITY",
    kind: "servicio",
    title: "Aviso de derivación",
    description: "Notifica al responsable cuando un cliente necesita un humano. El botón abre ese chat en el inbox.",
    body: "Hola {{1}}, un cliente de {{2}} espera un humano. Conversación: {{3}}",
    examples: [
      { label: "Nombre del responsable", value: "María" },
      { label: "Nombre del negocio", value: "Panadería Aurora" },
      { label: "Cliente", value: "Israel G." },
    ],
    buttonLabel: "Abrir chat",
  },
  {
    name: "seguimiento_asesor_es",
    category: "UTILITY",
    kind: "consulta",
    title: "Seguimiento al cliente",
    description: "Recontacto cuando la ventana de 24 h está cerrada.",
    body: "Hola {{1}}, recibimos tu consulta en {{2}}. Un asesor te contactará pronto por este chat.",
    examples: [
      { label: "Nombre del cliente", value: "Camila" },
      { label: "Nombre del negocio", value: "Panadería Aurora" },
    ],
  },
  {
    name: "reabrir_conversacion_es",
    category: "UTILITY",
    kind: "consulta",
    title: "Reabrir conversación",
    description: "Pregunta si el cliente sigue necesitando ayuda (fuera de 24 h).",
    body: "Hola {{1}}, te escribimos de {{2}} por tu consulta. ¿Sigues necesitando ayuda? Responde este chat y te atendemos.",
    examples: [
      { label: "Nombre del cliente", value: "Pedro" },
      { label: "Nombre del negocio", value: "Panadería Aurora" },
    ],
  },
  {
    name: "pedido_actualizacion_es",
    category: "UTILITY",
    kind: "pedido",
    title: "Estado de pedido",
    description: "Avisa un cambio de estado de pedido.",
    body: "Hola {{1}}, tu pedido {{2}} tiene el siguiente estado: {{3}}.",
    examples: [
      { label: "Nombre del cliente", value: "Juan" },
      { label: "Número de pedido", value: "#1042" },
      { label: "Estado", value: "En preparación" },
    ],
  },
  {
    name: "recordatorio_cita_es",
    category: "UTILITY",
    kind: "notificacion",
    title: "Recordatorio de cita",
    description: "Recuerda fecha y hora de una cita.",
    body: "Hola {{1}}, te recordamos tu cita el {{2}} a las {{3}}. Si necesitas cambiarla, responde este chat.",
    examples: [
      { label: "Nombre del cliente", value: "Ana" },
      { label: "Fecha", value: "05/08/2026" },
      { label: "Hora", value: "10:30" },
    ],
  },
  {
    name: "link_pago_es",
    category: "UTILITY",
    kind: "pago",
    title: "Link de pago",
    description: "Envía un enlace de pago (cuerpo + botón URL).",
    body: "Hola {{1}}, aquí tienes el link de pago de {{2}}.",
    examples: [
      { label: "Nombre del cliente", value: "Juan" },
      { label: "Referencia", value: "Pedido #1042" },
    ],
    buttonLabel: "Pagar",
    footer: "Link de pago",
  },
  {
    name: "muestra_producto_es",
    category: "UTILITY",
    kind: "producto",
    title: "Detalle de producto",
    description: "Comparte el detalle del producto que consultó el cliente.",
    body: "Hola {{1}}, sobre {{2}}: {{3}}.",
    examples: [
      { label: "Nombre del cliente", value: "Camila" },
      { label: "Producto", value: "Tabla de pino 2x4" },
      { label: "Detalle", value: "18 mm, $12.900" },
    ],
  },
];
