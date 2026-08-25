import { useEffect, useRef } from "react";
import type { SkyKind, SkyPhase } from "@/lib/weather-logic";

type Props = {
  kind: SkyKind;
  phase: SkyPhase;
  /** mm/h of precipitation — drives particle density */
  intensity: number;
  /** km/h wind — drives drift speed */
  wind: number;
  cloudCover: number;
  isDay: boolean;
};

const PHASE_GRADIENTS: Record<SkyPhase, [string, string, string]> = {
  night: ["#080d24", "#101a3d", "#1b1150"],
  dawn: ["#241a3d", "#6b3a63", "#e08b6a"],
  morning: ["#123a63", "#2a7fa8", "#8ed0d9"],
  noon: ["#0d5a8f", "#2b93c9", "#a9e4f0"],
  afternoon: ["#12507f", "#3f86b5", "#d9c48f"],
  dusk: ["#2a1b46", "#7a3a63", "#f0946a"],
  twilight: ["#0d1130", "#2a2159", "#5b3a7a"],
};

export function SkyStage({ kind, phase, intensity, wind, cloudCover, isDay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grad = PHASE_GRADIENTS[phase] ?? PHASE_GRADIENTS.noon;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const isRain = kind === "rain" || kind === "heavy-rain" || kind === "thunder";
    const isSnow = kind === "snow";
    const density = isRain
      ? Math.round(Math.min(420, 60 + intensity * 110 + (kind === "thunder" ? 90 : 0)))
      : isSnow
        ? Math.round(Math.min(200, 50 + intensity * 60))
        : 0;

    type P = { x: number; y: number; v: number; len: number; drift: number; r: number };
    const parts: P[] = Array.from({ length: density }, () => ({
      x: Math.random() * (w + 200) - 100,
      y: Math.random() * h,
      v: isSnow ? 18 + Math.random() * 28 : 320 + Math.random() * 260 + intensity * 40,
      len: isSnow ? 0 : 8 + Math.random() * (10 + intensity * 6),
      drift: (wind / 40) * (isSnow ? 26 : 60) + Math.random() * 8,
      r: isSnow ? 1 + Math.random() * 2.2 : 1,
    }));

    // Slow star field for night phases
    const stars =
      phase === "night" || phase === "twilight"
        ? Array.from({ length: 70 }, () => ({
            x: Math.random(),
            y: Math.random() * 0.7,
            r: Math.random() * 1.3 + 0.2,
            tw: Math.random() * Math.PI * 2,
          }))
        : [];

    let last = performance.now();
    const draw = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, w, h);

      // stars
      for (const s of stars) {
        const alpha = 0.35 + 0.45 * Math.sin(t / 900 + s.tw);
        ctx.globalAlpha = Math.max(alpha, 0.08);
        ctx.fillStyle = "#eaf4ff";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (density) {
        for (const p of parts) {
          if (isSnow) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            p.x += Math.sin(t / 700 + p.y / 60) * 0.6 + p.drift * dt;
          } else {
            ctx.strokeStyle = `rgba(190,225,255,${0.25 + Math.min(intensity, 6) * 0.06})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.drift * 0.02 * p.len, p.y + p.len);
            ctx.stroke();
            p.x += p.drift * dt;
          }
          p.y += p.v * dt;
          if (p.y > h + 20) {
            p.y = -20;
            p.x = Math.random() * (w + 200) - 100;
          }
          if (p.x > w + 100) p.x = -100;
        }
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [kind, intensity, wind, phase]);

  const cloudOpacity = Math.min(0.1 + cloudCover / 150, 0.75);
  const driftSeconds = Math.max(8, 46 - wind * 0.8);
  const wet = kind === "heavy-rain" || (kind === "thunder" && intensity > 2);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${grad[0]} 0%, ${grad[1]} 52%, ${grad[2]} 100%)`,
        }}
      />

      {/* Sun / moon with light rays */}
      {(kind === "clear" || kind === "cloudy") && (
        <div
          className="absolute"
          style={{
            top: isDay ? "14%" : "18%",
            right: "16%",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: isDay
              ? "radial-gradient(circle, rgba(255,246,214,0.98) 0%, rgba(255,214,130,0.6) 38%, rgba(255,190,110,0) 72%)"
              : "radial-gradient(circle, rgba(233,240,255,0.95) 0%, rgba(180,200,255,0.35) 42%, rgba(150,180,255,0) 74%)",
            filter: `blur(${isDay ? 0.5 : 0.8}px)`,
          }}
        />
      )}
      {kind === "clear" && isDay && (
        <div
          className="absolute animate-drift-slow"
          style={{
            top: "-10%",
            right: "-5%",
            width: "70%",
            height: "70%",
            background:
              "conic-gradient(from 200deg at 70% 25%, rgba(255,240,200,0.22) 0deg, transparent 24deg, rgba(255,240,200,0.16) 40deg, transparent 70deg, rgba(255,240,200,0.12) 96deg, transparent 130deg)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Cloud layers — drift speed follows real wind */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-x-[-30%]"
          style={{
            top: `${8 + i * 18}%`,
            height: "38%",
            opacity: cloudOpacity * (1 - i * 0.22),
            background: `radial-gradient(45% 60% at 20% 50%, rgba(255,255,255,0.85), transparent 70%),
                         radial-gradient(38% 52% at 52% 42%, rgba(255,255,255,0.7), transparent 72%),
                         radial-gradient(42% 58% at 82% 58%, rgba(255,255,255,0.6), transparent 70%)`,
            filter: "blur(12px)",
            animation: `wl-drift ${driftSeconds + i * 6}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Fog band */}
      {kind === "fog" && (
        <div
          className="absolute inset-x-[-20%] bottom-0 h-2/3 animate-drift-slow"
          style={{
            background:
              "linear-gradient(0deg, rgba(226,232,240,0.62) 0%, rgba(226,232,240,0.28) 55%, transparent 100%)",
            filter: "blur(6px)",
          }}
        />
      )}

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Lightning flash */}
      {kind === "thunder" && (
        <div
          className="animate-lightning absolute inset-0"
          style={{ background: "linear-gradient(180deg,#ffffff 0%,rgba(255,255,255,0.2) 60%,transparent)" }}
        />
      )}

      {/* Wet glass droplets for heavy rain */}
      {wet && (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0 2px, transparent 3px), radial-gradient(circle at 68% 18%, rgba(255,255,255,0.3) 0 3px, transparent 4px), radial-gradient(circle at 45% 62%, rgba(255,255,255,0.28) 0 2px, transparent 3px), radial-gradient(circle at 82% 74%, rgba(255,255,255,0.24) 0 4px, transparent 5px)",
            backgroundSize: "180px 220px",
            filter: "blur(0.4px)",
          }}
        />
      )}

      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(180deg, transparent, var(--background))" }}
      />
    </div>
  );
}
