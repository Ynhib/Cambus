import React, { useState } from 'react';
import { Search, MapPin, Globe, Loader2, X, Check } from 'lucide-react';
import type { GeoLocation } from '../services/impactLogic';

interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface Props {
  onSave: (location: GeoLocation, cityName: string) => void;
  onClose?: () => void;
  initialCity?: string;
}

export default function ShopLocationConfig({ onSave, onClose, initialCity = '' }: Props) {
  const [query, setQuery] = useState(initialCity);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr`;
      const resp = await fetch(geoUrl);
      const json = await resp.json();

      if (!json.results || json.results.length === 0) {
        throw new Error('Adresse introuvable. Soyez plus spécifique.');
      }
      setResults(json.results);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-inox-850 border border-inox-700 rounded-3xl p-6 shadow-inox-glow animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-action-DEFAULT/10 flex items-center justify-center text-action-light text-action-light">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Emplacement de la Boutique</h3>
            <p className="text-xs text-inox-muted">Configurez votre point de vente pivot</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-inox-700 rounded-full text-inox-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Entrez l'adresse ou la ville de votre boutique..."
          className="w-full bg-inox-900 border border-inox-700 text-white rounded-2xl pl-12 pr-4 h-14 focus:outline-none focus:border-action-DEFAULT focus:ring-1 focus:ring-action-DEFAULT transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-inox-muted" />
        <button 
          type="submit" 
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-action-DEFAULT hover:bg-action-dark text-white px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 font-bold"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-fefo-DEFAULT/10 border border-fefo-DEFAULT/20 rounded-xl text-fefo-light text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {results.map((res, idx) => (
          <button
            key={`${res.name}-${idx}`}
            onClick={() => onSave({ lat: res.latitude, lng: res.longitude }, res.name)}
            className="w-full flex items-center gap-4 p-4 bg-inox-900/50 hover:bg-inox-700 border border-inox-700 rounded-2xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-inox-800 flex items-center justify-center text-action-light group-hover:bg-action-DEFAULT group-hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-bold truncate">{res.name}</p>
              <p className="text-xs text-inox-muted truncate">
                {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Check className="w-5 h-5 text-action-light" />
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-inox-muted mt-6 text-center italic uppercase tracking-widest">
        Propulsé par Cambuse Géofencing Core
      </p>
    </div>
  );
}
