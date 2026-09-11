"use client";

import { cn } from "@/lib/utils";

type ColumnResizeHandleProps = {
  onMouseDown: (event: React.MouseEvent) => void;
  className?: string;
};

export function ColumnResizeHandle({ onMouseDown, className }: ColumnResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar columna"
      onMouseDown={onMouseDown}
      className={cn(
        "group relative z-10 w-0 shrink-0 cursor-col-resize touch-none select-none",
        className
      )}
    >
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 flex items-center justify-center">
        <div
          className="h-full w-1 rounded-full bg-transparent transition-colors group-hover:bg-[#7678ed]/35 group-active:bg-[#7678ed]/55"
        />
      </div>
    </div>
  );
}
