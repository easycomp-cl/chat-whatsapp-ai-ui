import { cn } from "@/lib/utils";

type BrandNameProps = {
  className?: string;
};

export function BrandName({ className }: BrandNameProps) {
  return (
    <span className={cn("text-lg font-semibold tracking-tight", className)}>
      ConversAI
    </span>
  );
}
