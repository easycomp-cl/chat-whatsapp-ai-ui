import Image from "next/image";
import { BRAND_ASSETS, PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "lockup";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** `mark`: isotipo. `lockup`: logo completo con wordmark. */
  variant?: LogoVariant;
  priority?: boolean;
};

const sizes = {
  mark: {
    sm: { width: 40, height: 40, className: "size-9" },
    md: { width: 56, height: 56, className: "size-12" },
    lg: { width: 96, height: 96, className: "size-24" },
  },
  lockup: {
    sm: { width: 180, height: 100, className: "h-12 w-auto" },
    md: { width: 240, height: 133, className: "h-[4.5rem] w-auto" },
    lg: { width: 360, height: 200, className: "h-24 w-auto sm:h-28" },
  },
} as const;

export function Logo({
  className,
  size = "md",
  variant = "lockup",
  priority = false,
}: LogoProps) {
  const { width, height, className: sizeClass } = sizes[variant][size];
  const src =
    variant === "mark" ? BRAND_ASSETS.mark : BRAND_ASSETS.lockupTransparent;

  return (
    <Image
      src={src}
      alt={PRODUCT_DISPLAY_NAME}
      width={width}
      height={height}
      className={cn("object-contain", sizeClass, className)}
      priority={priority}
      unoptimized
    />
  );
}
