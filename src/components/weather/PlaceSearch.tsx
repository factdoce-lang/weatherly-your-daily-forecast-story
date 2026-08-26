import { useEffect, useRef, useState } from "react";
import { searchPlaces, placeLabel, type Place } from "@/lib/weather";

export function PlaceSearch({
  onPick,
  onLocate,
  locating,
}: {
  onPick: (p: Place) => void;
  onLocate: () => void;
  locating?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(async () => {
      const r = await searchPlaces(query);
      if (!cancelled) {
        setResults(r);
        setBusy(false);
        setOpen(true);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
        <span aria-hidden className="text-sm opacity-70">
          🔎
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search any city, state or country"
          aria-label="Search for a city, state or country"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={onLocate}
          aria-label="Use my current location"
          className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-foreground/90 transition-colors hover:bg-secondary"
        >
          {locating ? "…" : "◎"}
        </button>
      </div>

      {open && (results.length > 0 || busy) && (
        <ul className="glass absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-3xl p-1.5">
          {busy && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
          )}
          {results.map((p) => (
            <li key={`${p.id}-${p.latitude}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(p);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {[p.admin1, p.country].filter(Boolean).join(" • ") || placeLabel(p)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
