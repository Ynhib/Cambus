import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Moon, Trash2, Snowflake, RefreshCw, 
  ChevronRight, AlertCircle, Info, History
} from 'lucide-react';
import EndOfDaySummary from '../features/inventory/components/EndOfDaySummary';

export default function EndOfDayPage() {
  const [leftovers, setLeftovers] = useState<Record<number, number>>({});
  const [actions, setActions] = useState<Record<number, 'WASTE' | 'FREEZE' | 'REPURPOSE'>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const data = useLiveQuery(async () => {
    const today = new Date().setHours(0,0,0,0);
    const prodToday = await db.productionHistory.where('date').aboveOrEqual(today).toArray();
    const catalog = await db.catalog.toArray();
    return { prodToday, catalog };
  });

  if (!data) return <div className="p-8 animate-pulse text-zinc-500 font-black uppercase tracking-widest text-center mt-20">Initialisation de la clôture...</div>;

  const { prodToday, catalog } = data;

  const handleAction = (prodId: number, type: 'WASTE' | 'FREEZE' | 'REPURPOSE') => {
    setActions(prev => ({ ...prev, [prodId]: type }));
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      for (const prod of prodToday) {
        const qty = leftovers[prod.id!] || 0;
        const action = actions[prod.id!];
        if (qty > 0 && action) {
          const catItem = catalog.find(c => c.name === prod.recipeName);
          if (!catItem) continue;

          // 1. Enregistrer la transformation HACCP
          await db.transformations.add({
            date: Date.now(),
            sourceProductId: catItem.id!,
            quantity: qty,
            actionType: action,
            notes: `Clôture de journée - ${prod.recipeName}`
          });

          // 2. Si Surgélation, créer un nouveau lot spécial
          if (action === 'FREEZE') {
            await db.batches.add({
              productId: catItem.id!,
              lotNumber: `SURG-${Date.now()}`,
              purchaseDate: Date.now(),
              expirationDate: Date.now() + (90 * 86400000), // +3 mois
              initialQuantity: qty,
              currentQuantity: qty,
              totalPriceHT: 0, // Valeur déjà payée
              unitPriceHT: prod.unitCostHT
            });
          }
          
          // 3. TODO: Mettre à jour les stocks réels (déduction des ventes)
          // Pour cet exemple, on trace juste l'action EOD
        }
      }
      alert("Clôture effectuée avec succès. Registre HACCP mis à jour.");
      window.location.hash = '#/'; // Retour Dashboard
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la clôture.");
    } finally {
      setIsProcessing(false);
    }
  };

  let savedTotal = 0;
  let lostTotal = 0;
  prodToday.forEach(p => {
    const qty = leftovers[p.id!] || 0;
    const action = actions[p.id!];
    if (action === 'WASTE') lostTotal += qty * p.unitCostHT;
    else if (action === 'FREEZE' || action === 'REPURPOSE') savedTotal += qty * p.unitCostHT;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-inox-900/30 p-8 rounded-[40px] border border-white/5 shadow-xl transition-all hover:bg-inox-900/50">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-inox-950/80 rounded-3xl shadow-inox-glow border border-white/5">
            <Moon className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Clôture de Journée</h1>
            <p className="text-xs font-black text-inox-muted uppercase tracking-[0.2em] italic">Régularisation des stocks & Traçabilité HACCP</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTE DES PRODUCTIONS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[10px] font-black text-inox-muted uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
            <History className="w-4 h-4" /> Productions du jour à clôturer
          </h2>
          
          {prodToday.map(prod => {
            const catItem = catalog.find(c => c.name === prod.recipeName);
            const qty = leftovers[prod.id!] || 0;
            const currentAction = actions[prod.id!];

            return (
              <article key={prod.id} className="bg-zinc-900/40 border border-slate-700/50 rounded-[32px] p-6 hover:border-action-DEFAULT/30 transition-all group overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-inox-900 rounded-2xl flex items-center justify-center font-black text-inox-muted text-sm shadow-inner group-hover:text-white transition-colors">
                      {prod.recipeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase leading-none mb-1">{prod.recipeName}</h3>
                      <p className="text-[10px] font-bold text-inox-muted uppercase tracking-wider">{prod.quantityProduced} unités produites ce jour</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-[9px] font-black text-inox-muted uppercase mb-2">Restants</p>
                       <input 
                         type="number" 
                         value={qty || ''} 
                         placeholder="0"
                         onChange={(e) => setLeftovers(prev => ({ ...prev, [prod.id!]: parseInt(e.target.value) || 0 }))}
                         className="w-20 bg-inox-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-black focus:border-action-DEFAULT outline-none transition-all"
                       />
                    </div>
                  </div>
                </div>

                {/* MENU HACCP CONDITIONNEL */}
                {qty > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <button 
                      onClick={() => handleAction(prod.id!, 'WASTE')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentAction === 'WASTE' ? 'bg-fefo-DEFAULT text-white' : 'bg-inox-950 text-fefo-light hover:bg-fefo-DEFAULT/10 border border-fefo-DEFAULT/20'}`}
                    >
                      <Trash2 className="w-4 h-4" /> Perte
                    </button>
                    
                    {catItem?.isFreezable && (
                      <button 
                        onClick={() => handleAction(prod.id!, 'FREEZE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentAction === 'FREEZE' ? 'bg-indigo-600 text-white' : 'bg-inox-950 text-indigo-400 hover:bg-indigo-600/10 border border-indigo-600/20'}`}
                      >
                        <Snowflake className="w-4 h-4" /> Surgeler
                      </button>
                    )}

                    {catItem?.isRepurposable && (
                      <button 
                        onClick={() => handleAction(prod.id!, 'REPURPOSE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentAction === 'REPURPOSE' ? 'bg-profit-DEFAULT text-inox-900' : 'bg-inox-950 text-profit-light hover:bg-profit-DEFAULT/10 border border-profit-DEFAULT/20'}`}
                      >
                        <RefreshCw className="w-4 h-4" /> Recycler
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* SIDEBAR RÉSUMÉ */}
        <div className="lg:sticky lg:top-10 h-fit">
          <EndOfDaySummary 
            savedValue={savedTotal} 
            lostValue={lostTotal} 
            totalItemsProcessed={Object.keys(leftovers).length}
            onConfirm={handleConfirm}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}
