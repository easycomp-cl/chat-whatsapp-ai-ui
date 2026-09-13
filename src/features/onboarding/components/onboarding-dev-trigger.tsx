"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Layout, Scale, Smartphone, Sparkles } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OnboardingWizardDialog } from "./onboarding-wizard-dialog";

type OnboardingDevTriggerProps = {
  businessId: string;
  businessName: string;
};

const DEV_LINKS = [
  {
    href: "/onboarding/whatsapp",
    label: "Conectar WhatsApp",
    icon: Smartphone,
  },
  {
    href: "/",
    label: "Landing page",
    icon: Layout,
  },
  {
    href: "/politica-de-privacidad",
    label: "Política de privacidad",
    icon: Scale,
  },
  {
    href: "/eliminacion-de-datos",
    label: "Eliminación de datos",
    icon: FileText,
  },
] as const;

export function OnboardingDevTrigger({ businessId, businessName }: OnboardingDevTriggerProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <SidebarGroup className="mt-auto px-3 py-2">
        <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">
          Desarrollo
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => setOpen(true)}
                className="text-[#7678ed] hover:bg-[#7678ed]/10 hover:text-[#7678ed]"
              >
                <Sparkles />
                <span>Onboarding wizard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {DEV_LINKS.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  size="lg"
                  render={
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <OnboardingWizardDialog
        businessId={businessId}
        businessName={businessName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
