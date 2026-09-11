"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingOffering } from "../types";
import { createEmptyOffering } from "../utils";

type OfferingListEditorProps = {
  value: OnboardingOffering[];
  onChange: (offerings: OnboardingOffering[]) => void;
  businessType: "products" | "services" | "both";
};

export function OfferingListEditor({
  value,
  onChange,
  businessType,
}: OfferingListEditorProps) {
  function updateItem(index: number, patch: Partial<OnboardingOffering>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  }

  function addItem() {
    if (value.length >= 5) return;
    const type =
      businessType === "services"
        ? "service"
        : businessType === "products"
          ? "product"
          : "product";
    onChange([...value, { ...createEmptyOffering(), type }]);
  }

  return (
    <div className="space-y-4">
      {value.map((item, index) => (
        <div
          key={index}
          className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-3 rounded-xl border bg-muted/20 p-4 duration-300"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Ítem {index + 1}
            </span>
            {value.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(index)}
                aria-label="Eliminar ítem"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`offering-name-${index}`}>Nombre</Label>
              <Input
                id={`offering-name-${index}`}
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Ej. Pan amasado"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`offering-desc-${index}`}>Descripción</Label>
              <Textarea
                id={`offering-desc-${index}`}
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Describe brevemente este producto o servicio"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`offering-price-${index}`}>Precio (opcional)</Label>
              <Input
                id={`offering-price-${index}`}
                type="number"
                min={0}
                value={item.price ?? ""}
                onChange={(e) =>
                  updateItem(index, {
                    price: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="1200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`offering-currency-${index}`}>Moneda</Label>
              <Input
                id={`offering-currency-${index}`}
                value={item.currency ?? "CLP"}
                onChange={(e) => updateItem(index, { currency: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      {value.length < 5 && (
        <Button type="button" variant="outline" className="w-full" onClick={addItem}>
          <Plus className="size-4" />
          Agregar otro ítem
        </Button>
      )}
    </div>
  );
}
