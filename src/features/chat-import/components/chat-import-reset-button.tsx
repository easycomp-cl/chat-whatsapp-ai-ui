"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eraser, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { resetAllChatImportsAction } from "@/lib/actions/chat-import-actions";

export function ChatImportResetButton({
  hasImportData,
}: {
  hasImportData: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removeApprovedFaqs, setRemoveApprovedFaqs] = useState(true);
  const [pending, startTransition] = useTransition();

  if (!hasImportData) {
    return null;
  }

  function handleReset() {
    startTransition(async () => {
      try {
        const result = await resetAllChatImportsAction({
          remove_approved_faqs: removeApprovedFaqs,
        });
        toast.success(
          `Análisis reiniciado: ${result.deleted_jobs} importación(es) eliminada(s)${
            result.deleted_faqs > 0
              ? `, ${result.deleted_faqs} FAQ(s) de importación quitada(s)`
              : ""
          }.`
        );
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo reiniciar el análisis"
        );
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 text-destructive"
        onClick={() => setOpen(true)}
      >
        <Eraser className="size-4" />
        Empezar de cero (prueba)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Borrar todo el análisis de chats?</DialogTitle>
          <DialogDescription>
            Se eliminarán todas las importaciones, el tono detectado, las FAQs sugeridas y
            los ajustes de tono aplicados al bot. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Se borrará:</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Historial de importaciones y análisis de tono</li>
            <li>FAQs sugeridas pendientes o en revisión</li>
            <li>Saludos, frases y reglas de tono aplicadas desde chats</li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
          <div className="space-y-1">
            <Label htmlFor="remove-approved-faqs" className="text-sm leading-snug">
              También quitar FAQs aprobadas desde importación
            </Label>
            <p className="text-xs text-muted-foreground">
              No afecta FAQs creadas manualmente en la sección FAQs.
            </p>
          </div>
          <Switch
            id="remove-approved-faqs"
            checked={removeApprovedFaqs}
            onCheckedChange={setRemoveApprovedFaqs}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReset}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Borrando…
              </>
            ) : (
              <>
                <Eraser className="size-4" />
                Sí, empezar de cero
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
