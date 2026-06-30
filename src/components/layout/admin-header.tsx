"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

export function AdminHeader({ userName }: { userName: string }) {
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
        <h1 className="text-sm font-semibold">Panel ConversAI</h1>
        <div className="flex items-center gap-3">
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
