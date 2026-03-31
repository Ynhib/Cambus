import React, { useState } from 'react';
import { AlertCircle, Plus, HardHat, Tent, Search, Map } from 'lucide-react';
import type { StreetEventType, GeoLocation } from '../services/impactLogic';

interface Props {
  onAddAlert: (title: string, type: StreetEventType, location: GeoLocation) => void;
  shopLocation: GeoLocation; // Pour calculer un mock proche
}

export default function LocalAlertForm({ onAddAlert, shopLocation }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StreetEventType>('TRAVAUX');
  const [distance, setDistance] = useState<'PROCHE' | 'MOYEN'>('PROCHE'); // Mock 50m vs 800m

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Simulation de coordonnées : on décale très légèrement la coordonnée du magasin
    // PROCHE = ~50m, MOYEN = ~800m
    const offset = distance === 'PROCHE' ? 0.0004 : 0.007; 
    const mockLocation: GeoLocation = {
      lat: shopLocation.lat + offset,
      lng: shopLocation.lng + (offset / 2)
    };

    onAddAlert(title, type, mockLocation);
    setIsOpen(false);
    setTitle('');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-inox-800 hover:bg-inox-700 border border-inox-700 text-white p-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-inox font-bold"
      >
        <AlertCircle className="w-5 h-5 text-fefo-DEFAULT" />
        Signaler un événement de rue
        <Plus className="w-4 h-4 text-inox-muted ml-auto" />
      </button>
    );
  }

  return (
    <div className="bg-inox-900 border border-action-DEFAULT/40 p-5 rounded-3xl shadow-inox relative overflow-hidden animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 mb-5 border-b border-inox-800 pb-3">
        <Map className="w-5 h-5 text-action-light" />
        <h3 className="text-white font-bold">Nouveau signalement</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-inox-muted block mb-2">Que se passe-t-il ?</label>
          <input 
            type="text" 
            placeholder="Ex: Gaz de ville rue principale..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-inox-800 border border-inox-700 text-white rounded-xl p-3 focus:outline-none focus:border-action-DEFAULT transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => setType('TRAVAUX')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${type === 'TRAVAUX' ? 'border-fefo-DEFAULT bg-fefo-DEFAULT/10 text-white' : 'border-inox-700 bg-inox-800 text-inox-muted hover:bg-inox-700'} transition-colors`}
          >
            <HardHat className="w-5 h-5" />
            <span className="font-bold text-sm">Travaux</span>
          </button>
          <button 
            type="button"
            onClick={() => setType('FÊTE')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${type === 'FÊTE' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-inox-700 bg-inox-800 text-inox-muted hover:bg-inox-700'} transition-colors`}
          >
            <Tent className="w-5 h-5" />
            <span className="font-bold text-sm">Fête locale</span>
          </button>
        </div>

        <div>
           <label className="text-xs font-bold uppercase tracking-widest text-inox-muted block mb-2">Distance</label>
           <select 
             value={distance}
             onChange={(e) => setDistance(e.target.value as any)}
             className="w-full bg-inox-800 border border-inox-700 text-white rounded-xl p-3 focus:outline-none focus:border-action-DEFAULT"
           >
             <option value="PROCHE">Très proche (Dans ma rue, &lt; 100m)</option>
             <option value="MOYEN">Quartier (Dans ma ville, &lt; 1km)</option>
           </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 bg-inox-800 hover:bg-inox-700 text-white font-bold p-3 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button 
            type="submit"
            className="flex-[2] bg-action-DEFAULT hover:bg-action-dark text-white font-bold p-3 rounded-xl shadow-inox-glow transition-all active:scale-[0.98]"
          >
            Publier l'alerte
          </button>
        </div>
      </form>
    </div>
  );
}
