"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandName } from "@/components/brand/brand-name";
import {
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
  ShoppingBag,
  MessageCirclePlus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import {
  PendingMessagesProvider,
  usePendingMessages,
} from "@/features/conversations/context/pending-messages-context";
import { Bell } from "lucide-react";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["BUSINESS_ADMIN", "AGENT"] as UserRole[] },
  { href: "/app/conversations", label: "Conversaciones", icon: MessageSquare, roles: ["BUSINESS_ADMIN", "AGENT"] as UserRole[] },
  { href: "/app/faqs", label: "Preguntas frecuentes", icon: HelpCircle, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/importar-chat", label: "Importar chat", icon: MessageCirclePlus, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/knowledge", label: "Base de conocimiento", icon: BookOpen, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/catalog", label: "Catálogo", icon: ShoppingBag, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/agents", label: "Usuarios", icon: Users, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/usage", label: "Uso del plan", icon: BarChart3, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/settings", label: "Configuración", icon: Settings, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/preferencias", label: "Notificaciones", icon: Bell, roles: ["AGENT"] as UserRole[] },
];

type AppShellProps = {
  children: React.ReactNode;
  businessId: string;
  businessName: string;
  botEnabled: boolean;
  userName: string;
  userRole: UserRole;
};

function NavItemWithPending({
  item,
  isActive,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
}) {
  const { pendingCount } = usePendingMessages();
  const showPending = item.href === "/app/conversations" && pendingCount > 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        render={<Link href={item.href} aria-current={isActive ? "page" : undefined} />}
        isActive={isActive}
      >
        <span className="relative">
          <item.icon />
          {showPending && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ff7a55] text-[9px] font-bold text-white ring-2 ring-sidebar">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </span>
        <span className="flex flex-1 items-center justify-between gap-2">
          {item.label}
          {showPending && (
            <span className="rounded-full bg-[#ff7a55]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff7a55]">
              Pendiente
            </span>
          )}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppShell({
  children,
  businessId,
  businessName,
  botEnabled,
  userName,
  userRole,
}: AppShellProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <PendingMessagesProvider businessId={businessId}>
    <SidebarProvider>
      <Sidebar className="[&_[data-slot=sidebar-inner]]:shadow-xl">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
          <BrandName className="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">
              Menú
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {items.map((item) => (
                  <NavItemWithPending
                    key={item.href}
                    item={item}
                    isActive={pathname.startsWith(item.href)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-[var(--chat-surface)]">
        <AppHeader
          businessName={businessName}
          botEnabled={botEnabled}
          userName={userName}
        />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </PendingMessagesProvider>
  );
}
