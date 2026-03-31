import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  temperature: number;
  precipitationProbability: number;
  city: string;
}

interface UseWeatherResult {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  needsManualLocation: boolean;
  retryLocation: () => void;
  searchCity: (cityName: string) => Promise<void>;
  forceManualLocation: () => void;
}

export function useWeather(): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsManualLocation, setNeedsManualLocation] = useState<boolean>(false);

  const fetchWeatherData = async (latitude: number, longitude: number, cityName: string) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability&timezone=auto`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur réseau (Météo): ${response.status}`);
      }

      const json = await response.json();
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);

      let index = json.hourly.time.findIndex((t: string) => {
        return new Date(t).getTime() >= currentHour.getTime();
      });

      if (index === -1) index = 0;

      setData({
        temperature: json.hourly.temperature_2m[index],
        precipitationProbability: json.hourly.precipitation_probability[index],
        city: cityName
      });
      setNeedsManualLocation(false);
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau inconnue');
      setNeedsManualLocation(true);
    } finally {
      setIsLoading(false);
    }
  };

  const searchCity = async (cityName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=fr`;
      const geoResp = await fetch(geoUrl);
      
      if (!geoResp.ok) throw new Error('Erreur API Geocoding');
      const geoJson = await geoResp.json();

      if (!geoJson.results || geoJson.results.length === 0) {
        throw new Error('Ville introuvable. Vérifiez l\'orthographe.');
      }

      const { latitude, longitude, name } = geoJson.results[0];
      await fetchWeatherData(latitude, longitude, name);

    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la recherche');
      setIsLoading(false);
    }
  };

  const fetchWeatherWithLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNeedsManualLocation(false);

    if (!navigator.geolocation) {
      setNeedsManualLocation(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherData(latitude, longitude, "Position Actuelle");
      },
      (geoError) => {
        setNeedsManualLocation(true);
        setIsLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    fetchWeatherWithLocation();
  }, [fetchWeatherWithLocation]);

  const forceManualLocation = useCallback(() => {
    setData(null);
    setNeedsManualLocation(true);
  }, []);

  return { 
    data, 
    isLoading, 
    error, 
    needsManualLocation, 
    retryLocation: fetchWeatherWithLocation, 
    searchCity,
    forceManualLocation
  };
}
