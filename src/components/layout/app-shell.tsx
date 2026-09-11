"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_SHORT_NAME } from "@/lib/brand/constants";
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
  Truck,
  ContactRound,
  Workflow,
  UserCircle,
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
import { roleMatchesNav } from "@/lib/roles/labels";
import { AppHeader } from "@/components/layout/app-header";
import { usePendingMessages } from "@/features/conversations/context/pending-messages-context";
import { OnboardingDevTrigger } from "@/features/onboarding/components/onboarding-dev-trigger";
import { Bell } from "lucide-react";

import { TEAM_MODULE, CLIENTS_MODULE } from "@/lib/roles/labels";

const collaboratorRoles = ["BUSINESS_ADMIN", "COLLABORATOR", "AGENT"] as UserRole[];

const navItems = [
  { href: "/app/perfil", label: "Mi Perfil", icon: UserCircle, roles: collaboratorRoles },
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: collaboratorRoles },
  { href: "/app/conversations", label: "Conversaciones", icon: MessageSquare, roles: collaboratorRoles },
  { href: "/app/flujos", label: "Flujos", icon: Workflow, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/faqs", label: "Preguntas frecuentes", icon: HelpCircle, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/importar-chat", label: "Importar chat", icon: MessageCirclePlus, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/knowledge", label: "Base de conocimiento", icon: BookOpen, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/catalog", label: "Catálogo", icon: ShoppingBag, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/despachos", label: "Despachos", icon: Truck, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/users", label: TEAM_MODULE.navLabel, icon: Users, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/clientes", label: CLIENTS_MODULE.navLabel, icon: ContactRound, roles: collaboratorRoles },
  { href: "/app/usage", label: "Uso del plan", icon: BarChart3, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/settings", label: "Configuración", icon: Settings, roles: ["BUSINESS_ADMIN"] as UserRole[] },
  { href: "/app/preferencias", label: "Notificaciones", icon: Bell, roles: ["COLLABORATOR", "AGENT"] as UserRole[] },
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

  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const active = isActive || pendingHref === item.href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        render={
          <Link
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            onClick={() => setPendingHref(item.href)}
          />
        }
        isActive={active}
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
  const items = navItems.filter((item) => roleMatchesNav(userRole, item.roles));

  return (
    <SidebarProvider>
      <Sidebar className="[&_[data-slot=sidebar-inner]]:shadow-xl">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="easyCOMP Chat Bot Manager"
          >
            <Logo variant="mark" size="sm" className="size-9 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {PRODUCT_SHORT_NAME}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex flex-col">
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
          <OnboardingDevTrigger businessId={businessId} businessName={businessName} />
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
  );
}
