import React, { useState } from 'react';
import { Search, MapPin, Globe, Loader2, MapPinOff, AlertTriangle } from 'lucide-react';
import type { SearchResult } from '../hooks/useWeather';
import { useTranslation } from 'react-i18next';

interface LocationSelectorProps {
  onSearch: (city: string) => void;
  onSelect: (location: SearchResult) => void;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  onRetryGPS: () => void;
}

export default function LocationSelector({ onSearch, onSelect, results, isLoading, error, onRetryGPS }: LocationSelectorProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="bg-inox-800 p-5 rounded-3xl border border-inox-700 shadow-inox">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-inox-700 flex items-center justify-center text-inox-muted shrink-0">
          <MapPinOff className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{t('weather.geolocation_disabled')}</h3>
          <p className="text-sm text-inox-muted">{t('weather.geolocation_disabled_desc')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('weather.city_placeholder')}
          className="w-full bg-inox-900 border border-inox-700 text-white text-base rounded-2xl pl-12 pr-4 h-16 md:h-12 focus:outline-none focus:border-action-DEFAULT focus:ring-1 focus:ring-action-DEFAULT transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-inox-muted group-focus-within:text-action-light transition-colors" />
        <button 
          type="submit" 
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-action-DEFAULT hover:bg-action-dark text-white p-3 md:p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      {/* Liste des résultats */}
      {results.length > 0 && (
        <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
          {results.map((res, idx) => (
            <button
              key={`${res.name}-${idx}`}
              onClick={() => onSelect(res)}
              className="w-full flex items-center gap-4 p-4 md:p-3 bg-inox-900/50 hover:bg-inox-700 border border-inox-700 rounded-2xl transition-all text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-inox-800 flex items-center justify-center text-action-light shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white font-bold truncate">{res.name}</p>
                <p className="text-xs text-inox-muted truncate">
                  {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                </p>
              </div>
              <MapPin className="w-4 h-4 text-inox-muted shrink-0" />
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-fefo-light text-sm mt-4 flex items-center gap-2 bg-fefo-DEFAULT/10 p-3 rounded-xl border border-fefo-DEFAULT/20">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <button
        onClick={onRetryGPS}
        className="mt-6 w-full text-sm font-medium text-inox-muted hover:text-white underline decoration-inox-muted underline-offset-4 transition-colors"
      >
        {t('weather.retry_gps')}
      </button>
    </div>
  );
}
