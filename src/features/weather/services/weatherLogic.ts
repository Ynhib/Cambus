export interface DailyData {
  time: string[];
  temperature_2m_max: number[];
  weather_code: number[];
  precipitation_probability_max: number[];
}

export interface WeatherAdvice {
  text: string;
  type: 'bbq' | 'soup' | 'standard';
  color: string;
}

export function getWeatherAdvice(daily: DailyData): WeatherAdvice {
  // On regarde les 3 prochains jours pour donner un conseil de production
  const nextThreeMaxTemp = daily.temperature_2m_max.slice(0, 3);
  const nextThreePrecip = daily.precipitation_probability_max.slice(0, 3);
  
  const avgMaxTemp = nextThreeMaxTemp.reduce((a, b) => a + b, 0) / 3;
  const maxPrecip = Math.max(...nextThreePrecip);

  if (avgMaxTemp > 20 && maxPrecip < 30) {
    return {
      text: "🔥 Alerte Barbecue : Prévoyez vos stocks de viande grillée et pains burger.",
      type: 'bbq',
      color: 'text-orange-500'
    };
  }

  if (avgMaxTemp < 12 || maxPrecip > 60) {
    return {
      text: "🍲 Temps à soupe : Mettez en avant vos bouillons, potages et plats mijotés.",
      type: 'soup',
      color: 'text-action-light'
    };
  }

  return {
    text: "👨‍🍳 Production standard : Conditions stables pour la saison.",
    type: 'standard',
    color: 'text-inox-muted'
  };
}
