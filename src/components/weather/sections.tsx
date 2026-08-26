import { useEffect, useState } from "react";
import type { WeatherBundle } from "@/lib/weather";
import {
  aqiWord,
  buildConfidence,
  buildDecision,
  buildTimeline,
  cityNow,
  codeLabel,
  codeToKind,
  currentHourIndex,
  fmtTime,
  kindGlyph,
  sunProgress,
  uvWord,
  windWord,
} from "@/lib/weather-logic";

export function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`glass animate-rise rounded-[1.75rem] p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function DecisionCard({ bundle }: { bundle: WeatherBundle }) {
  const d = buildDecision(bundle);
  const conf = buildConfidence(bundle);
  const confColor =
    conf.tone === "high" ? "var(--good)" : conf.tone === "medium" ? "var(--warn)" : "var(--destructive)";

  return (
    <Card className="border-primary/30">
      <div className="flex items-start gap-4">
        <span aria-hidden className="text-4xl leading-none">
          {d.glyph}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-snug text-foreground">{d.headline}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{d.detail}</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {d.bullets.map((b) => (
          <li
            key={b}
            className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-foreground/90"
          >
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Forecast confidence</span>
          <span className="temp-numerals text-sm" style={{ color: confColor }}>
            {conf.value}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-[width] duration-1000"
            style={{ width: `${conf.value}%`, background: confColor }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{conf.note}</p>
      </div>
    </Card>
  );
}

export function Timeline({ bundle }: { bundle: WeatherBundle }) {
  const events = buildTimeline(bundle);
  return (
    <Card title="Weather timeline">
      <ol className="relative space-y-5 pl-7">
        <span
          aria-hidden
          className="absolute left-[9px] top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(180deg, var(--primary), color-mix(in oklab, var(--accent) 70%, transparent), transparent)",
          }}
        />
        {events.map((e, i) => (
          <li
            key={`${e.at}-${e.title}`}
            className="animate-rise relative"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              aria-hidden
              className={`absolute -left-7 top-1 grid h-[18px] w-[18px] place-items-center rounded-full border ${
                e.isNow ? "now-pulse border-primary bg-primary" : "border-border bg-secondary"
              }`}
            />
            <div className="flex items-baseline gap-2">
              <span
                className={`temp-numerals text-xs ${e.isNow ? "text-primary" : "text-muted-foreground"}`}
              >
                {e.at}
              </span>
              <span aria-hidden>{e.glyph}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{e.title}</p>
            {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function HourlyStrip({ bundle }: { bundle: WeatherBundle }) {
  const start = currentHourIndex(bundle);
  const hours = bundle.hourly.slice(start, start + 24);
  const temps = hours.map((h) => h.temperature);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const span = Math.max(max - min, 1);

  return (
    <Card title="Next 24 hours">
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1">
        {hours.map((h, i) => (
          <div key={h.time} className="flex w-14 shrink-0 flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {i === 0 ? "Now" : fmtTime(h.time).replace(":00", "")}
            </span>
            <span aria-hidden className="text-lg">
              {kindGlyph(codeToKind(h.weatherCode), h.isDay)}
            </span>
            <div className="flex h-20 w-full items-end justify-center">
              <div
                className="w-1.5 rounded-full"
                style={{
                  height: `${18 + ((h.temperature - min) / span) * 60}%`,
                  background: "linear-gradient(180deg, var(--primary), var(--accent))",
                }}
              />
            </div>
            <span className="temp-numerals text-sm">{Math.round(h.temperature)}°</span>
            <span className="text-[10px] text-primary/80">{h.precipProbability}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AirComfort({ bundle }: { bundle: WeatherBundle }) {
  const c = bundle.current;
  const aqi = bundle.air?.aqi;
  const tiles = [
    {
      label: "Air quality",
      value: aqi !== undefined ? String(aqi) : "—",
      note: aqi !== undefined ? aqiWord(aqi) : "Unavailable",
    },
    { label: "UV index", value: c.uv.toFixed(1), note: uvWord(c.uv) },
    { label: "Wind", value: `${Math.round(c.windSpeed)}`, note: `${windWord(c.windSpeed)} • km/h` },
    { label: "Humidity", value: `${Math.round(c.humidity)}%`, note: `Dew comfort` },
  ];
  return (
    <Card title="Air & comfort">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="temp-numerals mt-1 text-2xl">{t.value}</p>
            <p className="text-xs text-muted-foreground">{t.note}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SunPath({ bundle }: { bundle: WeatherBundle }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const sun = sunProgress(bundle);
  const p = Math.min(Math.max(sun.progress, 0), 1);
  const x = 20 + p * 260;
  const y = 90 - Math.sin(p * Math.PI) * 66;
  const isUp = sun.progress > 0 && sun.progress < 1;

  return (
    <Card title="Sun path">
      <svg viewBox="0 0 300 110" className="w-full" role="img" aria-label="Sun path today">
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <path
          d="M20 90 A 130 74 0 0 1 280 90"
          fill="none"
          stroke="url(#arc)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity="0.7"
        />
        <line x1="10" y1="90" x2="290" y2="90" stroke="var(--border)" strokeWidth="1" />
        {isUp && (
          <>
            <circle cx={x} cy={y} r="14" fill="var(--primary)" opacity="0.18" />
            <circle cx={x} cy={y} r="6" fill="var(--primary)" />
          </>
        )}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>🌄 {sun.sunrise}</span>
        <span className="capitalize text-foreground/80">{sun.phase}</span>
        <span>{sun.sunset} 🌇</span>
      </div>
    </Card>
  );
}

export function DailyList({ bundle }: { bundle: WeatherBundle }) {
  const overallMax = Math.max(...bundle.daily.map((d) => d.max));
  const overallMin = Math.min(...bundle.daily.map((d) => d.min));
  const span = Math.max(overallMax - overallMin, 1);

  return (
    <Card title="Tomorrow • 7 days">
      <ul className="space-y-3">
        {bundle.daily.map((d, i) => {
          const left = ((d.min - overallMin) / span) * 100;
          const width = ((d.max - d.min) / span) * 100;
          const label =
            i === 0
              ? "Today"
              : i === 1
                ? "Tomorrow"
                : new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
          return (
            <li key={d.date} className="flex items-center gap-3">
              <span className="w-16 text-sm text-muted-foreground">{label}</span>
              <span aria-hidden className="w-6 text-center">
                {kindGlyph(codeToKind(d.weatherCode))}
              </span>
              <span className="temp-numerals w-9 text-right text-sm text-muted-foreground">
                {Math.round(d.min)}°
              </span>
              <div className="relative h-1.5 flex-1 rounded-full bg-secondary">
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 6)}%`,
                    background: "linear-gradient(90deg, var(--primary), var(--warn))",
                  }}
                />
              </div>
              <span className="temp-numerals w-9 text-sm">{Math.round(d.max)}°</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function RadarCard({ bundle }: { bundle: WeatherBundle }) {
  const { latitude, longitude } = bundle.place;
  const src = `https://embed.windy.com/embed2.html?lat=${latitude}&lon=${longitude}&zoom=6&level=surface&overlay=rain&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  return (
    <Card title="Live rain radar">
      <div className="overflow-hidden rounded-2xl border border-border">
        <iframe
          title={`Live rain radar for ${bundle.place.name}`}
          src={src}
          className="h-[320px] w-full"
          loading="lazy"
        />
      </div>
    </Card>
  );
}

export function CurrentSummary({ bundle }: { bundle: WeatherBundle }) {
  const c = bundle.current;
  const now = cityNow(bundle);
  return (
    <div className="text-center">
      <p className="temp-numerals text-[5.5rem] leading-none">{Math.round(c.temperature)}°</p>
      <p className="mt-1 text-base text-foreground/90">{codeLabel(c.weatherCode)}</p>
      <p className="text-sm text-muted-foreground">
        Feels like {Math.round(c.apparent)}° • local time{" "}
        {`${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`}
      </p>
    </div>
  );
}
