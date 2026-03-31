import React, { useState, useRef, useEffect } from 'react';
import { X, ScanLine, PenLine, Plus, Minus, Camera, ArrowLeft, Check, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'CHOOSE' | 'SCAN' | 'MANUAL';

const CATALOG_SUGGESTIONS = [
  "Farine T65",
  "Beurre de Tourage",
  "Sucre Semoule",
  "Œufs (Plateau de 30)",
  "Lait Entier",
  "Farine T45",
  "Beurre Doux",
  "Sucre Glace",
  "Crème Liquide 35%",
  "Levure Fraîche",
  "Chocolat Noir 70%",
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function AddStockModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('CHOOSE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [expiry, setExpiry] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setTimeout(() => {
        setMode('CHOOSE');
        setName('');
        setQuantity(1);
        setUnit('kg');
        setExpiry('');
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'MANUAL' && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length >= 1) {
      const filtered = CATALOG_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    setName(s);
    setShowSuggestions(false);
  };

  const adjustQty = (delta: number) => {
    setQuantity(prev => Math.max(0.5, parseFloat((prev + delta).toFixed(1))));
  };

  const handleExpiryShortcut = (days: number) => {
    setExpiry(addDays(days));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || quantity <= 0) return;
    setIsSubmitting(true);
    try {
      // TODO: persist to db.stockItems when schema is ready
      await new Promise(r => setTimeout(r, 600)); // Simulated save
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-inox-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-inox-800">
          <div className="flex items-center gap-3">
            {mode !== 'CHOOSE' && (
              <button
                type="button"
                onClick={() => setMode('CHOOSE')}
                className="text-inox-muted hover:text-white transition-colors p-1.5 rounded-xl hover:bg-inox-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-black text-white uppercase tracking-widest">
              {mode === 'CHOOSE' && '📦 Entrée en Stock'}
              {mode === 'SCAN' && '📸 Scanner'}
              {mode === 'MANUAL' && '✍️ Saisie Manuelle'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-inox-muted hover:text-white transition-colors p-2 rounded-full hover:bg-inox-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ══════════════════════════════════════
            MODE : CHOOSE
        ══════════════════════════════════════ */}
        {mode === 'CHOOSE' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Card Scan */}
            <button
              type="button"
              onClick={() => setMode('SCAN')}
              className="group relative flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-2xl border-2 border-slate-700 bg-inox-800 hover:border-action-DEFAULT hover:bg-inox-700/60 transition-all duration-200 active:scale-[0.97] overflow-hidden"
            >
              {/* Glow accent */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-action-DEFAULT/10 to-transparent rounded-2xl" />
              <div className="relative z-10 flex flex-col items-center gap-3 p-6">
                <div className="w-16 h-16 rounded-2xl bg-action-DEFAULT/20 border border-action-DEFAULT/40 flex items-center justify-center group-hover:bg-action-DEFAULT/30 transition-colors">
                  <ScanLine className="w-8 h-8 text-action-light" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white uppercase tracking-wide">
                    Scanner un Code-Barres
                  </p>
                  <p className="text-sm text-inox-muted mt-1 font-medium">
                    Remplissage automatique via <span className="text-action-light">Open Food Facts</span>
                  </p>
                </div>
              </div>
            </button>

            {/* Card Manual */}
            <button
              type="button"
              onClick={() => setMode('MANUAL')}
              className="group relative flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-2xl border-2 border-slate-700 bg-inox-800 hover:border-profit-DEFAULT hover:bg-inox-700/60 transition-all duration-200 active:scale-[0.97] overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-profit-DEFAULT/10 to-transparent rounded-2xl" />
              <div className="relative z-10 flex flex-col items-center gap-3 p-6">
                <div className="w-16 h-16 rounded-2xl bg-profit-DEFAULT/20 border border-profit-DEFAULT/40 flex items-center justify-center group-hover:bg-profit-DEFAULT/30 transition-colors">
                  <PenLine className="w-8 h-8 text-profit-light" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-white uppercase tracking-wide">
                    Saisie Manuelle
                  </p>
                  <p className="text-sm text-inox-muted mt-1 font-medium">
                    Recherche rapide dans le <span className="text-profit-light">catalogue</span>
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            MODE : SCAN (Placeholder)
        ══════════════════════════════════════ */}
        {mode === 'SCAN' && (
          <div className="p-5 flex flex-col items-center gap-5">
            {/* Fake camera viewfinder */}
            <div className="relative w-full aspect-square max-h-72 rounded-2xl bg-inox-800 border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-action-DEFAULT rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-action-DEFAULT rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-action-DEFAULT rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-action-DEFAULT rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute w-[80%] h-0.5 bg-action-DEFAULT/70 shadow-[0_0_8px_2px_rgba(6,182,212,0.5)] animate-[scanLine_2s_ease-in-out_infinite]" />
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-14 h-14 rounded-full bg-inox-700 border border-inox-600 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-inox-muted animate-pulse" />
                </div>
                <p className="text-sm font-bold text-inox-muted uppercase tracking-wider">
                  Caméra en cours d'activation…
                </p>
                <p className="text-xs text-inox-700 text-center px-4">
                  L'intégration du scanner sera disponible prochainement
                </p>
              </div>
            </div>

            <div className="w-full bg-action-DEFAULT/10 border border-action-DEFAULT/30 rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-action-light">📡 Open Food Facts</p>
              <p className="text-xs text-inox-muted mt-1">
                Le scanner interrogera automatiquement la base de données publique pour remplir le formulaire.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode('MANUAL')}
              className="w-full min-h-[52px] rounded-2xl border border-inox-600 bg-inox-800 text-inox-muted hover:text-white hover:bg-inox-700 font-bold text-sm uppercase tracking-widest transition-all"
            >
              Passer à la saisie manuelle
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            MODE : MANUAL
        ══════════════════════════════════════ */}
        {mode === 'MANUAL' && (
          <form
            onSubmit={handleSubmit}
            className="p-5 space-y-5 max-h-[75vh] overflow-y-auto"
          >
            {/* ── CHAMP 1 : Nom produit ── */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-white uppercase tracking-widest">
                Produit
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  onFocus={() => name && setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Ex : Farine T65, Beurre…"
                  className="w-full bg-inox-800 border border-slate-700 text-white rounded-2xl px-5 py-4 text-lg font-bold min-h-[60px] focus:outline-none focus:border-action-DEFAULT focus:shadow-inox-glow transition-all placeholder:text-inox-muted"
                  autoComplete="off"
                />

                {/* Autocomplete dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-inox-800 border border-inox-600 rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-action-DEFAULT/20 hover:text-action-light transition-colors border-b border-slate-700 last:border-0 min-h-[48px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── CHAMP 2 : Quantité ── */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-white uppercase tracking-widest">
                Quantité
              </label>
              <div className="flex items-stretch gap-3">
                {/* Minus */}
                <button
                  type="button"
                  onClick={() => adjustQty(-1)}
                  className="flex-none w-16 min-h-[60px] rounded-xl bg-inox-800 border border-inox-600 flex items-center justify-center text-white hover:bg-fefo-DEFAULT/80 hover:border-fefo-DEFAULT transition-all active:scale-95 text-2xl font-bold"
                  aria-label="Diminuer"
                >
                  <Minus className="w-6 h-6" />
                </button>

                {/* Display */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                    className="flex-1 bg-inox-800 border border-inox-600 text-white rounded-xl px-3 py-3 text-2xl font-black text-center min-h-[60px] focus:outline-none focus:border-action-DEFAULT transition-all"
                  />
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-20 bg-inox-800 border border-inox-600 text-inox-muted rounded-xl px-2 py-3 text-sm font-bold min-h-[60px] focus:outline-none focus:border-action-DEFAULT text-center"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="cl">cl</option>
                    <option value="pièce">pcs</option>
                    <option value="plateau">plat.</option>
                    <option value="sachet">sach.</option>
                    <option value="boite">boîte</option>
                  </select>
                </div>

                {/* Plus */}
                <button
                  type="button"
                  onClick={() => adjustQty(1)}
                  className="flex-none w-16 min-h-[60px] rounded-xl bg-inox-800 border border-inox-600 flex items-center justify-center text-white hover:bg-profit-DEFAULT/80 hover:border-profit-DEFAULT transition-all active:scale-95"
                  aria-label="Augmenter"
                >
                  <Plus className="w-6 h-6 font-bold" />
                </button>
              </div>

              {/* Quick qty presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 5, 10, 25, 50].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setQuantity(v)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-all min-h-[36px] ${
                      quantity === v
                        ? 'bg-action-DEFAULT border-action-DEFAULT text-inox-900'
                        : 'bg-inox-800 border-inox-600 text-inox-muted hover:border-action-DEFAULT hover:text-action-light'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CHAMP 3 : DLC/DDM ── */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-white uppercase tracking-widest">
                Péremption <span className="text-inox-muted font-medium normal-case tracking-normal">(DLC / DDM)</span>
              </label>

              {/* Shortcut chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '+3 Jours', days: 3 },
                  { label: '+1 Sem.', days: 7 },
                  { label: '+1 Mois', days: 30 },
                  { label: '+3 Mois', days: 90 },
                  { label: '+6 Mois', days: 180 },
                  { label: '+1 An', days: 365 },
                ].map(s => (
                  <button
                    key={s.days}
                    type="button"
                    onClick={() => handleExpiryShortcut(s.days)}
                    className={`rounded-full px-4 py-2 text-xs font-bold border transition-all min-h-[40px] ${
                      expiry === addDays(s.days)
                        ? 'bg-fefo-DEFAULT border-fefo-DEFAULT text-white shadow-sm'
                        : 'bg-inox-800 border-inox-600 text-inox-muted hover:border-fefo-DEFAULT hover:text-fefo-light'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Date input */}
              <input
                type="date"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full bg-inox-800 border border-slate-700 text-white rounded-2xl px-5 py-4 min-h-[60px] focus:outline-none focus:border-action-DEFAULT transition-all [color-scheme:dark] text-lg font-bold"
              />
              {expiry && (
                <p className="text-xs text-inox-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-profit-DEFAULT inline-block" />
                  DLC fixée au{' '}
                  <span className="font-bold text-white">
                    {new Date(expiry + 'T12:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </p>
              )}
            </div>

            {/* ── SUBMIT ── */}
            <div className="pt-2 pb-1">
              <button
                type="submit"
                disabled={isSubmitting || !name}
                className="w-full min-h-[64px] rounded-2xl bg-action-DEFAULT hover:bg-action-dark disabled:opacity-40 disabled:cursor-not-allowed font-black text-lg uppercase tracking-widest text-inox-900 shadow-inox-glow flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
              >
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : <Check className="w-6 h-6 stroke-[3]" />
                }
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer le Stock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
