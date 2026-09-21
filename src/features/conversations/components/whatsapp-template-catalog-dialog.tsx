"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listWhatsappTemplatesAction } from "@/lib/actions/app-actions";
import type { WhatsappTemplate } from "@/lib/bot-api/types";
import {
  inferInternalKind,
  isApprovedTemplate,
  isCustomerChatTemplate,
  templateButtonLabel,
  templateDescription,
  templateDisplayTitle,
  templatePackDefinition,
  templateResolvedBody,
} from "@/features/whatsapp-templates/utils";
import { exampleTemplateCta } from "@/features/whatsapp-templates/template-cta";
import {
  TEMPLATE_INTERNAL_KIND_CLASS,
  TEMPLATE_INTERNAL_KIND_LABEL,
} from "@/features/whatsapp-templates/standard-pack";
import { WhatsappTemplateBubble } from "@/features/whatsapp-templates/components/whatsapp-template-bubble";
import { cn } from "@/lib/utils";

type WhatsappTemplateCatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: WhatsappTemplate) => void;
};

export function WhatsappTemplateCatalogDialog({
  open,
  onOpenChange,
  onSelect,
}: WhatsappTemplateCatalogDialogProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const approved = useMemo(
    () => templates.filter((row) => isApprovedTemplate(row) && isCustomerChatTemplate(row)),
    [templates]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return approved;
    return approved.filter((row) => {
      const haystack = [
        templateDisplayTitle(row),
        templateDescription(row),
        row.name,
        row.product_use ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [approved, query]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setQuery("");

    void listWhatsappTemplatesAction("APPROVED").then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.error);
        setTemplates([]);
        return;
      }
      setTemplates(result.templates);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,44rem)] flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Plantillas aprobadas</DialogTitle>
          <DialogDescription>
            Elige una plantilla para precargarla en el chat. Solo aparecen las aprobadas por Meta.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando catálogo…
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay plantillas aprobadas para este chat. Revísalas en{" "}
            <Link href="/app/templates" className="font-medium text-[#0d9488] underline">
              Mis plantillas
            </Link>
            .
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar plantilla…"
                className="pl-8"
                aria-label="Buscar plantilla"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                Ninguna plantilla coincide con “{query.trim()}”.
              </p>
            ) : (
              <div className="max-h-[min(28rem,52vh)] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filtered.map((template) => {
                    const kind = inferInternalKind(template.name, template.product_use);
                    const title = templateDisplayTitle(template);
                    const pack = templatePackDefinition(template.name);
                    const cta = pack ? exampleTemplateCta(pack) : null;
                    return (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => {
                          onSelect(template);
                          window.setTimeout(() => onOpenChange(false), 0);
                        }}
                        className="flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm ring-foreground/5 transition hover:-translate-y-0.5 hover:border-[#0d9488]/40 hover:shadow-md focus-visible:border-[#0d9488] focus-visible:ring-3 focus-visible:ring-[#0d9488]/30"
                      >
                        <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
                          <h3 className="font-semibold tracking-tight text-[#111b21]">{title}</h3>
                          <Badge
                            variant="outline"
                            className={cn("shrink-0", TEMPLATE_INTERNAL_KIND_CLASS[kind])}
                          >
                            {TEMPLATE_INTERNAL_KIND_LABEL[kind]}
                          </Badge>
                        </div>
                        {templateDescription(template) ? (
                          <p className="line-clamp-2 px-3.5 pt-1.5 text-xs text-muted-foreground">
                            {templateDescription(template)}
                          </p>
                        ) : null}
                        <div
                          className="mx-3 my-3 overflow-hidden rounded-xl border border-black/5"
                          style={{
                            backgroundColor: "#efeae2",
                            backgroundImage:
                              "radial-gradient(circle at 18px 12px, rgba(0,0,0,0.035) 1.2px, transparent 1.4px)",
                            backgroundSize: "28px 28px",
                          }}
                        >
                          <WhatsappTemplateBubble
                            body={templateResolvedBody(template)}
                            buttonLabel={cta?.label ?? templateButtonLabel(template)}
                            buttonHint={cta?.hint ?? pack?.buttonHint}
                            buttonUrl={cta?.url}
                            compact
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
