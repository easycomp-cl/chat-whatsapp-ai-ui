import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 120, height: 48, className: "h-10 w-auto" },
  md: { width: 160, height: 64, className: "h-14 w-auto" },
  lg: { width: 200, height: 80, className: "h-20 w-auto" },
} as const;

export function Logo({ className, size = "md" }: LogoProps) {
  const { width, height, className: sizeClass } = sizes[size];

  return (
    <Image
      src="/conversai-logo.png"
      alt="ConversAI"
      width={width}
      height={height}
      className={cn(sizeClass, className)}
      priority
    />
  );
}
