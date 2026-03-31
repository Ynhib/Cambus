import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { type GeoLocation } from '../services/impactLogic';

export interface AddressSuggestion {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lng: number;
  fullText: string;
}

interface Props {
  onSelect: (location: GeoLocation, addressText: string, cityName: string) => void;
  disabled?: boolean;
}

export default function AddressAutocomplete({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch avec debounce
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.features) {
          const formatted: AddressSuggestion[] = data.features.map((f: any) => {
            const props = f.properties;
            const parts = [props.name, props.street, props.postcode, props.city, props.country].filter(Boolean);
            
            return {
              name: props.name,
              street: props.street,
              housenumber: props.housenumber,
              city: props.city || props.county || props.state, // Fallback si city vide
              postcode: props.postcode,
              country: props.country,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              fullText: Array.from(new Set(parts)).join(', '), // Évite les doublons name/street
            };
          });
          setSuggestions(formatted);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Erreur d'autocomplétion:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (sugg: AddressSuggestion) => {
    let finalAddressText = query; // Par défaut, garde ce que l'utilisateur a tapé (utile si la suggestion est juste une ville)
    
    // Si l'API renvoie des détails précis de rue, on les utilise pour formater une belle adresse complète
    if (sugg.street) {
      const streetPart = [sugg.housenumber, sugg.street].filter(Boolean).join(' ');
      finalAddressText = [streetPart, sugg.postcode, sugg.city].filter(Boolean).join(', ');
    } else if (sugg.name && sugg.name !== sugg.city) {
      // Parfois le POI/boutique est dans 'name' mais ce n'est pas une rue stricte
      finalAddressText = [sugg.name, sugg.postcode, sugg.city].filter(Boolean).join(', ');
    }

    setQuery(finalAddressText);
    setIsOpen(false);
    onSelect(
      { lat: sugg.lat, lng: sugg.lng },
      finalAddressText,
      sugg.city || 'Ma ville'
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center gap-2">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-inox-muted pointer-events-none z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.length >= 3) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Commencez à taper votre adresse complète..."
          disabled={disabled}
          className="w-full bg-inox-900 border border-inox-700 text-white rounded-2xl pl-10 pr-10 py-4 focus:outline-none focus:border-action-DEFAULT focus:ring-2 focus:ring-action-DEFAULT/40 transition-all disabled:opacity-50 text-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-inox-muted pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-action-light" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Menu déroulant */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-inox-800 border border-inox-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
          {suggestions.map((sugg, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(sugg)}
              className="px-4 py-3 hover:bg-inox-700 cursor-pointer border-b border-inox-700/50 last:border-b-0 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-action-light shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {sugg.name || sugg.city || sugg.fullText}
                </p>
                <p className="text-xs text-inox-muted truncate">
                  {[sugg.postcode, sugg.city, sugg.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
