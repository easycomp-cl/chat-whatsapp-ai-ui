"use client";

import { Check } from "lucide-react";
import type { FlowFieldDefinition } from "@/lib/flows/graph-types";
import { cn } from "@/lib/utils";
import { flowEditorTheme } from "./flow-editor-theme";

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
  option: "Opción",
  file: "Archivo",
};

type FlowFieldPickerProps = {
  fields: FlowFieldDefinition[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  multiple?: boolean;
  emptyMessage?: string;
};

export function FlowFieldPicker({
  fields,
  selectedKeys,
  onChange,
  multiple = true,
  emptyMessage = "Primero define campos en la sección «Campos del flujo».",
}: FlowFieldPickerProps) {
  if (fields.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-2 text-xs" style={{ color: flowEditorTheme.panelMuted }}>
        {emptyMessage}
      </p>
    );
  }

  function toggleField(key: string) {
    if (multiple) {
      if (selectedKeys.includes(key)) {
        onChange(selectedKeys.filter((k) => k !== key));
      } else {
        onChange([...selectedKeys, key]);
      }
      return;
    }
    onChange(selectedKeys[0] === key ? [] : [key]);
  }

  return (
    <div className="space-y-2">
      {fields.map((field) => {
        const selected = selectedKeys.includes(field.key);
        const typeLabel = FIELD_TYPE_LABELS[field.type] ?? field.type;

        return (
          <button
            key={field.key}
            type="button"
            onClick={() => toggleField(field.key)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
              selected
                ? "border-[#7678ed] bg-[#7678ed]/10"
                : "border-transparent bg-white hover:bg-white/80"
            )}
            style={{ borderColor: selected ? "#7678ed" : flowEditorTheme.panelBorder }}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded border",
                selected ? "border-[#7678ed] bg-[#7678ed] text-white" : "border-gray-300 bg-white"
              )}
            >
              {selected && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium" style={{ color: flowEditorTheme.ink }}>
                {field.label || field.key}
              </span>
              <span className="block truncate font-mono text-[10px]" style={{ color: flowEditorTheme.panelMuted }}>
                {field.key} · {typeLabel}
                {field.required ? " · obligatorio" : ""}
              </span>
            </span>
          </button>
        );
      })}
      {selectedKeys.length > 0 && (
        <p className="text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
          {multiple
            ? `${selectedKeys.length} campo(s) seleccionado(s)`
            : "1 campo seleccionado"}
        </p>
      )}
    </div>
  );
}

type FlowFieldSelectProps = {
  fields: FlowFieldDefinition[];
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
};

export function FlowFieldSelect({
  fields,
  value,
  onChange,
  placeholder = "Selecciona un campo…",
}: FlowFieldSelectProps) {
  if (fields.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-2 text-xs" style={{ color: flowEditorTheme.panelMuted }}>
        Primero define campos en «Campos del flujo».
      </p>
    );
  }

  return (
    <select
      className="h-9 w-full rounded-md border bg-white px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {fields.map((field) => (
        <option key={field.key} value={field.key}>
          {field.label || field.key} ({field.key})
        </option>
      ))}
    </select>
  );
}
