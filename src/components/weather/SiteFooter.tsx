import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative mx-auto w-full max-w-2xl px-4 pb-10 pt-4 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <Link to="/map" className="hover:text-foreground">
          Radar map
        </Link>
        <Link to="/about" className="hover:text-foreground">
          About us
        </Link>
        <Link to="/contact" className="hover:text-foreground">
          Contact
        </Link>
        <Link to="/privacy" className="hover:text-foreground">
          Privacy policy
        </Link>
        <Link to="/terms" className="hover:text-foreground">
          Terms &amp; disclaimer
        </Link>
      </nav>
      <p className="mt-4 text-xs text-muted-foreground">
        Weather data is for informational purposes only. We do not guarantee 100% accuracy of
        meteorological conditions.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Weatherly · Forecast data by Open-Meteo
      </p>
    </footer>
  );
}
