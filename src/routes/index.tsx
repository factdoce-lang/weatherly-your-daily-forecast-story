import { createFileRoute } from "@tanstack/react-router";
import { WeatherView } from "@/components/weather/WeatherView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weatherly — weather that tells you what to do" },
      {
        name: "description",
        content:
          "Live, accurate weather for every country, state and city — with a plain-language decision card, animated weather timeline and forecast confidence.",
      },
      { property: "og:title", content: "Weatherly — weather that tells you what to do" },
      {
        property: "og:description",
        content:
          "Live weather worldwide with a decision card, animated sky and honest forecast confidence.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <WeatherView />;
}
