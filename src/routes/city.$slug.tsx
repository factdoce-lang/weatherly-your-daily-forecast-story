import { createFileRoute, notFound } from "@tanstack/react-router";
import { WeatherView } from "@/components/weather/WeatherView";
import { placeFromSlug, placeLabel } from "@/lib/weather";

export const Route = createFileRoute("/city/$slug")({
  loader: ({ params }) => {
    const place = placeFromSlug(params.slug);
    if (!place) throw notFound();
    return { place };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "City not found — Weatherly" }, { name: "robots", content: "noindex" }],
      };
    }
    const label = placeLabel(loaderData.place);
    const title = `${label} weather — Weatherly`;
    const description = `Live temperature, rain timing, air quality and a plain-language forecast for ${label}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CityPage,
});

function CityPage() {
  const { place } = Route.useLoaderData();
  return <WeatherView initialPlace={place} />;
}
