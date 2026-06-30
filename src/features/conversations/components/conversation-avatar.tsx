import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/conversations/utils";

type ConversationAvatarProps = {
  name?: string | null;
  phone?: string;
  seed: string;
  size?: "sm" | "md" | "lg";
  showChannel?: boolean;
};

const sizes = {
  sm: "size-11 text-sm",
  md: "size-14 text-base",
  lg: "size-20 text-xl",
};

export function ConversationAvatar({
  name,
  phone,
  seed,
  size = "sm",
  showChannel = true,
}: ConversationAvatarProps) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white",
          getAvatarColor(seed),
          sizes[size]
        )}
      >
        {getInitials(name, phone)}
      </div>
      {showChannel && (
        <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white">
          <MessageCircle className="size-3 text-white" />
        </span>
      )}
    </div>
  );
}
