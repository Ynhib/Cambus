import React from 'react';
import { TrendingDown, ShieldCheck, Trash2, Save, ArrowRight } from 'lucide-react';

interface Props {
  savedValue: number;
  lostValue: number;
  totalItemsProcessed: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function EndOfDaySummary({ savedValue, lostValue, totalItemsProcessed, onConfirm, isProcessing }: Props) {
  const totalValue = savedValue + lostValue;
  const shrinkageRate = totalValue > 0 ? (lostValue / (savedValue + lostValue)) * 100 : 0;

  return (
    <div className="bg-inox-800 border-2 border-slate-700 rounded-[40px] p-8 space-y-8 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-action-DEFAULT/10 rounded-2xl">
            <TrendingDown className="w-6 h-6 text-action-light" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Bilan Démarque</h3>
        </div>
        <span className="px-4 py-2 bg-inox-900 border border-white/5 rounded-2xl text-[10px] font-black text-inox-muted uppercase">
          {totalItemsProcessed} Produits Traités
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VALEUR SAUVÉE */}
        <div className="bg-inox-900/50 border border-profit-DEFAULT/20 rounded-3xl p-6 space-y-2 group hover:bg-profit-DEFAULT/5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-profit-light" />
            <span className="text-[10px] font-black text-profit-light uppercase tracking-widest">Valeur Sauvée (HACCP)</span>
          </div>
          <p className="text-4xl font-black text-white tracking-tighter">{savedValue.toFixed(2)}€</p>
          <p className="text-[10px] font-bold text-inox-muted uppercase">Recyclage & Surgélation</p>
        </div>

        {/* VALEUR PERDUE */}
        <div className="bg-inox-900/50 border border-fefo-DEFAULT/20 rounded-3xl p-6 space-y-2 group hover:bg-fefo-DEFAULT/5 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4 text-fefo-light" />
            <span className="text-[10px] font-black text-fefo-light uppercase tracking-widest">Valeur Perdue (Démarque)</span>
          </div>
          <p className="text-4xl font-black text-white tracking-tighter">{lostValue.toFixed(2)}€</p>
          <p className="text-[10px] font-bold text-inox-muted uppercase">Jeté / Invendus secs</p>
        </div>
      </div>

      {/* Jauge de shrinkage */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Taux de Démarque Réelle</span>
          <span className={`text-sm font-black ${shrinkageRate > 15 ? 'text-fefo-light' : 'text-profit-light'}`}>
            {shrinkageRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-inox-950 rounded-full overflow-hidden border border-white/5 p-0.5">
           <div 
             className="h-full rounded-full bg-gradient-to-r from-profit-DEFAULT to-fefo-DEFAULT transition-all duration-1000"
             style={{ width: `${shrinkageRate}%` }}
           />
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={isProcessing || totalItemsProcessed === 0}
        className="w-full bg-action-DEFAULT hover:bg-action-light disabled:opacity-50 disabled:cursor-not-allowed text-inox-900 h-20 rounded-3xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-inox-glow group active:scale-95"
      >
        {isProcessing ? (
          <span className="flex items-center gap-3">
             <Save className="w-6 h-6 animate-spin" />
             Traitement...
          </span>
        ) : (
          <>
            Clôturer & Mettre à jour les stocks
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </>
        )}
      </button>

      <p className="text-center text-[9px] font-bold text-inox-muted uppercase tracking-[0.2em] italic">
        🔒 Toutes les transformations sont tracées pour le registre HACCP.
      </p>
    </div>
  );
}
