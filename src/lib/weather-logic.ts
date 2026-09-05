// Pure logic: condition mapping, sky phase, decision card, timeline, confidence.

import type { WeatherBundle } from "./weather";

export type SkyKind =
  | "clear"
  | "cloudy"
  | "overcast"
  | "fog"
  | "rain"
  | "heavy-rain"
  | "thunder"
  | "snow";

export function codeToKind(code: number): SkyKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunder";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([65, 67, 82].includes(code)) return "heavy-rain";
  if (code >= 51) return "rain";
  return "cloudy";
}

export function codeLabel(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  };
  return map[code] ?? "Unsettled";
}

export function kindGlyph(kind: SkyKind, isDay = true): string {
  switch (kind) {
    case "clear":
      return isDay ? "☀️" : "🌙";
    case "cloudy":
      return isDay ? "🌤️" : "☁️";
    case "overcast":
      return "☁️";
    case "fog":
      return "🌫️";
    case "rain":
      return "🌧️";
    case "heavy-rain":
      return "🌧️";
    case "thunder":
      return "⛈️";
    case "snow":
      return "❄️";
  }
}

/** Local "now" in the city's timezone, as a Date shifted for display math. */
export function cityNow(bundle: WeatherBundle) {
  const nowUtcMs = Date.now();
  return new Date(nowUtcMs + bundle.utcOffsetSeconds * 1000);
}

function localIsoHour(d: Date) {
  return d.toISOString().slice(0, 13);
}

export function currentHourIndex(bundle: WeatherBundle) {
  const key = localIsoHour(cityNow(bundle));
  const idx = bundle.hourly.findIndex((h) => h.time.slice(0, 13) === key);
  return idx === -1 ? 0 : idx;
}

export function fmtTime(iso: string) {
  const time = iso.split("T")[1] ?? "00:00";
  const [hStr, mStr] = time.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

/** Sub-hour interpolated time label for an event between two hourly samples. */
function interpolatedLabel(iso: string, fraction: number) {
  const date = iso.split("T")[0] ?? "";
  const time = iso.split("T")[1] ?? "00:00";
  const [hStr] = time.split(":");
  const minutes = Math.round(fraction * 60);
  const total = Number(hStr) * 60 + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return fmtTime(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

export type SkyPhase =
  | "night"
  | "dawn"
  | "morning"
  | "noon"
  | "afternoon"
  | "dusk"
  | "twilight";

export function sunProgress(bundle: WeatherBundle) {
  const today = bundle.daily[0]!;
  const now = cityNow(bundle);
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const toMin = (iso: string) => {
    const t = iso.split("T")[1] ?? "06:00";
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const rise = toMin(today.sunrise);
  const set = toMin(today.sunset);
  const dayLength = Math.max(set - rise, 1);
  const progress = (nowMin - rise) / dayLength; // <0 before sunrise, >1 after sunset

  let phase: SkyPhase = "night";
  if (progress < -0.06) phase = nowMin > set ? "night" : "night";
  else if (progress < 0.06) phase = "dawn";
  else if (progress < 0.35) phase = "morning";
  else if (progress < 0.6) phase = "noon";
  else if (progress < 0.92) phase = "afternoon";
  else if (progress < 1.02) phase = "dusk";
  else if (progress < 1.12) phase = "twilight";

  return {
    progress: Math.min(Math.max(progress, -0.15), 1.15),
    phase,
    sunrise: fmtTime(today.sunrise),
    sunset: fmtTime(today.sunset),
    dayLengthMinutes: dayLength,
  };
}

export type PrecipWindow = {
  startIso: string;
  startFraction: number;
  endIso: string;
  endFraction: number;
  peakIso: string;
  peakMm: number;
  label: string;
  startsInMinutes: number;
};

type PrecipSample = {
  time: string;
  /** mm per hour */
  rate: number;
  probability: number;
  stepMinutes: number;
};

function nowKey(bundle: WeatherBundle) {
  return cityNow(bundle).toISOString().slice(0, 16);
}

function minutesBetween(fromKey: string, iso: string) {
  const toMs = (s: string) => Date.parse(`${s.slice(0, 16)}:00Z`);
  return Math.round((toMs(iso) - toMs(fromKey)) / 60000);
}

/**
 * Highest-resolution precipitation series available: 15-minute nowcast
 * (radar-assisted where Open-Meteo has coverage) for the next hours, then the
 * hourly model for the rest of the day.
 */
export function precipSeries(bundle: WeatherBundle): PrecipSample[] {
  const key = nowKey(bundle);
  const out: PrecipSample[] = [];

  for (const m of bundle.minutely ?? []) {
    const delta = minutesBetween(key, m.time);
    if (delta < -15 || delta > 12 * 60) continue;
    out.push({
      time: m.time,
      rate: (m.precipitation ?? 0) * 4, // 15-min accumulation → mm/h
      probability: m.precipProbability ?? 0,
      stepMinutes: 15,
    });
  }

  const lastMinutely = out.length ? minutesBetween(key, out[out.length - 1]!.time) : -Infinity;
  for (const h of bundle.hourly) {
    const delta = minutesBetween(key, h.time);
    if (delta <= lastMinutely || delta < -30 || delta > 24 * 60) continue;
    out.push({
      time: h.time,
      rate: h.precipitation ?? 0,
      probability: h.precipProbability ?? 0,
      stepMinutes: 60,
    });
  }

  return out;
}

/** Is it actually raining/snowing right now? */
export function rainingNow(bundle: WeatherBundle): boolean {
  const kind = codeToKind(bundle.current.weatherCode);
  if (["rain", "heavy-rain", "thunder", "snow"].includes(kind)) return true;
  if ((bundle.current.precipitation ?? 0) >= 0.05) return true;
  const first = precipSeries(bundle)[0];
  return Boolean(first && (first.rate >= 0.2 || first.probability >= 60));
}

/** Find the next rain window within the next 24 hours. */
export function nextPrecipWindow(bundle: WeatherBundle): PrecipWindow | null {
  const series = precipSeries(bundle);
  if (!series.length) return null;
  const key = nowKey(bundle);

  const wet = (s?: PrecipSample) => Boolean(s && (s.rate >= 0.08 || s.probability >= 40));

  let s = series.findIndex((x) => wet(x));
  if (s === -1) return null;

  let e = s;
  while (e + 1 < series.length && wet(series[e + 1])) e++;

  let peak = s;
  for (let i = s; i <= e; i++) if (series[i]!.rate > series[peak]!.rate) peak = i;

  const endSample = series[e]!;
  const endIsoWithStep = endSample.time;

  return {
    startIso: series[s]!.time,
    startFraction: 0,
    endIso: endIsoWithStep,
    endFraction: Math.min(endSample.stepMinutes / 60, 1),
    peakIso: series[peak]!.time,
    peakMm: series[peak]!.rate,
    startsInMinutes: Math.max(minutesBetween(key, series[s]!.time), 0),
    label: `${fmtTime(series[s]!.time)} – ${interpolatedLabel(endIsoWithStep, Math.min(endSample.stepMinutes / 60, 1))}`,
  };
}


export type Decision = {
  glyph: string;
  headline: string;
  detail: string;
  bullets: string[];
  tone: "wet" | "good" | "hot" | "cold" | "air" | "wind";
};

export function buildDecision(bundle: WeatherBundle): Decision {
  const c = bundle.current;
  const win = nextPrecipWindow(bundle);
  const aqi = bundle.air?.aqi ?? 0;
  const bullets: string[] = [
    `Feels like ${Math.round(c.apparent)}°C`,
    `${windWord(c.windSpeed)} wind • ${Math.round(c.windSpeed)} km/h`,
    `UV ${uvWord(c.uv)}`,
  ];

  if (win && win.peakMm >= 4) {
    return {
      glyph: "⛈️",
      headline: "Take shelter plans — heavy rain incoming",
      detail: `Peak downpour around ${fmtTime(win.peakIso)}, wet spell ${win.label}.`,
      bullets,
      tone: "wet",
    };
  }
  if (win) {
    const soon = win.startIso.slice(11, 13);
    return {
      glyph: "☔",
      headline:
        Number(soon) - cityNow(bundle).getUTCHours() <= 1
          ? "Carry an umbrella — rain starting shortly"
          : `You probably won't need an umbrella until ${interpolatedLabel(
              win.startIso,
              win.startFraction,
            )}`,
      detail: `Rain likely ${win.label}.`,
      bullets,
      tone: "wet",
    };
  }
  if (aqi >= 100) {
    return {
      glyph: "😷",
      headline: "Mask up if you're out for long",
      detail: `Air quality index ${aqi} — sensitive groups should limit outdoor effort.`,
      bullets,
      tone: "air",
    };
  }
  if (c.apparent >= 38) {
    return {
      glyph: "🥵",
      headline: "Stay in the shade — heat stress risk",
      detail: `It feels like ${Math.round(c.apparent)}°C. Hydrate and avoid 12–4 PM sun.`,
      bullets,
      tone: "hot",
    };
  }
  if (c.apparent <= 2) {
    return {
      glyph: "🧤",
      headline: "Layer up before you head out",
      detail: `Feels like ${Math.round(c.apparent)}°C with ${Math.round(c.windSpeed)} km/h wind chill.`,
      bullets,
      tone: "cold",
    };
  }
  if (c.windGusts >= 45) {
    return {
      glyph: "🌬️",
      headline: "Windy — secure loose things outside",
      detail: `Gusts up to ${Math.round(c.windGusts)} km/h expected.`,
      bullets,
      tone: "wind",
    };
  }
  return {
    glyph: c.isDay ? "🕶️" : "🌙",
    headline: c.isDay ? "Great time to go outside" : "Calm evening out there",
    detail: "No rain expected in the next 24 hours.",
    bullets,
    tone: "good",
  };
}

export function windWord(kmh: number) {
  if (kmh < 6) return "Calm";
  if (kmh < 15) return "Light";
  if (kmh < 30) return "Moderate";
  if (kmh < 50) return "Strong";
  return "Gale";
}

export function uvWord(uv: number) {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "very high";
  return "extreme";
}

export function aqiWord(aqi: number) {
  if (aqi <= 20) return "Excellent";
  if (aqi <= 40) return "Good";
  if (aqi <= 60) return "Fair";
  if (aqi <= 80) return "Poor";
  if (aqi <= 100) return "Very poor";
  return "Hazardous";
}

export type TimelineEvent = {
  at: string; // label
  glyph: string;
  title: string;
  note?: string;
  isNow?: boolean;
};

export function buildTimeline(bundle: WeatherBundle): TimelineEvent[] {
  const start = currentHourIndex(bundle);
  const slice = bundle.hourly.slice(start, start + 19);
  if (!slice.length) return [];

  const events: TimelineEvent[] = [
    {
      at: "NOW",
      glyph: kindGlyph(codeToKind(bundle.current.weatherCode), bundle.current.isDay),
      title: `${Math.round(bundle.current.temperature)}° ${codeLabel(bundle.current.weatherCode)}`,
      note: `Feels like ${Math.round(bundle.current.apparent)}°`,
      isNow: true,
    },
  ];

  const win = nextPrecipWindow(bundle);
  if (win) {
    events.push({
      at: interpolatedLabel(win.startIso, win.startFraction),
      glyph: "🌧️",
      title: "Rain begins",
      note: `${win.peakMm >= 4 ? "Heavy" : "Light to moderate"} spell starting`,
    });
    if (win.peakIso !== win.startIso) {
      events.push({
        at: fmtTime(win.peakIso),
        glyph: win.peakMm >= 4 ? "⛈️" : "🌧️",
        title: win.peakMm >= 4 ? "Heavy rain peak" : "Rain peak",
        note: `${win.peakMm.toFixed(1)} mm/h`,
      });
    }
    events.push({
      at: interpolatedLabel(win.endIso, win.endFraction),
      glyph: "🌤️",
      title: "Rain ends",
      note: "Skies begin to clear",
    });
  }

  // Cloud arrival / clearing (only when no rain dominates the story)
  let prevKind = codeToKind(bundle.current.weatherCode);
  for (let i = 1; i < slice.length && events.length < 7; i++) {
    const kind = codeToKind(slice[i]!.weatherCode);
    if (kind === prevKind) continue;
    if (kind === "rain" || kind === "heavy-rain" || kind === "thunder") {
      prevKind = kind;
      continue; // already covered by the precip window
    }
    const title =
      kind === "clear"
        ? "Skies clear up"
        : kind === "fog"
          ? "Fog settles in"
          : kind === "overcast"
            ? "Overcast moves in"
            : "Clouds arriving";
    events.push({
      at: fmtTime(slice[i]!.time),
      glyph: kindGlyph(kind, slice[i]!.isDay),
      title,
      note: `${Math.round(slice[i]!.temperature)}° • ${slice[i]!.cloudCover}% cloud`,
    });
    prevKind = kind;
  }

  // Sun events
  const today = bundle.daily[0]!;
  const nowMinutes = cityNow(bundle).getUTCHours() * 60 + cityNow(bundle).getUTCMinutes();
  const minutesOf = (iso: string) => {
    const [h, m] = (iso.split("T")[1] ?? "00:00").split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  if (minutesOf(today.sunset) > nowMinutes) {
    events.push({
      at: fmtTime(today.sunset),
      glyph: "🌅",
      title: "Sunset",
      note: "Golden hour, then twilight",
    });
  }
  if (minutesOf(today.sunrise) > nowMinutes) {
    events.push({
      at: fmtTime(today.sunrise),
      glyph: "🌄",
      title: "Sunrise",
      note: "Day begins",
    });
  }

  const order = (e: TimelineEvent) => {
    if (e.isNow) return -1;
    const m = e.at.match(/^(\d+):(\d+)\s(AM|PM)$/);
    if (!m) return 9999;
    let h = Number(m[1]!) % 12;
    if (m[3]! === "PM") h += 12;
    let mins = h * 60 + Number(m[2]!);
    if (mins < nowMinutes) mins += 24 * 60;
    return mins;
  };
  return events.sort((a, b) => order(a) - order(b)).slice(0, 7);
}

export type Confidence = { value: number; tone: "high" | "medium" | "low"; note: string };

/**
 * Confidence from forecast lead time + how much the hourly signal disagrees with
 * itself (probability sitting mid-range and precipitation flip-flopping are the
 * classic markers of an uncertain forecast).
 */
export function buildConfidence(bundle: WeatherBundle, leadHours = 12): Confidence {
  const start = currentHourIndex(bundle);
  const slice = bundle.hourly.slice(start, start + leadHours);
  if (!slice.length) return { value: 70, tone: "medium", note: "Limited data for this area." };

  // Ambiguity: probabilities near 50% are the least decisive.
  const ambiguity =
    slice.reduce((acc, h) => acc + (1 - Math.abs(h.precipProbability - 50) / 50), 0) / slice.length;

  // Volatility: how often the condition family flips hour to hour.
  let flips = 0;
  for (let i = 1; i < slice.length; i++) {
    if (codeToKind(slice[i]!.weatherCode) !== codeToKind(slice[i - 1]!.weatherCode)) flips++;
  }
  const volatility = flips / Math.max(slice.length - 1, 1);

  const lead = Math.min(leadHours / 168, 1);
  const raw = 100 - ambiguity * 34 - volatility * 22 - lead * 12;
  const value = Math.round(Math.min(97, Math.max(38, raw)));

  const tone = value >= 80 ? "high" : value >= 60 ? "medium" : "low";
  const note =
    tone === "high"
      ? "Models agree closely for this window."
      : tone === "medium"
        ? "Rain timing may shift by 30–60 minutes."
        : "Models disagree — treat timings as rough.";
  return { value, tone, note };
}
