# Weatherly — a weather app that explains, not just reports

## Data (no setup needed from you)
- Live weather from **Open-Meteo** — free, keyless, and highly accurate (it blends national met models: ICON, GFS, ECMWF; the same class of data Google Weather uses). Works worldwide.
- **Global search for any country / state / city** via Open-Meteo Geocoding (200k+ places, admin1/country shown to disambiguate "Springfield").
- Auto-locate on first visit (browser geolocation, with graceful fallback to a searched city).
- Pulled per city: current conditions, minute/hourly precipitation, 7-day forecast, sunrise/sunset, UV, wind, humidity, pressure, visibility, plus **air quality (AQI, PM2.5, PM10, O3)** from the Open-Meteo air-quality endpoint.
- Rain radar: animated precipitation-tile overlay on a map for the selected city.

## The screen, top to bottom
1. **Location bar** — searchable city/state/country picker, saved favourites, current temperature.
2. **Hero: living sky** — a full-bleed animated sky driven by real data, not decoration (details below).
3. **"What Should I Do?" decision card** — one plain-language verdict:
   - "Carry an umbrella — rain likely 4:20 PM – 6:10 PM", "Great time to go outside", "Stay in, heat stress risk", "Mask up — AQI 168".
   - Derived from real rules over precipitation windows, apparent temperature, wind gusts, UV and AQI, so it is always consistent with the numbers.
4. **Weather Timeline** — the day as a vertical animated story: `NOW ☀️ 31°` → `2:40 PM clouds arriving` → `4:15 PM rain begins` → `5:30 PM heavy peak` → `7:10 PM rain ends`. Events are detected from hourly data (condition changes, precip onset/peak/end, sunrise/sunset), not a fixed hour list.
5. **Confidence meter** — a percentage + colour per forecast, computed from model spread and forecast lead time, with an honest note like "Rain timing may shift ±40 min".
6. **Hourly strip** — compact, scrollable, temperature curve with rain bars.
7. **Rain radar map**.
8. **Air & comfort** — AQI, UV, wind, humidity as four calm tiles (no wall of numbers).
9. **Tomorrow • 7 days • Sun path** — a live sun-orbit arc showing sunrise → noon → sunset → twilight → night with the sun at its true current position.

Deliberately excluded: pressure/dew-point dumps on the home screen (available on a details sheet), fake decimal precision, duplicate metric tiles.

## Animations (data-driven, all of them)
- **Sun**: light rays whose angle follows real solar position; intensity follows cloud cover.
- **Rain**: particle density, speed and streak length scale with actual mm/h; heavy rain adds a wet-glass droplet layer over the hero.
- **Thunderstorm**: drifting cloud layers, occasional lightning flash timed to storm probability.
- **Fog**: slow-moving translucent fog band when visibility is low.
- **Wind**: cloud drift speed = real wind speed; gusts nudge the clouds.
- **Snow**: drifting flakes when precipitation type is snow.
- **Timeline**: events reveal on scroll; the "NOW" marker advances in real time.
- Respects `prefers-reduced-motion` (static gradient sky instead).

## Look and feel
Deep atmospheric "sky glass" theme, distinct from every mainstream weather app: near-black indigo base, colour that **shifts with the actual sky** — dawn peach, noon cyan, dusk violet, night deep blue — with frosted glass cards, soft aurora glow, tight geometric numerals for temperature and a warm humanist face for the explanations. No purple-on-white gradient template, no stock weather icons: custom-drawn SVG condition marks.

## Logo
Custom **Weatherly** mark generated as an asset: a minimal sun-arc-over-droplet glyph in the theme's cyan-to-violet gradient, used as favicon, header lockup and social preview.

## Technical notes
- Routes: `/` (home for the active city), `/city/$slug` (shareable per-city page), `/map` (radar), each with its own SEO metadata.
- Fetches go through TanStack Start server functions so calls are cached server-side and rate-limited safely; TanStack Query handles caching, refresh every 10 minutes and background revalidation.
- Decision-card rules, timeline event detection and confidence scoring live in pure, unit-testable modules.
- Favourites and last city stored locally in the browser (no login needed).
- Animations in CSS/canvas, tuned for mobile at 60fps; mobile-first layout since the current viewport is a phone.
