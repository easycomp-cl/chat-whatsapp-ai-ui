"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, MessageCircle, BarChart3 } from "lucide-react";
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
import { Logo } from "@/components/brand/logo";
import { PRODUCT_SHORT_NAME } from "@/lib/brand/constants";
import { AdminHeader } from "@/components/layout/admin-header";

const adminNav = [
  { href: "/admin/businesses", label: "Negocios", icon: Building2 },
  { href: "/admin/whatsapp-accounts", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/plans", label: "Planes", icon: CreditCard },
  { href: "/admin/usage", label: "Uso global", icon: BarChart3 },
];

export function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b px-3 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="easyCOMP Chat Bot Manager"
          >
            <Logo variant="mark" size="sm" className="size-9 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {PRODUCT_SHORT_NAME}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname.startsWith(item.href)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AdminHeader userName={userName} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
