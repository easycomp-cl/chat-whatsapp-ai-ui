"use client";

import { useState, type KeyboardEvent } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INFORMAL_SLANG_PHRASES } from "@/lib/chat-import/constants";

function normalizePhrase(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function dedupePhrases(phrases: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const phrase of phrases) {
    const normalized = normalizePhrase(phrase);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

export function EditablePhraseTags({
  phrases,
  onChange,
  disabled = false,
  label = "Frases o expresiones del negocio",
}: {
  phrases: string[];
  onChange: (phrases: string[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  function addPhrase(raw: string) {
    const value = normalizePhrase(raw);
    if (!value) return;
    if (phrases.some((phrase) => phrase.toLowerCase() === value.toLowerCase())) {
      toast.error("Esa frase ya está en la lista");
      return;
    }
    onChange(dedupePhrases([...phrases, value]));
    setDraft("");
  }

  function removePhrase(index: number) {
    onChange(phrases.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function startEdit(index: number) {
    if (disabled) return;
    setEditingIndex(index);
    setEditValue(phrases[index] ?? "");
  }

  function saveEdit(index: number) {
    const value = normalizePhrase(editValue);
    if (!value) {
      removePhrase(index);
      setEditingIndex(null);
      return;
    }
    const next = phrases.map((phrase, i) => (i === index ? value : phrase));
    onChange(dedupePhrases(next));
    setEditingIndex(null);
  }

  function removeInformalSlang() {
    const filtered = phrases.filter(
      (phrase) => !INFORMAL_SLANG_PHRASES.has(phrase.toLowerCase())
    );
    if (filtered.length === phrases.length) {
      toast.message("No había slang informal en la lista");
      return;
    }
    onChange(filtered);
    toast.success("Slang informal quitado. Revisa la lista antes de aplicar.");
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addPhrase(draft);
    }
  }

  if (disabled) {
    if (phrases.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2">
          {phrases.map((phrase) => (
            <Badge key={phrase} variant="secondary">
              {phrase}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label>{label}</Label>
          <p className="text-xs text-muted-foreground">
            Quita expresiones personales (wn, xd, choro…) si no quieres que el bot
            las use. Haz clic en una frase para editarla.
          </p>
        </div>
        {phrases.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeInformalSlang}
          >
            Quitar slang informal
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {phrases.map((phrase, index) =>
          editingIndex === index ? (
            <Input
              key={`${phrase}-${index}`}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveEdit(index);
                }
                if (e.key === "Escape") setEditingIndex(null);
              }}
              className="h-8 w-32"
              autoFocus
            />
          ) : (
            <Badge
              key={`${phrase}-${index}`}
              variant="secondary"
              className="group/tag gap-1 pr-1.5"
            >
              <button
                type="button"
                className="flex cursor-default items-center gap-1"
                onClick={() => startEdit(index)}
                aria-label={`Editar ${phrase}`}
              >
                <span>{phrase}</span>
                <Pencil className="size-3 opacity-0 transition-opacity group-hover/tag:opacity-70" />
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full p-0.5 opacity-0 transition-all hover:scale-110 hover:bg-destructive/15 hover:text-destructive group-hover/tag:opacity-100 focus:opacity-100"
                aria-label={`Quitar ${phrase}`}
                onClick={() => removePhrase(index)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleDraftKeyDown}
          placeholder="Agregar frase…"
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addPhrase(draft)}
          disabled={!draft.trim()}
          aria-label="Agregar frase"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
