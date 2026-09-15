"use client";

import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type OnboardingStartPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  onLater: () => void;
};

export function OnboardingStartPrompt({
  open,
  onOpenChange,
  onStart,
  onLater,
}: OnboardingStartPromptProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onLater();
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md gap-0 p-6 sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678ed]/10 text-[#7678ed]">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle className="text-lg">Configura tu asistente</DialogTitle>
          <DialogDescription>
            Completa la configuración inicial para que el bot conozca tu negocio y
            responda bien en WhatsApp. Puedes hacerlo ahora o más tarde.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onLater}>
            Hacerlo después
          </Button>
          <Button
            type="button"
            onClick={onStart}
            className="bg-[#7678ed] text-white hover:bg-[#7678ed]/90"
          >
            Empezar ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
