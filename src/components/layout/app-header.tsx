"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { NotificationMuteButton } from "@/components/layout/notification-mute-button";

type AppHeaderProps = {
  businessName: string;
  botEnabled: boolean;
  userName: string;
};

export function AppHeader({ businessName, botEnabled, userName }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">{businessName}</h1>
          <Badge
            variant="outline"
            className={
              botEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }
          >
            Bot {botEnabled ? "Activo" : "Pausado"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <NotificationMuteButton />
          <span className="text-sm text-muted-foreground">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
