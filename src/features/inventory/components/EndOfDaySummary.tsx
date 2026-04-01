import React from 'react';
import { TrendingDown, ShieldCheck, Trash2, Save, ArrowRight } from 'lucide-react';

interface Props {
  salesValue: number;
  savedValue: number;
  lostValue: number;
  totalItemsProcessed: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function EndOfDaySummary({ salesValue, savedValue, lostValue, totalItemsProcessed, onConfirm, isProcessing }: Props) {
  const totalProductionValue = salesValue + savedValue + lostValue;
  const shrinkageRate = totalProductionValue > 0 ? (lostValue / totalProductionValue) * 100 : 0;
  const efficiencyRate = totalProductionValue > 0 ? ((salesValue + savedValue) / totalProductionValue) * 100 : 0;

  return (
    <div className="bg-inox-800 border-2 border-slate-700 rounded-[40px] p-8 space-y-8 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-action-DEFAULT/10 rounded-2xl">
            <TrendingDown className="w-6 h-6 text-action-light" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Bilan Financier</h3>
        </div>
        <span className="px-4 py-2 bg-inox-950 border border-white/5 rounded-2xl text-[10px] font-black text-inox-muted uppercase">
          {totalItemsProcessed} REGUL. HACCP
        </span>
      </header>

      {/* VENTES ESTIMÉES (Principal) */}
      <div className="bg-inox-900/80 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group transition-all hover:border-indigo-500/40">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Save className="w-12 h-12 text-indigo-400" />
         </div>
         <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Chiffre d'Affaires Théorique (basé coût)</p>
         <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-white tracking-tighter">{salesValue.toFixed(2)}€</p>
            <span className="text-sm font-bold text-zinc-500 uppercase">HT</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* VALEUR SAUVÉE */}
        <div className="bg-inox-950 border border-profit-DEFAULT/10 rounded-3xl p-5 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-profit-light" />
            <span className="text-[9px] font-black text-profit-light uppercase tracking-widest">Sauvé</span>
          </div>
          <p className="text-2xl font-black text-white">+{savedValue.toFixed(2)}€</p>
        </div>

        {/* VALEUR PERDUE */}
        <div className="bg-inox-950 border border-fefo-DEFAULT/10 rounded-3xl p-5 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-3.5 h-3.5 text-fefo-light" />
            <span className="text-[9px] font-black text-fefo-light uppercase tracking-widest">Perdu</span>
          </div>
          <p className="text-2xl font-black text-white">-{lostValue.toFixed(2)}€</p>
        </div>
      </div>

      {/* Jauges de Performance */}
      <div className="space-y-6 pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Efficacité Production</span>
            <span className="text-sm font-black text-profit-light">{efficiencyRate.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-inox-950 rounded-full overflow-hidden border border-white/5 p-0.5">
             <div 
               className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-profit-DEFAULT transition-all duration-1000"
               style={{ width: `${efficiencyRate}%` }}
             />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Taux de Démarque (Pertes)</span>
            <span className={`text-sm font-black ${shrinkageRate > 10 ? 'text-fefo-light' : 'text-zinc-400'}`}>
              {shrinkageRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
             <div 
               className="h-full rounded-full bg-fefo-DEFAULT transition-all duration-1000"
               style={{ width: `${shrinkageRate}%` }}
             />
          </div>
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
