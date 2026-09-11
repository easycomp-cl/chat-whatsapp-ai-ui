import { getNoteColorStyle } from "@/lib/notes/palette";
import { cn } from "@/lib/utils";

type StickyNoteFrameProps = {
  color?: string | null;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function StickyNoteFrame({
  color,
  children,
  className,
  contentClassName,
}: StickyNoteFrameProps) {
  const palette = getNoteColorStyle(color);

  return (
    <div className={cn("relative max-w-full", className)}>
      <div
        className={cn(
          "relative shadow-[1px_2px_5px_rgba(80,50,20,0.12)]",
          contentClassName
        )}
        style={{
          backgroundColor: palette.bg,
          clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)",
        }}
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 size-3.5"
        style={{
          background: palette.border,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}
