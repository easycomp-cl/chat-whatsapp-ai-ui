"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { cn } from "@/lib/utils";

type FadeInProps = {
  delay?: number;
  y?: number;
  children?: ReactNode;
  className?: string;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 24,
}: FadeInProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  tone = "light",
}: SectionHeaderProps) {
  const isDark = tone === "dark";

  return (
    <FadeIn
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-sm font-semibold tracking-wide uppercase",
            isDark ? "text-[var(--landing-cyan)]" : "text-[var(--landing-accent)]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight sm:text-4xl",
          isDark ? "text-[var(--landing-dark-ink)]" : "text-[var(--landing-ink)]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            isDark ? "text-[var(--landing-dark-muted)]" : "text-[var(--landing-muted)]"
          )}
        >
          {description}
        </p>
      ) : null}
    </FadeIn>
  );
}

type ConnectorDotProps = {
  active?: boolean;
  className?: string;
};

/** Punto conector para timelines/nodos — pulsa suavemente cuando está activo. */
export function ConnectorDot({ active = true, className }: ConnectorDotProps) {
  return (
    <span
      className={cn(
        "relative flex size-2.5 shrink-0 rounded-full bg-[var(--landing-cyan)]",
        active && "landing-pulse-dot",
        className
      )}
      aria-hidden="true"
    />
  );
}
