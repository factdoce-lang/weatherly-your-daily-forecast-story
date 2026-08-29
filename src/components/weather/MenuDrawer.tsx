import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/weatherly-logo.png";

const RATE_KEY = "weatherly:rating";

const NAV = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/map", label: "Radar map", icon: "🛰️" },
  { to: "/about", label: "About us", icon: "ℹ️" },
  { to: "/contact", label: "Contact us", icon: "✉️" },
  { to: "/privacy", label: "Privacy policy", icon: "🔒" },
  { to: "/terms", label: "Terms & disclaimer", icon: "📄" },
] as const;

function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(RATE_KEY));
      if (saved > 0) {
        setRating(saved);
        setDone(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const pick = (n: number) => {
    setRating(n);
    setDone(true);
    try {
      localStorage.setItem(RATE_KEY, String(n));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-6 border-t border-border/50 pt-5">
      <p className="text-xs font-medium text-muted-foreground">Rate Weatherly</p>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rate this app">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => pick(n)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span className={n <= (hover || rating) ? "text-warn" : "text-foreground/25"}>★</span>
          </button>
        ))}
      </div>
      {done && (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          Thanks for your {rating}-star rating!
        </p>
      )}
    </div>
  );
}

export function MenuDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="glass fixed right-4 top-4 z-40 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full"
      >
        <span className="h-[2px] w-4 rounded-full bg-foreground" />
        <span className="h-[2px] w-4 rounded-full bg-foreground" />
        <span className="h-[2px] w-4 rounded-full bg-foreground" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="glass animate-rise absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto rounded-r-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Weatherly logo" width={32} height={32} className="h-8 w-8" />
                <span className="font-display text-base tracking-tight">Weatherly</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-xl text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-foreground/10"
                >
                  <span aria-hidden className="w-6 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <StarRating />

            <p className="mt-auto pt-6 text-[11px] text-muted-foreground">
              Forecast data by Open-Meteo · © {new Date().getFullYear()} Weatherly
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
