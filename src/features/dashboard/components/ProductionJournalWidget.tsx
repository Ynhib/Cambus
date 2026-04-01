import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { History, Flame, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProductionJournalWidgetProps {
  onOpenEOD?: () => void;
}

export default function ProductionJournalWidget({ onOpenEOD }: ProductionJournalWidgetProps) {
  const today = new Date().toDateString();

  const history = useLiveQuery(async () => {
    const all = await db.productionHistory.toArray();
    return all.filter(item => new Date(item.date).toDateString() === today);
  }) || [];

  // Agrégation par produit
  const aggregated = history.reduce((acc, item) => {
    if (!acc[item.recipeName]) {
      acc[item.recipeName] = { 
        qty: 0, 
        value: 0, 
        lastBatch: 0 
      };
    }
    acc[item.recipeName].qty += item.quantityProduced;
    acc[item.recipeName].value += item.totalCostHT;
    acc[item.recipeName].lastBatch = Math.max(acc[item.recipeName].lastBatch, item.date);
    return acc;
  }, {} as Record<string, { qty: number, value: number, lastBatch: number }>);

  const items = Object.entries(aggregated).map(([name, data]) => ({
    name,
    ...data
  }));

  const totalDailyValue = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0) return null; // Ne pas afficher si rien n'a été produit

  return (
    <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-inox-muted flex items-center gap-2">
          <History className="w-3 h-3" />
          Bilan Production du Jour
        </h2>
        <span className="text-[10px] font-bold text-action-light bg-action-DEFAULT/10 px-2 py-0.5 rounded-full border border-action-DEFAULT/20">
          En direct de l'atelier
        </span>
      </div>

      <div className="bg-inox-800 rounded-[40px] border border-slate-700/50 shadow-2xl overflow-hidden relative">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-action-DEFAULT/5 rounded-bl-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

        <div className="p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <div 
                key={item.name} 
                className="group relative bg-inox-900/40 border border-white/5 p-6 rounded-3xl hover:border-action-DEFAULT/30 transition-all hover:translate-y-[-2px] animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-action-DEFAULT/10 flex items-center justify-center text-action-light group-hover:bg-action-DEFAULT group-hover:text-inox-950 transition-colors">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-inox-muted uppercase tracking-widest leading-none mb-1">Dernière batch</p>
                    <p className="text-xs font-bold text-white leading-none">
                      {new Date(item.lastBatch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1 truncate group-hover:text-action-light transition-colors">
                  {item.name}
                </h3>
                
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-black text-white">{item.qty}</span>
                  <span className="text-[10px] font-black text-inox-muted uppercase tracking-widest">Unités</span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-1.5 text-profit-light">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase">Valeur: {item.value.toFixed(2)}€</span>
                   </div>
                   <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bridge to EOD */}
          <div className="mt-10 pt-8 border-t border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-[10px] font-black text-inox-muted uppercase tracking-widest mb-1">Production Totale Réalisée</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{totalDailyValue.toFixed(2)}€</span>
                  <span className="text-[10px] font-bold text-inox-muted uppercase">Coût HT</span>
                </div>
              </div>
            </div>

            <button 
              onClick={onOpenEOD}
              className="w-full md:w-auto px-8 py-5 bg-gradient-to-r from-action-DEFAULT to-indigo-500 hover:from-action-light hover:to-indigo-400 text-inox-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-inox-glow group active:scale-95"
            >
              <span>🌙 Clôturer la journée & Gérer les invendus</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
