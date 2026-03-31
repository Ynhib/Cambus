import React, { useState } from 'react';
import {
  LocateFixed, Loader2,
  CheckCircle2, Building2, AlertCircle, MapPin
} from 'lucide-react';
import { saveShopInfo, type ShopInfo, type GeoLocation } from '../services/impactLogic';
import AddressAutocomplete from './AddressAutocomplete';

type Step = 'idle' | 'locating' | 'confirm';

interface Props {
  onComplete: (info: ShopInfo) => void;
}

export default function LocationOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  // Valeurs sélectionnées pour confirmation
  const [pending, setPending] = useState<{ location: GeoLocation; addressText: string; cityName: string } | null>(null);
  
  // Rue (modifiable à l'étape confirm)
  const [street, setStreet] = useState('');

  // ─── GPS AUTO ────────────────────────────────────────────────
  const handleGPS = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      setError('GPS non disponible sur cet appareil. Utilisez la recherche.');
      return;
    }
    setStep('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPending({ 
          location: { lat: latitude, lng: longitude }, 
          addressText: 'Ma position GPS',
          cityName: 'Ma position'
        });
        setStreet('Ma position GPS');
        setStep('confirm');
      },
      (err) => {
        setStep('idle');
        if (err.code === 1) {
          setError('Permission GPS refusée. Activez la localisation dans vos réglages ou utilisez la recherche.');
        } else if (err.code === 2) {
          setError('Position GPS introuvable. Vérifiez votre connexion ou utilisez la recherche.');
        } else {
          setError('La localisation GPS a expiré. Réessayez ou utilisez la recherche.');
        }
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  // ─── SÉLECTION AUTOCOMPLETE ──────────────────────────────────
  const handleSelectAddress = (location: GeoLocation, addressText: string, cityName: string) => {
    setPending({ location, addressText, cityName });
    setStreet(addressText);
    setStep('confirm');
  };

  // ─── CONFIRMATION ─────────────────────────────────────────────
  const handleConfirm = () => {
    if (!pending) return;
    const info: ShopInfo = {
      location: pending.location,
      cityName: pending.cityName,
      street: street.trim() || undefined,
    };
    saveShopInfo(info);
    onComplete(info);
  };

  const isLocating = step === 'locating';

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* ─── Étape Confirmation ──────────────────────────────── */}
      {step === 'confirm' && pending && (
        <div className="bg-inox-800 border border-profit-DEFAULT/30 rounded-3xl p-6 animate-in zoom-in-95 duration-300 space-y-5 shadow-inox">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-profit-DEFAULT shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-inox-muted mb-0.5">Localisation trouvée</p>
              <h3 className="text-xl font-bold text-white mb-1">{pending.cityName}</h3>
              <p className="text-xs text-inox-muted font-medium bg-inox-900 px-2 py-1 rounded-lg inline-block">
                📍 {pending.location.lat.toFixed(5)}, {pending.location.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Champ adresse éditable */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-widest text-inox-muted block mb-2">
              <Building2 className="w-3.5 h-3.5 inline mr-1.5 mb-0.5 text-action-light" />
              Adresse complète <span className="font-normal normal-case">(optionnel)</span>
            </label>
            <input
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="Ex: 28 Rue de la Paix"
              className="w-full bg-inox-900 border border-inox-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-action-DEFAULT focus:ring-1 focus:ring-action-DEFAULT transition-all"
            />
            <p className="text-[10px] text-inox-muted mt-1.5 leading-relaxed">
              Cette information est stockée localement sur votre appareil. Elle vous permet d'avoir un repère visuel clair.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setStep('idle'); setPending(null); }}
              className="flex-1 bg-inox-900 hover:bg-inox-700 border border-inox-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] bg-profit-DEFAULT hover:bg-profit-dark text-inox-900 font-extrabold py-3 rounded-xl shadow-inox-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirmer ma boutique
            </button>
          </div>
        </div>
      )}

      {/* ─── Écran principal (Formulaire) ─────────────────────────────────── */}
      {step !== 'confirm' && (
        <div className="bg-inox-800 border border-inox-700 rounded-3xl p-6 space-y-6 shadow-inox">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-inox-muted block mb-3">
              Rechercher votre adresse
            </label>
            <AddressAutocomplete onSelect={handleSelectAddress} disabled={isLocating} />
            <p className="text-[10px] text-inox-muted mt-2">
              Tapez une adresse, un code postal ou une ville (ex : "10 rue de la Paix Paris" ou "75001").
            </p>
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-inox-700" />
            <span className="text-[10px] font-bold text-inox-muted uppercase tracking-widest px-2">ou</span>
            <div className="flex-1 h-px bg-inox-700" />
          </div>

          <button
            onClick={handleGPS}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-3 bg-action-DEFAULT/10 hover:bg-action-DEFAULT/20 border border-action-DEFAULT/30 hover:border-action-DEFAULT/50 text-white p-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 group"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 text-action-light animate-spin" />
            ) : (
              <LocateFixed className="w-5 h-5 text-action-light" />
            )}
            <span className="font-bold text-sm">
              {isLocating ? 'Géolocalisation...' : 'Utiliser le GPS de mon appareil'}
            </span>
          </button>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-start gap-3 bg-fefo-DEFAULT/10 border border-fefo-DEFAULT/20 text-fefo-light p-3 rounded-xl text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
