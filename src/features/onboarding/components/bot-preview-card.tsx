"use client";

import { CheckCheck, MessageCircle, Package, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingDraft, OnboardingOffering } from "../types";
import { buildConversationPreview } from "../preview-conversation";
import { resolveUseNamedAgent } from "../utils";

type BotPreviewCardProps = {
  draft: OnboardingDraft;
  className?: string;
};

function formatPrice(price?: number, currency?: string): string {
  if (price == null || price <= 0) return "Consultar precio";
  return `$${price.toLocaleString("es-CL")} ${currency ?? "CLP"}`;
}

function ChatBubble({
  from,
  children,
  time,
  botName,
}: {
  from: "client" | "bot";
  children: React.ReactNode;
  time: string;
  botName?: string;
}) {
  const isBot = from === "bot";

  return (
    <div
      className={cn(
        "flex animate-in fade-in-0 slide-in-from-bottom-1 duration-300",
        isBot ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-2.5 py-1.5 shadow-sm",
          isBot
            ? "rounded-tr-none bg-[#dcf8c6] text-foreground"
            : "rounded-tl-none bg-white text-foreground"
        )}
      >
        {!isBot && (
          <span className="mb-0.5 block text-[9px] font-medium text-[#7678ed]">
            Cliente
          </span>
        )}
        {isBot && botName && (
          <span className="mb-0.5 block text-[9px] font-medium text-[#075e54]">
            {botName}
          </span>
        )}
        <div className="text-[11px] leading-snug">{children}</div>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-0.5 text-[9px]",
            isBot ? "text-[#075e54]/60" : "text-muted-foreground"
          )}
        >
          <span>{time}</span>
          {isBot && <CheckCheck className="size-3 text-[#53bdeb]" />}
        </div>
      </div>
    </div>
  );
}

function ProductCardBubble({
  offering,
  intro,
  time,
  botName,
}: {
  offering: OnboardingOffering;
  intro: string;
  time: string;
  botName?: string;
}) {
  return (
    <div className="flex animate-in fade-in-0 slide-in-from-bottom-1 justify-end duration-300">
      <div className="max-w-[82%] overflow-hidden rounded-lg rounded-tr-none bg-[#dcf8c6] shadow-sm">
        <div className="px-2.5 pt-1.5">
          {botName && (
            <span className="mb-1 block text-[9px] font-medium text-[#075e54]">
              {botName}
            </span>
          )}
          <p className="text-[11px] leading-snug text-foreground">{intro}</p>
        </div>

        <div className="mx-2.5 mt-2 overflow-hidden rounded-md border border-black/5 bg-white">
          <div className="flex h-16 items-center justify-center bg-linear-to-br from-[#7678ed]/15 to-[#7678ed]/5">
            <Package className="size-7 text-[#7678ed]/70" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5 p-2">
            <p className="text-[11px] font-semibold leading-tight">{offering.name}</p>
            <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
              {offering.description}
            </p>
            <p className="pt-0.5 text-[11px] font-bold text-[#075e54]">
              {formatPrice(offering.price, offering.currency)}
            </p>
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="w-full border-t border-black/5 py-1.5 text-center text-[10px] font-medium text-[#00a884]"
          >
            Ver producto
          </button>
        </div>

        <div className="flex items-center justify-end gap-0.5 px-2.5 py-1 text-[9px] text-[#075e54]/60">
          <span>{time}</span>
          <CheckCheck className="size-3 text-[#53bdeb]" />
        </div>
      </div>
    </div>
  );
}

function ReplyButtonsBubble({
  text,
  options,
  time,
}: {
  text: string;
  options: string[];
  time: string;
}) {
  return (
    <div className="flex animate-in fade-in-0 slide-in-from-bottom-1 justify-end duration-300">
      <div className="max-w-[85%] overflow-hidden rounded-lg rounded-tr-none bg-[#dcf8c6] shadow-sm">
        <div className="px-2.5 pt-1.5 pb-1">
          <p className="text-[11px] leading-[1.35] text-foreground">
            {text}
            <span className="float-right ml-2 mt-1 inline-flex translate-y-px items-center gap-0.5 text-[9px] leading-none text-[#075e54]/55">
              {time}
              <CheckCheck className="size-3 text-[#53bdeb]" />
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5 px-2.5 pb-2">
          {options.map((option, index) => {
            const isMuted =
              index === options.length - 1 &&
              /hablar|asesor|alguien/i.test(option);

            return (
              <div
                key={option}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2 shadow-sm ring-1",
                  isMuted
                    ? "bg-[#f4f5f5] ring-black/6"
                    : "bg-[#eefbf6] ring-[#00a884]/18"
                )}
              >
                <Reply
                  className={cn(
                    "size-3.5 shrink-0 -scale-x-100",
                    isMuted ? "text-[#8696a0]" : "text-[#00a884]"
                  )}
                  strokeWidth={2.25}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    isMuted ? "text-[#8696a0]" : "text-[#00a884]"
                  )}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BotPreviewCard({ draft, className }: BotPreviewCardProps) {
  const useNamedAgent = resolveUseNamedAgent(draft);
  const agentName = draft.bot_identity?.bot_name?.trim();
  const botName = useNamedAgent && agentName ? agentName : undefined;
  const businessName = draft.identity?.business_name?.trim() || "Tu negocio";
  const messages = buildConversationPreview(draft);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Así podría verse en WhatsApp
        </p>
        <span className="text-[10px] text-muted-foreground">Demo con tus datos</span>
      </div>

      <div className="overflow-hidden rounded-lg border bg-[#e5ddd5]/40 ring-1 ring-foreground/5">
        <div className="flex items-center gap-2 border-b bg-[#075e54] px-3 py-2 text-white">
          <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight">
              {businessName}
            </p>
            <p className="text-[9px] text-white/75">en línea</p>
          </div>
        </div>

        <div
          className="max-h-[min(340px,50vh)] space-y-2 overflow-y-auto overscroll-contain p-3"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 4%) 1px, transparent 0)",
            backgroundSize: "12px 12px",
          }}
        >
          <div className="flex justify-center py-1">
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[9px] font-medium text-muted-foreground shadow-sm">
              Hoy
            </span>
          </div>

          {messages.map((message, index) => {
            if (message.kind === "text") {
              return (
                <ChatBubble
                  key={index}
                  from={message.from}
                  time={message.time}
                  botName={message.from === "bot" ? botName : undefined}
                >
                  {message.text}
                </ChatBubble>
              );
            }

            if (message.kind === "product") {
              return (
                <ProductCardBubble
                  key={index}
                  offering={message.offering}
                  intro={message.intro}
                  time={message.time}
                  botName={botName}
                />
              );
            }

            if (message.kind === "reply_buttons") {
              return (
                <ReplyButtonsBubble
                  key={index}
                  text={message.text}
                  options={message.options}
                  time={message.time}
                />
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
