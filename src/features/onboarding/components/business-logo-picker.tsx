"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BUSINESS_LOGO_ACCEPT,
  validateBusinessLogoFile,
} from "../logo-utils";

type BusinessLogoPickerProps = {
  logoUrl?: string | null;
  businessName?: string;
  onSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
};

export function BusinessLogoPicker({
  logoUrl,
  businessName,
  onSelect,
  onClear,
}: BusinessLogoPickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const initial = businessName?.trim().charAt(0).toUpperCase() || "N";

  function applyFile(file: File | undefined) {
    if (!file) return;
    const error = validateBusinessLogoFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    onSelect(file, URL.createObjectURL(file));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Logo de la empresa (opcional)</Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            applyFile(event.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
            dragOver
              ? "border-[#0d9488] bg-[#0d9488]/10"
              : logoUrl
                ? "border-[#0d9488]/40 bg-white"
                : "border-border bg-muted/40 hover:border-[#0d9488]/50"
          )}
          aria-label={logoUrl ? "Cambiar logo de la empresa" : "Subir logo de la empresa"}
        >
          {logoUrl ? (
            // Preview local (blob:) o URL remota; next/image no cubre blob:
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={businessName?.trim() ? `Logo de ${businessName.trim()}` : "Logo de la empresa"}
              className="size-full object-contain p-1"
            />
          ) : (
            <span className="flex flex-col items-center gap-0.5 text-[#0d9488]">
              <ImagePlus className="size-5" />
              <span className="text-[10px] font-medium">{initial}</span>
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            Opcional. PNG, JPG o WebP · máx. 2 MB. Se usa en el perfil del negocio
            y en la vista previa de WhatsApp.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              {logoUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
            {logoUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                <X className="size-3.5" />
                Quitar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={BUSINESS_LOGO_ACCEPT}
        className="sr-only"
        onChange={(event) => {
          applyFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
