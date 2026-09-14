"use client";

import { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PinVerificationDialogProps = {
  open: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  busy?: boolean;
};

export function PinVerificationDialog({
  open,
  onConfirm,
  onCancel,
  busy = false,
}: PinVerificationDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValid = /^\d{6}$/.test(pin);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError("Por favor ingresa el PIN de 6 dígitos.");
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError("El PIN debe ser exactamente 6 dígitos numéricos.");
      return;
    }

    onConfirm(pin);
  }

  function handleCancel() {
    setPin("");
    setError(null);
    onCancel();
  }

  function handlePinChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setPin(digitsOnly);
    if (error) setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !busy && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              PIN de verificación en dos pasos
            </DialogTitle>
            <DialogDescription className="text-center">
              Ingresa el PIN de 6 dígitos que configuraste en WhatsApp Manager para este
              número. Este paso es necesario para completar la conexión.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de 6 dígitos</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                disabled={busy}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              <strong className="font-medium">¿No tienes un PIN?</strong> Crea uno en{" "}
              <a
                href="https://business.facebook.com/settings/whatsapp-business-accounts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                WhatsApp Manager
                <ExternalLink className="size-3" />
              </a>
              {" "}en la sección de configuración de verificación en dos pasos.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || busy}>
              {busy ? "Verificando..." : "Continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
