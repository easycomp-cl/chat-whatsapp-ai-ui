export function LoginHeroArtChat() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute top-0 left-6 size-24 rounded-full bg-[#22d3a3]/35 blur-2xl" />
      <div className="absolute right-4 bottom-8 size-24 rounded-full bg-[#c4121a]/20 blur-2xl" />

      <div className="relative mx-auto w-52 rounded-[1.75rem] bg-white/90 p-3 shadow-[0_24px_50px_-20px_rgba(13,148,136,0.4)] ring-1 ring-white/80 backdrop-blur-sm">
        <div className="absolute -top-3 -right-3 flex size-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#0d9488]/15">
          <BotMark />
        </div>
        <div className="rounded-[1.35rem] bg-[#f4fbf8] p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#22d3a3]/20 text-[10px] font-semibold text-[#0d9488]">
              eC
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#202022]">Asistente</p>
              <p className="text-[10px] text-[#0d9488]">WhatsApp · en línea</p>
            </div>
          </div>
          <div className="space-y-2">
            <ChatBubble from="bot">¡Hola! ¿En qué te ayudo hoy?</ChatBubble>
            <ChatBubble from="user">¿Hacen despacho a domicilio?</ChatBubble>
            <ChatBubble from="bot">Sí, hasta las 18:00. ¿Te armo el pedido?</ChatBubble>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex justify-center gap-2">
        <div className="rounded-2xl bg-white/95 px-3 py-2 shadow-md ring-1 ring-[#0d9488]/10">
          <p className="text-[10px] font-medium text-[#5c5f6b]">Pedidos hoy</p>
          <p className="text-sm font-semibold text-[#0d9488]">+24 atendidos</p>
        </div>
        <div className="rounded-2xl bg-white/95 px-3 py-2 shadow-md ring-1 ring-[#c4121a]/15">
          <p className="text-[10px] font-medium text-[#5c5f6b]">Derivado</p>
          <p className="text-sm font-semibold text-[#c4121a]">Equipo humano</p>
        </div>
      </div>
    </div>
  );
}

export function LoginHeroArtInbox() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute top-4 right-8 size-24 rounded-full bg-[#c4121a]/18 blur-2xl" />
      <div className="mx-auto w-[260px] rounded-[1.75rem] bg-white/90 p-3 shadow-[0_24px_50px_-20px_rgba(13,148,136,0.4)] ring-1 ring-white/80">
        <p className="mb-2 px-1 text-[11px] font-semibold text-[#202022]">Conversaciones</p>
        <div className="space-y-2">
          <InboxRow
            name="María Soto"
            preview="¿Tienen el filtro 5W-30?"
            badge="Bot"
            badgeClass="bg-[#22d3a3]/20 text-[#0d9488]"
            time="ahora"
          />
          <InboxRow
            name="Juan Pérez"
            preview="Quiero hablar con alguien"
            badge="Humano"
            badgeClass="bg-[#c4121a]/12 text-[#c4121a]"
            time="2 min"
          />
          <InboxRow
            name="Taller Andes"
            preview="Pedido confirmado para hoy"
            badge="Bot"
            badgeClass="bg-[#22d3a3]/20 text-[#0d9488]"
            time="11:20"
          />
        </div>
      </div>
    </div>
  );
}

export function LoginHeroArtKnowledge() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute bottom-6 left-8 size-24 rounded-full bg-[#22d3a3]/30 blur-2xl" />
      <div className="mx-auto grid w-[260px] grid-cols-2 gap-2">
        <KnowledgeCard title="Catálogo" value="128 productos" />
        <KnowledgeCard title="FAQs" value="36 respuestas" />
        <KnowledgeCard title="Plantillas" value="Listas en Meta" />
        <KnowledgeCard title="Flujos" value="Pedidos y horarios" />
      </div>
    </div>
  );
}

function ChatBubble({
  from,
  children,
}: {
  from: "bot" | "user";
  children: string;
}) {
  const isBot = from === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <p
        className={
          isBot
            ? "max-w-[85%] rounded-2xl rounded-bl-md bg-[#22d3a3] px-3 py-2 text-[11px] leading-snug text-[#04120d] shadow-sm"
            : "max-w-[85%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11px] leading-snug text-[#202022] shadow-sm ring-1 ring-[#0d9488]/10"
        }
      >
        {children}
      </p>
    </div>
  );
}

function BotMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 text-[#0d9488]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 8V4" />
      <rect x="6" y="8" width="12" height="10" rx="3" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
      <path d="M9 16.5h6" />
    </svg>
  );
}

function InboxRow({
  name,
  preview,
  badge,
  badgeClass,
  time,
}: {
  name: string;
  preview: string;
  badge: string;
  badgeClass: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#f4fbf8] px-2.5 py-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0d9488]/15 text-[10px] font-semibold text-[#0d9488]">
        {name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-semibold text-[#202022]">{name}</p>
          <span className="shrink-0 text-[9px] text-[#5c5f6b]">{time}</span>
        </div>
        <p className="truncate text-[10px] text-[#5c5f6b]">{preview}</p>
      </div>
      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${badgeClass}`}>
        {badge}
      </span>
    </div>
  );
}

function KnowledgeCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/90 px-3 py-3 shadow-md ring-1 ring-[#0d9488]/10">
      <p className="text-[10px] font-medium text-[#5c5f6b]">{title}</p>
      <p className="mt-1 text-sm font-semibold text-[#0d9488]">{value}</p>
    </div>
  );
}
