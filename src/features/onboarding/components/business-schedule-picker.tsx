"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WEEKDAYS,
  WEEKDAY_KEYS,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type DayKey,
  type ScheduleBlock,
  createBlockId,
  joinTime,
  parseScheduleBlocks,
  parseTimeParts,
  serializeScheduleBlocks,
  formatDaysLabel,
} from "../schedule-utils";

type BusinessSchedulePickerProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
};

type EditorState = {
  days: DayKey[];
  openHour: string;
  openMinute: string;
  closeHour: string;
  closeMinute: string;
};

const EMPTY_EDITOR: EditorState = {
  days: [],
  openHour: "09",
  openMinute: "00",
  closeHour: "18",
  closeMinute: "00",
};

export function BusinessSchedulePicker({ value, onChange, error }: BusinessSchedulePickerProps) {
  const lastEmittedRef = useRef(value);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(() => parseScheduleBlocks(value));
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    setBlocks(parseScheduleBlocks(value));
  }, [value]);

  const assignedDays = useMemo(() => {
    const set = new Set<DayKey>();
    for (const block of blocks) {
      if (editingId && block.id === editingId) continue;
      for (const day of block.days) set.add(day);
    }
    return set;
  }, [blocks, editingId]);

  function commitBlocks(next: ScheduleBlock[]) {
    const serialized = serializeScheduleBlocks(next);
    lastEmittedRef.current = serialized;
    setBlocks(next);
    onChange(serialized);
  }

  function toggleDay(day: DayKey) {
    if (assignedDays.has(day)) return;
    setEditorError(null);
    setEditor((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  }

  function applyPreset(days: DayKey[]) {
    const available = days.filter((d) => !assignedDays.has(d));
    setEditorError(null);
    setEditor((prev) => ({ ...prev, days: available }));
  }

  function resetEditor() {
    setEditor(EMPTY_EDITOR);
    setEditingId(null);
    setEditorError(null);
  }

  function loadBlockForEdit(block: ScheduleBlock) {
    const open = parseTimeParts(block.open);
    const close = parseTimeParts(block.close);
    setEditingId(block.id);
    setEditor({
      days: [...block.days],
      openHour: open.hour,
      openMinute: open.minute,
      closeHour: close.hour,
      closeMinute: close.minute,
    });
    setEditorError(null);
  }

  function saveBlock() {
    if (editor.days.length === 0) {
      setEditorError("Selecciona al menos un día para este horario.");
      return;
    }

    const open = joinTime(editor.openHour, editor.openMinute);
    const close = joinTime(editor.closeHour, editor.closeMinute);

    if (open >= close) {
      setEditorError("La hora de cierre debe ser posterior a la de apertura.");
      return;
    }

    const nextBlock: ScheduleBlock = {
      id: editingId ?? createBlockId(),
      days: [...editor.days].sort(
        (a, b) =>
          WEEKDAYS.findIndex((d) => d.key === a) - WEEKDAYS.findIndex((d) => d.key === b)
      ),
      open,
      close,
    };

    const nextBlocks = editingId
      ? blocks.map((b) => (b.id === editingId ? nextBlock : b))
      : [...blocks, nextBlock];

    commitBlocks(nextBlocks);
    resetEditor();
  }

  function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id);
    commitBlocks(next);
    if (editingId === id) resetEditor();
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="size-4 text-[#7678ed]" />
          Horario de atención
        </div>
        <p className="text-xs text-muted-foreground">
          Configura bloques de horario si atiendes distinto según el día. Ej: Lun–Vie
          9:00–18:00 y Sáb 10:00–14:00.
        </p>
      </div>

      {blocks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Horarios guardados</Label>
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5",
                  editingId === block.id && "border-[#7678ed] ring-1 ring-[#7678ed]/30"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatDaysLabel(block.days)}</p>
                  <p className="text-xs text-muted-foreground">
                    {block.open} – {block.close}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => loadBlockForEdit(block)}
                    aria-label="Editar horario"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBlock(block.id)}
                    aria-label="Eliminar horario"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-dashed bg-background/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium">
            {editingId ? "Editar bloque" : "Nuevo bloque de horario"}
          </Label>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetEditor}>
              Cancelar edición
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Días de este bloque</span>
            <span className="text-[10px] text-muted-foreground">
              {editor.days.length} seleccionado{editor.days.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Días del bloque">
            {WEEKDAYS.map((day) => {
              const selected = editor.days.includes(day.key);
              const taken = assignedDays.has(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  title={taken ? `${day.full} ya tiene horario asignado` : day.full}
                  disabled={taken}
                  aria-pressed={selected}
                  onClick={() => toggleDay(day.key)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg py-2 transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7678ed]/40",
                    taken && "cursor-not-allowed opacity-35",
                    selected
                      ? "bg-[#7678ed] text-white shadow-sm"
                      : "bg-muted/40 text-muted-foreground ring-1 ring-border hover:bg-muted"
                  )}
                >
                  <span className="text-xs font-bold leading-none">{day.short}</span>
                  <span
                    className={cn(
                      "text-[9px] leading-none",
                      selected ? "text-white/80" : "text-muted-foreground/70"
                    )}
                  >
                    {day.full.slice(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { label: "Lun–Vie", days: WEEKDAY_KEYS },
                { label: "Sábado", days: ["sab"] as DayKey[] },
                { label: "Domingo", days: ["dom"] as DayKey[] },
              ] as const
            ).map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset([...preset.days])}
                className="rounded-full bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {editor.days.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Selecciona al menos un día y luego guarda el bloque.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TimeSelectGroup
            label="Apertura"
            hour={editor.openHour}
            minute={editor.openMinute}
            onHourChange={(openHour) => setEditor((p) => ({ ...p, openHour }))}
            onMinuteChange={(openMinute) => setEditor((p) => ({ ...p, openMinute }))}
          />
          <TimeSelectGroup
            label="Cierre"
            hour={editor.closeHour}
            minute={editor.closeMinute}
            onHourChange={(closeHour) => setEditor((p) => ({ ...p, closeHour }))}
            onMinuteChange={(closeMinute) => setEditor((p) => ({ ...p, closeMinute }))}
          />
        </div>

        {editorError && (
          <p className="text-xs text-destructive">{editorError}</p>
        )}

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full border-[#7678ed]/30 text-[#7678ed] hover:bg-[#7678ed]/5"
          onClick={saveBlock}
        >
          <Plus className="size-4" />
          {editingId ? "Actualizar horario" : "Guardar horario"}
        </Button>
      </div>

      {blocks.length > 0 && (
        <div className="rounded-lg bg-background/80 px-3 py-2 ring-1 ring-border/60">
          <p className="text-xs text-muted-foreground">
            Resumen:{" "}
            <span className="font-medium text-foreground">
              {serializeScheduleBlocks(blocks)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function TimeSelectGroup({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={(v) => v && onHourChange(v)}>
          <SelectTrigger className="w-full" aria-label={`${label} hora`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent positionerClassName="z-[60]">
            {HOUR_OPTIONS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-muted-foreground">:</span>
        <Select value={minute} onValueChange={(v) => v && onMinuteChange(v)}>
          <SelectTrigger className="w-full" aria-label={`${label} minutos`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent positionerClassName="z-[60]">
            {MINUTE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
