import { useState, useEffect, useCallback } from 'react';
import { getWeatherAdvice, type WeatherAdvice } from '../services/weatherLogic';

export interface DailyForecast {
  time: string;
  temperatureMax: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherData {
  temperature: number;
  precipitationProbability: number;
  city: string;
  advice: WeatherAdvice;
  dailyForecast: DailyForecast[];
}

export interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  postcode?: string;
}

interface UseWeatherResult {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  needsManualLocation: boolean;
  searchResults: SearchResult[];
  retryLocation: () => void;
  searchCity: (cityName: string) => Promise<void>;
  selectLocation: (location: SearchResult) => Promise<void>;
  forceManualLocation: () => void;
}

export function useWeather(fixedLocation?: GeoLocation | null): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsManualLocation, setNeedsManualLocation] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const fetchWeatherData = async (latitude: number, longitude: number, cityName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // On demande hourly pour le temps présent et daily pour l'avis du commissaire
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,weather_code,precipitation_probability_max&timezone=auto&forecast_days=15`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Erreur Météo: ${response.status}`);

      const json = await response.json();
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);

      const foundIndex = json.hourly.time.findIndex((t: string) => new Date(t).getTime() >= currentHour.getTime());
      const index = foundIndex === -1 ? 0 : foundIndex;

      const dailyForecast: DailyForecast[] = json.daily.time.map((time: string, i: number) => ({
        time,
        temperatureMax: Math.round(json.daily.temperature_2m_max[i]),
        precipitationProbability: json.daily.precipitation_probability_max[i],
        weatherCode: json.daily.weather_code[i]
      }));

      setData({
        temperature: Math.round(json.hourly.temperature_2m[index]),
        precipitationProbability: json.hourly.precipitation_probability[index],
        city: cityName,
        advice: getWeatherAdvice(json.daily),
        dailyForecast
      });
      setNeedsManualLocation(false);
      setSearchResults([]);
    } catch (err: any) {
      setError(err?.message || 'Erreur météo');
    } finally {
      setIsLoading(false);
    }
  };

  const searchCity = async (cityName: string) => {
    if (!cityName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=fr`;
      const resp = await fetch(geoUrl);
      const json = await resp.json();

      if (!json.results || json.results.length === 0) {
        throw new Error('Lieu introuvable.');
      }
      setSearchResults(json.results);
      setNeedsManualLocation(true);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLocation = async (location: SearchResult) => {
    await fetchWeatherData(location.latitude, location.longitude, location.name);
  };

  const fetchWithGPS = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNeedsManualLocation(false);

    if (!navigator.geolocation) {
      setNeedsManualLocation(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, "Ma Position"),
      () => {
        setNeedsManualLocation(true);
        setIsLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (fixedLocation) {
      fetchWeatherData(fixedLocation.lat, fixedLocation.lng, "Ma Boutique");
    } else {
      fetchWithGPS();
    }
  }, [fixedLocation, fetchWithGPS]);

  return {
    data, isLoading, error, needsManualLocation, searchResults,
    retryLocation: fetchWithGPS,
    searchCity,
    selectLocation,
    forceManualLocation: () => { setNeedsManualLocation(true); setData(null); }
  };
}
