import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/weatherly-logo.png";
import {
  fetchWeather,
  placeLabel,
  placeSlug,
  reverseLookup,
  type Place,
} from "@/lib/weather";
import { codeToKind, sunProgress } from "@/lib/weather-logic";
import { PlaceSearch } from "./PlaceSearch";
import { SiteFooter } from "./SiteFooter";
import { AboutBlurb } from "./AboutBlurb";
import { SkyStage } from "./SkyStage";
import {
  AirComfort,
  CurrentSummary,
  DailyList,
  DecisionCard,
  HourlyStrip,
  RadarCard,
  SunPath,
  Timeline,
} from "./sections";

const FALLBACK: Place = {
  id: 1273294,
  name: "Delhi",
  admin1: "Delhi",
  country: "India",
  latitude: 28.6519,
  longitude: 77.2315,
};

const STORE_KEY = "weatherly:favourites";
const LAST_KEY = "weatherly:last";

export function WeatherView({ initialPlace }: { initialPlace?: Place }) {
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(initialPlace ?? null);
  const [favourites, setFavourites] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]") as Place[];
      setFavourites(Array.isArray(favs) ? favs : []);
      if (!initialPlace) {
        const last = localStorage.getItem(LAST_KEY);
        setPlace(last ? (JSON.parse(last) as Place) : FALLBACK);
      }
    } catch {
      if (!initialPlace) setPlace(FALLBACK);
    }
  }, [initialPlace]);

  useEffect(() => {
    if (place && !initialPlace) {
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify(place));
      } catch {
        /* ignore */
      }
    }
  }, [place, initialPlace]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await reverseLookup(pos.coords.latitude, pos.coords.longitude);
        setPlace(p);
        setLocating(false);
        if (initialPlace) navigate({ to: "/city/$slug", params: { slug: placeSlug(p) } });
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, [initialPlace, navigate]);

  const toggleFavourite = () => {
    if (!place) return;
    setFavourites((prev) => {
      const exists = prev.some((p) => placeSlug(p) === placeSlug(place));
      const next = exists ? prev.filter((p) => placeSlug(p) !== placeSlug(place)) : [...prev, place];
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["weather", place?.latitude, place?.longitude],
    queryFn: () => fetchWeather(place as Place),
    enabled: Boolean(place),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const kind = data ? codeToKind(data.current.weatherCode) : "clear";
  const phase = data ? sunProgress(data).phase : "noon";
  const isFav = place ? favourites.some((p) => placeSlug(p) === placeSlug(place)) : false;

  return (
    <main className="relative min-h-screen">
      {/* Hero: living sky */}
      <div className="relative min-h-[420px] w-full overflow-hidden pb-16">
        <SkyStage
          kind={kind}
          phase={phase}
          intensity={data?.current.precipitation ?? 0}
          wind={data?.current.windSpeed ?? 8}
          cloudCover={data?.current.cloudCover ?? 20}
          isDay={data?.current.isDay ?? true}
        />

        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-10 pt-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Weatherly logo" width={36} height={36} className="h-9 w-9" />
              <span className="font-display text-lg tracking-tight">Weatherly</span>
            </Link>
            <Link
              to="/map"
              className="glass rounded-full px-3 py-1.5 text-xs text-foreground/90"
              aria-label="Open the rain radar map"
            >
              Radar map
            </Link>
          </div>

          <PlaceSearch
            onPick={(p) => {
              setPlace(p);
              if (initialPlace) navigate({ to: "/city/$slug", params: { slug: placeSlug(p) } });
            }}
            onLocate={locate}
            locating={locating}
          />

          {favourites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favourites.map((f) => (
                <button
                  key={placeSlug(f)}
                  type="button"
                  onClick={() => setPlace(f)}
                  className="glass rounded-full px-3 py-1 text-xs"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-display text-xl">📍 {place ? placeLabel(place) : "Locating…"}</h1>
              <button
                type="button"
                onClick={toggleFavourite}
                aria-label={isFav ? "Remove from favourites" : "Save this city"}
                className="text-sm opacity-80 transition-opacity hover:opacity-100"
              >
                {isFav ? "★" : "☆"}
              </button>
            </div>

            {isLoading && <p className="mt-8 text-sm text-muted-foreground">Reading the sky…</p>}
            {isError && (
              <div className="mt-8">
                <p className="text-sm text-muted-foreground">Couldn't reach the weather service.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                >
                  Try again
                </button>
              </div>
            )}
            {data && <div className="mt-4">{<CurrentSummary bundle={data} />}</div>}
          </div>
        </div>
      </div>

      {data && (
        <div className="relative mx-auto -mt-14 w-full max-w-2xl space-y-4 px-4 pb-16">
          <DecisionCard bundle={data} />
          <Timeline bundle={data} />
          <HourlyStrip bundle={data} />
          <RadarCard bundle={data} />
          <AirComfort bundle={data} />
          <SunPath bundle={data} />
          <DailyList bundle={data} />
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Live data from Open-Meteo (ICON · GFS · ECMWF blend) — refreshed every 5 minutes.
          </p>
        </div>
      )}

      <AboutBlurb />
      <SiteFooter />
    </main>
  );
}
