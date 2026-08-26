import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/weatherly-logo.png";
import { PlaceSearch } from "@/components/weather/PlaceSearch";
import { reverseLookup, type Place } from "@/lib/weather";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live rain radar map — Weatherly" },
      {
        name: "description",
        content:
          "Track rain, storms and cloud movement on a live animated radar map for any city in the world.",
      },
      { property: "og:title", content: "Live rain radar map — Weatherly" },
      {
        property: "og:description",
        content: "Animated rain radar and cloud movement for any location worldwide.",
      },
    ],
  }),
  component: MapPage,
});

const DEFAULT: Place = {
  id: 0,
  name: "Delhi",
  country: "India",
  latitude: 28.65,
  longitude: 77.23,
};

function MapPage() {
  const [place, setPlace] = useState<Place>(DEFAULT);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPlace(await reverseLookup(pos.coords.latitude, pos.coords.longitude));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  return (
    <main className="relative min-h-screen">
      <div className="aurora-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
      <div className="relative mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Weatherly logo" width={36} height={36} className="h-9 w-9" loading="lazy" />
            <span className="font-display text-lg">Weatherly</span>
          </Link>
          <Link to="/" className="glass rounded-full px-3 py-1.5 text-xs">
            ← Forecast
          </Link>
        </div>

        <h1 className="font-display text-2xl">Live rain radar</h1>
        <PlaceSearch onPick={setPlace} onLocate={locate} locating={locating} />

        <div className="glass overflow-hidden rounded-[1.75rem] p-2">
          <iframe
            key={`${place.latitude}-${place.longitude}`}
            title={`Rain radar for ${place.name}`}
            src={`https://embed.windy.com/embed2.html?lat=${place.latitude}&lon=${place.longitude}&zoom=6&level=surface&overlay=radar&menu=&message=true&marker=true&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
            className="h-[70vh] w-full rounded-[1.5rem]"
          />
        </div>
      </div>
    </main>
  );
}
