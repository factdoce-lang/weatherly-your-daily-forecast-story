import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/weather/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Weatherly — how our forecasts work" },
      {
        name: "description",
        content:
          "Weatherly turns raw meteorological model data into plain-language advice. Learn where our weather data comes from and how often it refreshes.",
      },
      { property: "og:title", content: "About Weatherly — how our forecasts work" },
      {
        property: "og:description",
        content: "Where Weatherly's weather data comes from and how our forecasts are built.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell title="About us">
      <p>
        Weatherly is a free, browser-based weather service for every country, state and city in the
        world. We pull live observations and forecast model output from Open-Meteo, which blends
        national weather-service models such as ICON (Germany), GFS (USA) and ECMWF (Europe), and we
        refresh the data every few minutes while the page is open.
      </p>
      <p>
        Our brand idea is simple: a forecast should tell you what to do, not just what the numbers
        are. So alongside temperature, humidity, wind and the 7-day outlook, Weatherly shows a
        plain-language decision card, a minute-level rain timeline and an honest confidence score so
        you know how much to trust the forecast.
      </p>
      <p>
        There is nothing to install and no account to create — open the site in any browser on
        mobile or desktop and the weather is there.
      </p>
    </PageShell>
  );
}
