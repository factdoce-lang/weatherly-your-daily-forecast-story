import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/weatherly-logo.png";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen">
      <div className="aurora-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="relative mx-auto w-full max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="Weatherly logo"
              width={36}
              height={36}
              className="h-9 w-9"
              loading="lazy"
            />
            <span className="font-display text-lg tracking-tight">Weatherly</span>
          </Link>
          <Link to="/" className="glass rounded-full px-3 py-1.5 text-xs">
            Check weather
          </Link>
        </div>

        <h1 className="font-display mt-8 text-2xl">{title}</h1>
        <div className="glass mt-4 space-y-4 rounded-2xl p-5 text-sm leading-relaxed text-foreground/85">
          {children}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
