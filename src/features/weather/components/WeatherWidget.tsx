import { useTranslation } from 'react-i18next';
import { 
  CloudSun, CloudRain, AlertTriangle, Loader2, Sparkles 
} from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import LocationSelector from './LocationSelector';
import { type GeoLocation } from '../../impact/services/impactLogic';

interface Props {
  shopLocation?: GeoLocation | null;
}

export default function WeatherWidget({ shopLocation }: Props) {
  const { t } = useTranslation();
  const { 
    data: weather, 
    isLoading: weatherLoading, 
    error: weatherError, 
    needsManualLocation, 
    searchResults,
    retryLocation, 
    searchCity, 
    selectLocation,
    forceManualLocation 
  } = useWeather(shopLocation);

  return (
    <section className="space-y-4">
      <div className="flex justify-between flex-wrap gap-2 items-end">
        <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted">
          {shopLocation ? "Météo à ma Boutique" : t('weather.current_conditions')}
        </h2>
      </div>

      {weatherLoading && (
        <div className="bg-inox-800 p-5 rounded-3xl border border-inox-700 shadow-inox flex items-center gap-4 h-24 md:h-16">
          <Loader2 className="w-8 h-8 text-action-DEFAULT animate-spin shrink-0" />
          <p className="text-inox-muted font-medium">{t('weather.loading')}</p>
        </div>
      )}

      {!weatherLoading && needsManualLocation && (
        <LocationSelector 
          onSearch={searchCity}
          onSelect={selectLocation}
          results={searchResults}
          isLoading={weatherLoading}
          error={weatherError}
          onRetryGPS={retryLocation}
        />
      )}

      {!weatherLoading && !needsManualLocation && weatherError && !weather && (
        <div className="bg-inox-800 p-5 rounded-3xl border border-fefo-DEFAULT/40 shadow-inox text-fefo-light flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="font-medium">{t('weather.error_network')}</p>
          <button onClick={retryLocation} className="ml-auto underline text-xs font-bold">{t('weather.retry_gps')}</button>
        </div>
      )}

      {weather && !needsManualLocation && !weatherLoading && (
        <div className="space-y-4">
          <div className="bg-inox-800 p-6 md:p-5 rounded-3xl border border-inox-700 shadow-inox active:scale-[0.99] transition-transform relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[120px] -mr-4 -mt-4 transition-colors ${weather.precipitationProbability > 50 ? 'bg-action-DEFAULT/10' : 'bg-profit-DEFAULT/10'}`} />
            
            <div className="flex items-center gap-6 relative z-10">
              <div className={`w-20 h-20 md:w-16 md:h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg ${weather.precipitationProbability > 50 ? 'bg-action-DEFAULT/15 text-action-light' : 'bg-profit-DEFAULT/15 text-profit-light'}`}>
                {weather.precipitationProbability > 50 ? <CloudRain className="w-10 h-10 md:w-8 md:h-8" /> : <CloudSun className="w-10 h-10 md:w-8 md:h-8" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-3xl font-extrabold text-white">{weather.temperature}</span>
                  <span className="text-xl md:text-lg font-bold text-inox-muted">°C</span>
                </div>
                <p className="text-base font-semibold text-inox-muted mt-1">
                  {t('weather.rain_risk')}: <span className={weather.precipitationProbability > 50 ? 'text-action-light' : 'text-profit-light'}>{weather.precipitationProbability}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Avis du Commissaire (Logic Métier) */}
          <div className={`bg-inox-800 p-5 rounded-3xl border ${weather.advice.type === 'bbq' ? 'border-orange-500/40' : 'border-action-light/20'} shadow-inox relative overflow-hidden`}>
             <div className="flex items-start gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${weather.advice.type === 'bbq' ? 'bg-orange-500/10 text-orange-500' : 'bg-action-light/10 text-action-light'}`}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-inox-muted mb-1">{t('dashboard.production_advice')}</h4>
                   <p className={`text-sm md:text-base font-bold leading-relaxed ${weather.advice.color}`}>
                     {weather.advice.text}
                   </p>
                </div>
             </div>
          </div>

          {/* Prévisions 15 Jours */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-inox-muted mb-3">Prévisions 15 Jours</h4>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-5 md:overflow-x-visible md:pb-0">
              {weather.dailyForecast.map((day, idx) => {
                const date = new Date(day.time);
                const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(date);
                const isRainy = day.precipitationProbability > 50;

                return (
                  <div key={idx} className="bg-inox-800 border border-inox-700 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0 w-[100px] md:w-auto snap-center shadow-inox">
                    <span className="text-xs font-bold text-inox-muted capitalize mb-2">{dayName}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${isRainy ? 'bg-action-DEFAULT/15 text-action-light' : 'bg-profit-DEFAULT/15 text-profit-light'}`}>
                      {isRainy ? <CloudRain className="w-5 h-5" /> : <CloudSun className="w-5 h-5" />}
                    </div>
                    <span className="text-lg font-bold text-white mb-1">{day.temperatureMax}°</span>
                    <span className="text-[10px] font-bold text-inox-muted">{day.precipitationProbability}% pluie</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
