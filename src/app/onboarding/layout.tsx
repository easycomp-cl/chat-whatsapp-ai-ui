import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <Logo variant="mark" size="sm" className="size-9" />
            <span className="text-sm font-semibold tracking-tight">
              {PRODUCT_DISPLAY_NAME}
            </span>
          </Link>
          <Link
            href="/app/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ir al dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}
