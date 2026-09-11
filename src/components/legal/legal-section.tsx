import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LegalSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function LegalSection({
  id,
  title,
  children,
  className,
}: LegalSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-24", className)}
    >
      <h2
        id={`${id}-heading`}
        className="mb-4 text-xl font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <div className="space-y-4 text-[0.95rem] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}
