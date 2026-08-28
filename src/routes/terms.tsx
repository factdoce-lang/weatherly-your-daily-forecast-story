import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/weather/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions and Weather Disclaimer — Weatherly" },
      {
        name: "description",
        content:
          "Terms of use for Weatherly, including our weather disclaimer: forecast data is informational and accuracy is not guaranteed.",
      },
      { property: "og:title", content: "Terms & Conditions and Weather Disclaimer — Weatherly" },
      {
        property: "og:description",
        content: "Terms of use and the weather accuracy disclaimer for Weatherly.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell title="Terms & Conditions">
      <p className="text-xs text-muted-foreground">Last updated: 28 August 2026</p>

      <h2 className="font-display text-base text-foreground">Weather disclaimer</h2>
      <p className="text-foreground">
        Weather data is for informational purposes only. We do not guarantee 100% accuracy of
        meteorological conditions.
      </p>
      <p>
        Forecasts are produced by numerical weather models and can change or be wrong. Never rely on
        Weatherly alone for decisions involving safety of life or property — aviation, marine
        activity, mountaineering, farming operations or severe-weather response. Always follow your
        official national meteorological agency and local authorities.
      </p>

      <h2 className="font-display text-base text-foreground">Using the site</h2>
      <p>
        Weatherly is provided free of charge, “as is”, without warranties of any kind. You agree not
        to scrape, overload or attempt to disrupt the service, and not to reuse our content in a way
        that misrepresents it as an official weather warning.
      </p>

      <h2 className="font-display text-base text-foreground">Liability</h2>
      <p>
        To the maximum extent permitted by law, Weatherly and its operators are not liable for any
        loss or damage arising from use of, or reliance on, the information on this site. Service
        availability may be interrupted without notice.
      </p>

      <h2 className="font-display text-base text-foreground">Data sources and changes</h2>
      <p>
        Forecast and air-quality data come from Open-Meteo and the public models it aggregates; the
        radar map is embedded from Windy.com. We may update these terms at any time, and continued
        use of the site means you accept the current version. Questions:{" "}
        <a className="underline" href="mailto:support@weatherly.app">
          support@weatherly.app
        </a>
        .
      </p>
    </PageShell>
  );
}
