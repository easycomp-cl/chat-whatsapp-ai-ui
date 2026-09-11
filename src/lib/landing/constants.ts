/** IDs de sección para navegación por anclas. */
export const LANDING_SECTIONS = {
  producto: "producto",
  comoFunciona: "como-funciona",
  funciones: "funciones",
  seguridad: "seguridad",
  faq: "faq",
  demo: "demo",
} as const;

export const LANDING_NAV_LINKS = [
  { href: `#${LANDING_SECTIONS.producto}`, label: "Producto" },
  { href: `#${LANDING_SECTIONS.comoFunciona}`, label: "Cómo funciona" },
  { href: `#${LANDING_SECTIONS.funciones}`, label: "Funciones" },
  { href: `#${LANDING_SECTIONS.seguridad}`, label: "Seguridad" },
  { href: `#${LANDING_SECTIONS.faq}`, label: "Preguntas frecuentes" },
] as const;

export const LANDING_CONTACT_EMAIL = "igonzalez@easycomp.cl";

export const CURRENT_FEATURES = [
  "Bandeja centralizada de conversaciones",
  "Organización por estados, etiquetas e historial",
  "IA con conocimiento de tu negocio",
  "Atención multiusuario y asignaciones",
  "Bot y humano en la misma conversación",
  "Activación global o por chat",
  "Plantillas de WhatsApp",
  "Métricas básicas de atención",
  "Automatizaciones configurables",
] as const;

export const FUTURE_CHANNELS = [
  { name: "Instagram", status: "Próximamente" as const },
  { name: "Messenger", status: "Próximamente" as const },
  { name: "TikTok", status: "Próximamente" as const },
  { name: "Telegram", status: "Próximamente" as const },
  { name: "Chat web", status: "Próximamente" as const },
  { name: "Voz y llamadas", status: "Próximamente" as const },
] as const;

export const LANDING_FAQ = [
  {
    question: "¿Necesito cambiar mi número de WhatsApp?",
    answer:
      "easycomp-chat-bot-manager se integra mediante WhatsApp Business Platform (Meta). Tu negocio mantiene su línea oficial; la plataforma centraliza y organiza las conversaciones sin reemplazar tu canal actual.",
  },
  {
    question: "¿La IA responde sola todo el tiempo?",
    answer:
      "No necesariamente. Puedes activar o desactivar el bot de forma global o por conversación. Cuando un cliente necesita atención humana, tu equipo puede intervenir con todo el contexto disponible.",
  },
  {
    question: "¿De dónde obtiene la información para responder?",
    answer:
      "easycomp-chat-bot-manager utiliza la información que cargas sobre tu negocio: productos, servicios, precios, horarios, políticas y preguntas frecuentes. Si no hay datos suficientes, puede derivar la conversación a una persona.",
  },
  {
    question: "¿Puede atender mi equipo al mismo tiempo?",
    answer:
      "Sí. La bandeja compartida permite que varios integrantes vean conversaciones, asignaciones y el historial completo para coordinar la atención.",
  },
  {
    question: "¿Qué pasa si la IA no sabe responder?",
    answer:
      "Puede solicitar más información, usar un mensaje de respaldo configurado o derivar la conversación a un integrante del equipo según las reglas que definas.",
  },
  {
    question: "¿Es seguro para mi negocio?",
    answer:
      "Cada empresa opera con su información aislada. La conexión se realiza mediante Meta y WhatsApp Business Platform, con roles, permisos y trazabilidad de las acciones en la plataforma.",
  },
] as const;
