// Live weather data via Open-Meteo (keyless, worldwide, blends ICON/GFS/ECMWF).

export type Place = {
  id: number;
  name: string;
  admin1?: string | undefined;
  country?: string | undefined;
  country_code?: string | undefined;
  latitude: number;
  longitude: number;
  timezone?: string | undefined;
};

export type WeatherBundle = {
  place: Place;
  current: {
    time: string;
    temperature: number;
    apparent: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    cloudCover: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    isDay: boolean;
    uv: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    apparent: number;
    precipitation: number;
    precipProbability: number;
    weatherCode: number;
    cloudCover: number;
    windSpeed: number;
    uv: number;
    isDay: boolean;
  }>;
  minutely: Array<{
    time: string;
    precipitation: number;
    precipProbability: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    max: number;
    min: number;
    weatherCode: number;
    precipitationSum: number;
    precipProbability: number;
    sunrise: string;
    sunset: string;
    uvMax: number;
    windMax: number;
  }>;

  air?:
    | {
        aqi: number;
        pm25: number;
        pm10: number;
        ozone: number;
      }
    | undefined;
  timezone: string;
  utcOffsetSeconds: number;
};

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const url = `${GEO}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: Place[] };
  return json.results ?? [];
}

export async function reverseLookup(lat: number, lon: number): Promise<Place> {
  // Open-Meteo has no reverse endpoint; the forecast response carries the timezone,
  // so we build a place from coordinates and enrich the label when possible.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    if (res.ok) {
      const j = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
        countryCode?: string;
      };
      return {
        id: Math.round(lat * 1000 + lon * 1000),
        name: j.city || j.locality || "My location",
        admin1: j.principalSubdivision,
        country: j.countryName,
        country_code: j.countryCode,
        latitude: lat,
        longitude: lon,
      };
    }
  } catch {
    /* fall through */
  }
  return {
    id: Math.round(lat * 1000 + lon * 1000),
    name: "My location",
    latitude: lat,
    longitude: lon,
  };
}

export async function fetchWeather(place: Place): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: "auto",
    forecast_days: "7",
    models: "best_match",
    cell_selection: "nearest",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    temperature_unit: "celsius",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,visibility,is_day,uv_index",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,uv_index,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max",
  });

  const airParams = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: "auto",
    current: "european_aqi,pm2_5,pm10,ozone",
  });

  const [wRes, aRes] = await Promise.all([
    fetch(`${FORECAST}?${params.toString()}`),
    fetch(`${AIR}?${airParams.toString()}`).catch(() => null as unknown as Response),
  ]);

  if (!wRes.ok) throw new Error("Weather service unavailable");
  const w = (await wRes.json()) as any;

  let air: WeatherBundle["air"];
  if (aRes && aRes.ok) {
    const a = (await aRes.json()) as any;
    if (a?.current) {
      air = {
        aqi: Math.round(a.current.european_aqi ?? 0),
        pm25: a.current.pm2_5 ?? 0,
        pm10: a.current.pm10 ?? 0,
        ozone: a.current.ozone ?? 0,
      };
    }
  }

  const hourly = (w.hourly.time as string[]).map((time, i) => ({
    time,
    temperature: w.hourly.temperature_2m[i],
    apparent: w.hourly.apparent_temperature[i],
    precipitation: w.hourly.precipitation[i] ?? 0,
    precipProbability: w.hourly.precipitation_probability?.[i] ?? 0,
    weatherCode: w.hourly.weather_code[i],
    cloudCover: w.hourly.cloud_cover[i] ?? 0,
    windSpeed: w.hourly.wind_speed_10m[i] ?? 0,
    uv: w.hourly.uv_index?.[i] ?? 0,
    isDay: Boolean(w.hourly.is_day?.[i]),
  }));

  const daily = (w.daily.time as string[]).map((date, i) => ({
    date,
    max: w.daily.temperature_2m_max[i],
    min: w.daily.temperature_2m_min[i],
    weatherCode: w.daily.weather_code[i],
    precipitationSum: w.daily.precipitation_sum[i] ?? 0,
    precipProbability: w.daily.precipitation_probability_max?.[i] ?? 0,
    sunrise: w.daily.sunrise[i],
    sunset: w.daily.sunset[i],
    uvMax: w.daily.uv_index_max?.[i] ?? 0,
    windMax: w.daily.wind_speed_10m_max?.[i] ?? 0,
  }));

  return {
    place,
    timezone: w.timezone,
    utcOffsetSeconds: w.utc_offset_seconds,
    current: {
      time: w.current.time,
      temperature: w.current.temperature_2m,
      apparent: w.current.apparent_temperature,
      humidity: w.current.relative_humidity_2m,
      precipitation: w.current.precipitation ?? 0,
      weatherCode: w.current.weather_code,
      cloudCover: w.current.cloud_cover ?? 0,
      windSpeed: w.current.wind_speed_10m ?? 0,
      windGusts: w.current.wind_gusts_10m ?? 0,
      windDirection: w.current.wind_direction_10m ?? 0,
      pressure: w.current.pressure_msl ?? 0,
      visibility: w.current.visibility ?? 20000,
      isDay: Boolean(w.current.is_day),
      uv: w.current.uv_index ?? 0,
    },
    hourly,
    daily,
    air,
  };
}

export function placeSlug(p: Place) {
  const bits = [p.name, p.admin1, p.country].filter(Boolean).join(" ");
  return `${bits
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${p.latitude.toFixed(3)}_${p.longitude.toFixed(3)}`;
}

export function placeFromSlug(slug: string): Place | null {
  const m = slug.match(/^(.*)-(-?\d+\.\d+)_(-?\d+\.\d+)$/);
  if (!m) return null;
  const label = m[1]!.split("-").filter(Boolean);
  const name = label
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    id: 0,
    name: name || "Location",
    latitude: Number(m[2]!),
    longitude: Number(m[3]!),
  };
}

export function placeLabel(p: Place) {
  return [p.name, p.admin1, p.country].filter(Boolean).join(", ");
}
