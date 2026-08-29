import { Link } from "@tanstack/react-router";

export function AboutBlurb() {
  return (
    <section className="relative mx-auto w-full max-w-2xl px-4 pb-6">
      <div className="glass rounded-2xl p-5 text-sm leading-relaxed text-foreground/80">
        <h2 className="font-display mb-2 text-base text-foreground">
          Welcome to Weatherly — live weather for every city in the world
        </h2>
        <p>
          Weatherly is a free, browser-based weather service and your trusted source for daily
          temperature checks, humidity tracking, wind readings and accurate local weather forecasts.
          Search any country, state or city — from Delhi and Mumbai to London, New York or a small
          town you have never heard of — and you get the current temperature, how it actually feels
          on your skin, relative humidity, wind speed and gusts, pressure, visibility, UV index and
          air quality, plus a full 7-day outlook with daily highs, lows and rain chances.
        </p>
        <p className="mt-3">
          The numbers come from Open-Meteo, which blends the output of national weather-service
          models such as ICON, GFS and ECMWF and updates continuously. Weatherly refreshes the data
          roughly every five minutes while your page is open, so what you read is the latest
          available run for the grid point nearest to you, in your own local time zone.
        </p>
        <p className="mt-3">
          What makes Weatherly different is that it explains the weather instead of only reporting
          it. The decision card answers the question you actually have — should I carry an umbrella,
          is it a good hour for a walk, will the laundry dry — in plain language. The weather
          timeline turns the next 24 hours into short events like “rain starts around 4:15 PM,
          clearing by 6 PM”, and the confidence meter tells you honestly how much the forecast
          models agree with each other.
        </p>
        <p className="mt-3">
          There is nothing to install: no app, no APK, no browser extension and no sign-up. Weatherly
          runs directly in your mobile or desktop browser and is built to load in a couple of
          seconds on a phone connection. Read more{" "}
          <Link to="/about" className="underline">
            about us
          </Link>
          , or check the{" "}
          <Link to="/map" className="underline">
            live rain radar map
          </Link>
          . Forecasts are informational — for storm and cyclone warnings, always follow your
          official national meteorological agency.
        </p>
      </div>
    </section>
  );
}
