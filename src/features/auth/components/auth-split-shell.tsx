import type { ReactNode } from "react";
import { LoginHeroCarousel } from "./login-hero-carousel";

type AuthSplitShellProps = {
  children: ReactNode;
};

export function AuthSplitShell({ children }: AuthSplitShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--landing-bg)] p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_-28px_rgba(13,148,136,0.28)] ring-1 ring-[#0d9488]/10 lg:grid-cols-[1fr_1fr]">
        <aside className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#ecfdf8] via-[#d1fae5] to-[#99f6e4] px-8 pt-10 pb-8 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-16 size-72 rounded-full bg-[#22d3a3]/35 blur-3xl" />
            <div className="absolute top-1/3 -right-10 size-56 rounded-full bg-[#c4121a]/18 blur-3xl" />
            <div className="absolute right-16 bottom-24 size-40 rounded-full bg-[#2dd4bf]/30 blur-3xl" />
          </div>

          <LoginHeroCarousel />
        </aside>

        <div className="flex items-center justify-center overflow-y-auto px-5 py-8 sm:px-10 lg:px-12 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
