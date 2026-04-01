import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Moon, Trash2, Snowflake, RefreshCw, 
  History, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, BarChart3, ShoppingCart
} from 'lucide-react';
import EndOfDaySummary from '../features/inventory/components/EndOfDaySummary';
import { useLabelPrinter } from '../features/inventory/hooks/useLabelPrinter';
import TraceabilityLabel from '../features/inventory/components/TraceabilityLabel';

export default function EndOfDayPage() {
  const [leftovers, setLeftovers] = useState<Record<number, number>>({});
  const [actions, setActions] = useState<Record<number, 'WASTE' | 'FREEZE' | 'REPURPOSE'>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newBatchIds, setNewBatchIds] = useState<number[]>([]);

  const data = useLiveQuery(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const prodToday = await db.productionHistory
      .where('date')
      .between(todayStart.getTime(), todayEnd.getTime())
      .toArray();
    
    const catalog = await db.catalog.toArray();
    return { prodToday, catalog };
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-inox-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-action-DEFAULT border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Initialisation de la clôture...</p>
    </div>
  );

  const { prodToday, catalog } = data;

  const handleAction = (prodId: number, type: 'WASTE' | 'FREEZE' | 'REPURPOSE') => {
    setActions(prev => ({ ...prev, [prodId]: type }));
  };

  const { printLabel, printData } = useLabelPrinter();

  const handleConfirm = async () => {
    if (Object.keys(leftovers).length === 0) return;
    
    setIsProcessing(true);
    const createdIds: number[] = [];
    try {
      for (const prod of prodToday) {
        const qtyRemaining = leftovers[prod.id!] || 0;
        const action = actions[prod.id!];
        
        const catItem = catalog.find(c => c.name === prod.recipeName);
        if (!catItem) continue;

        if (qtyRemaining > 0 && action) {
          await db.transformations.add({
            date: Date.now(),
            sourceProductId: catItem.id!,
            quantity: qtyRemaining,
            actionType: action,
            notes: `Clôture automatique - Prod #${prod.id}`
          });

          if (action === 'FREEZE') {
            const id = await db.batches.add({
              productId: catItem.id!,
              lotNumber: `FROZEN-${Date.now().toString().slice(-6)}`,
              purchaseDate: Date.now(),
              expirationDate: Date.now() + (180 * 86400000),
              initialQuantity: qtyRemaining,
              currentQuantity: qtyRemaining,
              totalPriceHT: 0,
              unitPriceHT: prod.unitCostHT
            });
            createdIds.push(id as number);
          } else if (action === 'REPURPOSE' && catItem.repurposeToId) {
            const id = await db.batches.add({
              productId: catItem.repurposeToId,
              lotNumber: `RECYC-${Date.now().toString().slice(-6)}`,
              purchaseDate: Date.now(),
              expirationDate: Date.now() + (2 * 86400000),
              initialQuantity: qtyRemaining,
              currentQuantity: qtyRemaining,
              totalPriceHT: 0,
              unitPriceHT: prod.unitCostHT
            });
            createdIds.push(id as number);
          }
        }
      }

      setNewBatchIds(createdIds);
      setIsSuccess(true);
    } catch (e) {
      console.error("Erreur clôture:", e);
      alert("Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Statistiques de la clôture
  let totalSavedValue = 0;
  let totalLostValue = 0;
  let totalSalesValue = 0;

  prodToday.forEach(p => {
    const qtyRem = leftovers[p.id!] || 0;
    const action = actions[p.id!];
    const salesQty = Math.max(0, p.quantityProduced - qtyRem);
    
    // Valeur des ventes (estimée au coût de revient pour le bilan interne, ou prix de vente suggéré?)
    // Ici on utilise le coût de revient pour voir la "perte de valeur"
    totalSalesValue += salesQty * p.unitCostHT;

    if (qtyRem > 0) {
      if (action === 'WASTE') totalLostValue += qtyRem * p.unitCostHT;
      else if (action === 'FREEZE' || action === 'REPURPOSE') totalSavedValue += qtyRem * p.unitCostHT;
    }
  });

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-profit-DEFAULT/20 rounded-[40px] flex items-center justify-center mx-auto mb-4 border border-profit-DEFAULT/30 shadow-inox-glow">
           <CheckCircle2 className="w-12 h-12 text-profit-light" />
        </div>
        <div className="space-y-2">
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Clôture Effectuée</h2>
           <p className="text-inox-muted font-bold uppercase tracking-widest text-[10px]">Registre HACCP mis à jour avec succès</p>
        </div>

        {newBatchIds.length > 0 && (
          <div className="bg-inox-900/40 border border-white/5 rounded-[40px] p-10 space-y-6">
             <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center justify-center gap-3">
               <Snowflake className="w-4 h-4 text-indigo-400" /> Étiquetage de Traçabilité requis
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newBatchIds.map(id => (
                  <button
                    key={id}
                    onClick={() => printLabel(id)}
                    className="flex items-center justify-between p-6 bg-inox-950 rounded-3xl border border-white/5 hover:border-action-DEFAULT transition-all group"
                  >
                    <div className="text-left">
                       <p className="text-[10px] font-black text-white uppercase mb-1">Imprimer Étiquette</p>
                       <p className="text-[9px] font-bold text-inox-muted">ID Lot: #{id}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-inox-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
             </div>
          </div>
        )}

        <button 
          onClick={() => window.location.hash = '#/'}
          className="px-12 py-5 bg-inox-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest border border-white/5 hover:bg-inox-800 transition-all"
        >
          Retour au Dashboard
        </button>

        {printData && (
          <div className="hidden">
             <TraceabilityLabel batch={printData.batch} product={printData.product} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-32 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <header className="relative overflow-hidden bg-inox-900/50 border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-inox-950 rounded-[28px] flex items-center justify-center shadow-inox-glow border border-white/10 group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <Moon className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">Clôture de Journée</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="px-3 py-1 bg-inox-950 rounded-full border border-white/5 text-[9px] font-black text-inox-muted uppercase tracking-widest italic">Analyse de Performance</span>
               <div className="w-1 h-1 bg-zinc-700 rounded-full" />
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">HACCP compliant</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10 w-full md:w-auto">
           <div className="p-4 bg-inox-950 rounded-3xl border border-white/5 text-center px-8">
              <p className="text-[9px] font-black text-inox-muted uppercase mb-1 tracking-widest">Ventes Estimées</p>
              <p className="text-2xl font-black text-white">{totalSalesValue.toFixed(2)}€</p>
           </div>
           <div className="p-4 bg-inox-950 rounded-3xl border border-white/5 text-center px-8">
              <p className="text-[9px] font-black text-inox-muted uppercase mb-1 tracking-widest">Temps Restant</p>
              <p className="text-2xl font-black text-indigo-400">FIN</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LISTE DES PRODUCTIONS (Main Content) */}
        <section className="lg:col-span-7 space-y-6">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="w-4 h-4 text-indigo-400" /> Registre de production du jour
              </h2>
              <span className="text-[10px] font-bold text-inox-muted uppercase">({prodToday.length} articles)</span>
           </div>

           {prodToday.length === 0 ? (
             <div className="bg-inox-900/20 border-2 border-dashed border-slate-800 rounded-[40px] p-20 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Aucune production enregistrée aujourd'hui</p>
             </div>
           ) : (
             <div className="space-y-4">
                {prodToday.map(prod => {
                  const catItem = catalog.find(c => c.name === prod.recipeName);
                  const qtyRem = leftovers[prod.id!] || 0;
                  const currentAction = actions[prod.id!];
                  const soldQty = Math.max(0, prod.quantityProduced - qtyRem);

                  return (
                    <div key={prod.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] -z-10" />
                      
                      <article className="bg-inox-900/40 border border-white/5 hover:border-white/10 rounded-[32px] p-6 transition-all duration-300">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            {/* Produit & Stats */}
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-inox-950 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                                  <span className="text-lg font-black text-white">{prod.recipeName.charAt(0)}</span>
                                  <div className="w-4 h-0.5 bg-indigo-500/50 mt-1" />
                               </div>
                               <div>
                                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{prod.recipeName}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-inox-950 rounded-md border border-white/5">
                                        <BarChart3 className="w-2.5 h-2.5 text-inox-muted" />
                                        <span className="text-[9px] font-black text-inox-muted uppercase">Prod: {prod.quantityProduced}</span>
                                     </div>
                                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-md border border-green-500/10">
                                        <ShoppingCart className="w-2.5 h-2.5 text-green-400" />
                                        <span className="text-[9px] font-black text-green-400 uppercase">Ventes: {soldQty}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Input Restants */}
                            <div className="flex items-center gap-4 bg-inox-950/50 p-2 rounded-2xl border border-white/5">
                               <div className="px-4 py-2">
                                  <p className="text-[9px] font-black text-inox-muted uppercase mb-1 text-center">Invertébrés / Restants</p>
                                  <div className="flex items-center gap-3">
                                     <input 
                                       type="number" 
                                       min="0"
                                       max={prod.quantityProduced}
                                       value={qtyRem || ''} 
                                       placeholder="0"
                                       onChange={(e) => setLeftovers(prev => ({ ...prev, [prod.id!]: Math.min(prod.quantityProduced, parseInt(e.target.value) || 0) }))}
                                       className="w-20 bg-inox-900 border border-slate-800 rounded-xl px-0 py-2 text-center text-xl font-black text-white shadow-inner focus:border-action-DEFAULT outline-none transition-all placeholder:text-zinc-800"
                                     />
                                     <span className="text-[10px] font-black text-zinc-600 uppercase">PCS</span>
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Actions HACCP Automatisées */}
                         {qtyRem > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-300">
                               <button 
                                 onClick={() => handleAction(prod.id!, 'WASTE')}
                                 className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border ${currentAction === 'WASTE' ? 'bg-fefo-DEFAULT border-fefo-DEFAULT text-white shadow-lg' : 'bg-inox-950 border-white/5 text-fefo-light hover:bg-fefo-DEFAULT/5'}`}
                               >
                                 <Trash2 className="w-5 h-5" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Mise au rebut</span>
                               </button>

                               <button 
                                 onClick={() => handleAction(prod.id!, 'FREEZE')}
                                 disabled={!catItem?.isFreezable}
                                 className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border ${!catItem?.isFreezable ? 'opacity-20 cursor-not-allowed bg-transparent border-transparent' : (currentAction === 'FREEZE' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-inox-950 border-white/5 text-indigo-400 hover:bg-indigo-600/5')}`}
                               >
                                 <Snowflake className="w-5 h-5" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Surgélation</span>
                               </button>

                               <button 
                                 onClick={() => handleAction(prod.id!, 'REPURPOSE')}
                                 disabled={!catItem?.isRepurposable}
                                 className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border ${!catItem?.isRepurposable ? 'opacity-20 cursor-not-allowed bg-transparent border-transparent' : (currentAction === 'REPURPOSE' ? 'bg-profit-DEFAULT border-profit-DEFAULT text-inox-950 shadow-lg' : 'bg-inox-950 border-white/5 text-profit-light hover:bg-profit-DEFAULT/5')}`}
                               >
                                 <RefreshCw className="w-5 h-5 animate-spin-slow group-hover:rotate-180 transition-transform" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Recyclage</span>
                               </button>
                            </div>
                         )}

                         {/* Validation visuelle */}
                         {qtyRem > 0 && currentAction && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 animate-bounce">
                               <CheckCircle2 className="w-3 h-3 text-green-400" />
                               <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Prêt pour régulation</span>
                            </div>
                         )}
                      </article>
                    </div>
                  );
                })}
             </div>
           )}
        </section>

        {/* SIDEBAR RÉSUMÉ (Impact Financier) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
           <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 px-2">
             <BarChart3 className="w-4 h-4 text-indigo-400" /> Bilan analytique clôture
           </h2>
           <EndOfDaySummary 
             salesValue={totalSalesValue}
             savedValue={totalSavedValue} 
             lostValue={totalLostValue} 
             totalItemsProcessed={Object.keys(leftovers).filter(k => leftovers[parseInt(k)] > 0).length}
             onConfirm={handleConfirm}
             isProcessing={isProcessing}
           />
           
           {/* Aide contextuelle */}
           <div className="bg-inox-900/20 rounded-[32px] p-8 border border-white/5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-action-DEFAULT/10 rounded-xl w-fit">
                 <AlertTriangle className="w-4 h-4 text-action-light" />
                 <span className="text-[10px] font-black text-white uppercase">Guide HACCP</span>
              </div>
              <p className="text-zinc-600 text-xs font-medium leading-relaxed italic">
                "La clôture de journée est un point de contrôle critique. Assurez-vous que les produits jetés sont enregistrés pour la démarque connue, et que les produits surgelés disposent d'une étiquette de traçabilité conforme."
              </p>
           </div>
        </aside>

      </div>
    </div>
  );
}
