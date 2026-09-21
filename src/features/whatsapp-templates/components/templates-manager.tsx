"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { provisionWhatsappStandardTemplatesAction } from "@/lib/actions/app-actions";
import type { WhatsappTemplate } from "@/lib/bot-api/types";
import {
  STANDARD_WHATSAPP_TEMPLATES,
  TEMPLATE_INTERNAL_KIND_CLASS,
  TEMPLATE_INTERNAL_KIND_LABEL,
  type StandardTemplateDefinition,
  type TemplateExample,
  type TemplateInternalKind,
} from "../standard-pack";
import {
  TEMPLATE_STATUS_CLASS,
  TEMPLATE_STATUS_LABEL,
  exampleValuesFor,
  inferInternalKind,
  normalizeTemplateStatus,
  templateBodyPreview,
  templateLastError,
  templateRejectionReason,
  type TemplatePreviewContext,
} from "../utils";
import { cn } from "@/lib/utils";
import { WhatsappTemplateBubble } from "./whatsapp-template-bubble";
import { exampleTemplateCta } from "../template-cta";

type TemplatesManagerProps = {
  templates: WhatsappTemplate[];
  whatsappConnected: boolean;
  previewContext: TemplatePreviewContext;
};

function TemplateCard({
  title,
  name,
  description,
  category,
  kind,
  examples,
  footer,
  buttonLabel,
  buttonHint,
  buttonUrl,
  apiRow,
  fallbackBody,
}: {
  title: string;
  name: string;
  description: string;
  category: string;
  kind: TemplateInternalKind;
  examples: TemplateExample[];
  footer?: string | null;
  buttonLabel?: string | null;
  buttonHint?: string | null;
  buttonUrl?: string | null;
  apiRow?: WhatsappTemplate;
  fallbackBody: string;
}) {
  const status = normalizeTemplateStatus(apiRow?.status);
  const body =
    status === "NOT_CREATED"
      ? fallbackBody
      : templateBodyPreview(apiRow ?? { name, status: "NOT_CREATED" }, fallbackBody);
  const rejection = apiRow ? templateRejectionReason(apiRow) : null;
  const lastError = apiRow ? templateLastError(apiRow) : null;
  const metaCategory = category === "AUTHENTICATION" ? "Autenticación" : "Utilidad";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight">{title}</h3>
          </div>
          <Badge variant="outline" className={cn("shrink-0", TEMPLATE_STATUS_CLASS[status])}>
            {TEMPLATE_STATUS_LABEL[status]}
          </Badge>
        </div>

        <p className="px-4 pt-2 text-sm text-muted-foreground">{description}</p>

        <div
          className="mx-4 mt-3 overflow-hidden rounded-xl border border-black/5"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage:
              "radial-gradient(circle at 18px 12px, rgba(0,0,0,0.035) 1.2px, transparent 1.4px)",
            backgroundSize: "28px 28px",
          }}
        >
          <div className="bg-[#075e54] px-3 py-1.5 text-[11px] font-medium text-white/90">
            WhatsApp
          </div>
          <WhatsappTemplateBubble
            body={body}
            examples={examples}
            footer={footer}
            buttonLabel={buttonLabel}
            buttonHint={buttonHint}
            buttonUrl={buttonUrl}
            compact
          />
        </div>

        {rejection ? (
          <p className="border-t px-4 py-2 text-xs text-destructive">Meta: {rejection}</p>
        ) : null}
        {lastError && !rejection ? (
          <p className="border-t px-4 py-2 text-xs text-destructive">Último error: {lastError}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1.5 border-t px-4 py-3">
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
            {metaCategory}
          </Badge>
          <Badge
            variant="outline"
            className={cn(TEMPLATE_INTERNAL_KIND_CLASS[kind])}
            title="Clasificación interna del producto"
          >
            {TEMPLATE_INTERNAL_KIND_LABEL[kind]}
          </Badge>
        </div>
      </article>
  );
}

function cardFromPack(
  item: StandardTemplateDefinition,
  apiRow: WhatsappTemplate | undefined,
  previewContext: TemplatePreviewContext
) {
  return (
    <TemplateCard
      key={item.name}
      title={item.title}
      name={item.name}
      description={item.description}
      category={item.category}
      kind={item.kind}
      examples={exampleValuesFor(
        apiRow ?? { name: item.name, status: "NOT_CREATED" },
        item,
        previewContext
      )}
      footer={item.footer}
      buttonLabel={item.buttonLabel}
      buttonHint={item.buttonHint}
      buttonUrl={exampleTemplateCta(item)?.url}
      apiRow={apiRow}
      fallbackBody={item.body}
    />
  );
}

export function TemplatesManager({
  templates,
  whatsappConnected,
  previewContext,
}: TemplatesManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const byName = new Map(templates.map((row) => [row.name, row]));
  const packNames = new Set(STANDARD_WHATSAPP_TEMPLATES.map((item) => item.name));
  const extraTemplates = templates.filter((row) => !packNames.has(row.name));

  function handleProvision() {
    startTransition(async () => {
      const result = await provisionWhatsappStandardTemplatesAction();
      if (!result.ok) {
        toast.error(result.error, {
          description: "Si WhatsApp del negocio no está conectado, conéctalo y vuelve a intentar.",
        });
        return;
      }
      const failed = result.result.failed ?? [];
      if (failed.length > 0) {
        toast.warning("Pack enviado con errores", {
          description: `No se pudieron crear: ${failed.join(", ")}`,
        });
      } else {
        toast.success("Pack enviado a Meta. Las plantillas quedan pendientes de aprobación.");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleProvision}
          disabled={pending || !whatsappConnected}
          className="shrink-0 bg-[#1877F2] text-white hover:bg-[#166FE5]"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Crear pack en Meta
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {STANDARD_WHATSAPP_TEMPLATES.map((item) =>
          cardFromPack(item, byName.get(item.name), previewContext)
        )}
      </div>

      {extraTemplates.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Otras plantillas de la WABA</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {extraTemplates.map((item) => {
              const pack = STANDARD_WHATSAPP_TEMPLATES.find((row) => row.name === item.name);
              const cta = pack ? exampleTemplateCta(pack) : null;
              return (
              <TemplateCard
                key={item.name}
                title={item.product_use?.trim() || item.name}
                name={item.name}
                description={item.product_use?.trim() || "Plantilla de la cuenta de WhatsApp."}
                category={String(item.category ?? "UTILITY")}
                kind={inferInternalKind(item.name, item.product_use)}
                examples={exampleValuesFor(item, undefined, previewContext)}
                buttonLabel={cta?.label ?? (/pago|pay/i.test(item.name) ? "Pagar" : null)}
                buttonHint={cta?.hint}
                buttonUrl={cta?.url}
                apiRow={item}
                fallbackBody=""
              />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
