import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/weather/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Weatherly" },
      {
        name: "description",
        content:
          "How Weatherly uses your GPS or IP-based location to show local weather, what is stored in your browser, and which third-party services receive data.",
      },
      { property: "og:title", content: "Privacy Policy — Weatherly" },
      {
        property: "og:description",
        content: "How Weatherly handles location data, browser storage and third-party services.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy">
      <p className="text-xs text-muted-foreground">Last updated: 28 August 2026</p>

      <h2 className="font-display text-base text-foreground">Location data</h2>
      <p>
        Weatherly uses your location data — either your device GPS coordinates or your approximate
        location derived from your IP address — for one purpose only: to show you the weather
        forecast for where you are. GPS is used only if you tap “Use my location” and approve your
        browser’s permission prompt. You can refuse or revoke that permission at any time in your
        browser settings and keep using the site by searching for a city by name.
      </p>
      <p>
        Your coordinates are sent to our weather data providers (Open-Meteo for forecast and air
        quality data, BigDataCloud for turning coordinates into a place name) so they can return the
        forecast for that point. We do not sell, rent or publish your location, and we do not build
        advertising profiles from it.
      </p>

      <h2 className="font-display text-base text-foreground">What we store</h2>
      <p>
        We do not run user accounts and we do not operate our own tracking database. Your last
        viewed city and your saved favourite cities are stored locally in your own browser
        (localStorage) so the site remembers them on your next visit. Clearing your browser data
        removes them permanently.
      </p>

      <h2 className="font-display text-base text-foreground">Third-party services</h2>
      <p>
        The radar map is embedded from Windy.com and Google Fonts serves our typefaces; like any
        embedded resource, these providers receive your IP address and standard request data under
        their own privacy policies. Our hosting provider keeps ordinary server logs for security and
        reliability.
      </p>

      <h2 className="font-display text-base text-foreground">Children and contact</h2>
      <p>
        Weatherly is not directed at children under 13. For any privacy question or a request to
        delete data, email{" "}
        <a className="underline" href="mailto:support@weatherly.app">
          support@weatherly.app
        </a>
        .
      </p>
    </PageShell>
  );
}
