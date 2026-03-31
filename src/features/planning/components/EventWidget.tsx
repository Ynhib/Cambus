import React, { useState } from 'react';
import { Calendar, Info, CalendarPlus, Plus, Package, Radio, CheckSquare, Settings } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import AddEventModal from './AddEventModal';
import CalendarSettings from './CalendarSettings';

export default function EventWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Load from Dexie
  const events = useLiveQuery(() => db.events.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];

  // Sort them together by date
  const allItems = [
    ...events.map(e => ({ ...e, _kind: 'EVENT' as const })),
    ...orders.map(o => ({ ...o, _kind: 'ORDER' as const }))
  ].sort((a, b) => {
    const dateA = a._kind === 'EVENT' ? a.date : a.dueDate;
    const dateB = b._kind === 'EVENT' ? b.date : b.dueDate;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const handleStartProduction = async (orderId?: number) => {
    if (!orderId) return;
    await db.orders.update(orderId, { status: 'IN_PROGRESS' });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted">
          Agenda & Événements
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="text-white hover:text-action-light transition-colors group p-2.5 bg-inox-800 rounded-xl border border-inox-700 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            title="Paramètres de synchronisation iCal"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-action-DEFAULT hover:bg-action-dark text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-inox flex items-center justify-center gap-2 active:scale-95 min-h-[44px] flex-1 sm:flex-none"
          >
            📅 Ajouter au Planning
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {allItems.length === 0 ? (
          <div className="bg-inox-800 p-6 md:p-8 rounded-3xl border border-inox-700 shadow-inox text-center flex flex-col items-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200 lg:max-w-none">
            <div className="w-16 h-16 rounded-3xl border border-dashed border-inox-700 flex items-center justify-center mb-4">
               <Calendar className="w-7 h-7 text-inox-muted opacity-50" />
            </div>
            <p className="text-white text-base font-bold mb-1">Aucun événement prévu.</p>
            <p className="text-inox-muted text-xs">Les commandes clients et manifestations locales apparaîtront ici.</p>
          </div>
        ) : (
          allItems.map((item) => {
            const isOrder = item._kind === 'ORDER';
            const isExternal = !isOrder && item.source === 'EXTERNAL';
            
            // Themes : Order = Indigo, Local = Purple, External = Zinc
            const themeColor = isOrder ? 'indigo' : isExternal ? 'zinc' : 'purple';
            const IconGroup = isOrder ? Package : isExternal ? Calendar : Radio;
            
            return (
              <div key={`${item._kind}-${item.id}`} className="bg-inox-800 p-5 md:p-6 rounded-3xl border border-inox-700 shadow-inox active:scale-[0.99] transition-transform relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] -mr-6 -mt-6 transition-colors ${
                  themeColor === 'indigo' ? 'bg-indigo-500/10' : 
                  themeColor === 'zinc' ? 'bg-zinc-500/10' : 'bg-action-DEFAULT/10'
                }`} />
                
                <div className="flex gap-5 relative z-10">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    themeColor === 'indigo' ? 'bg-indigo-500/15 text-indigo-400' : 
                    themeColor === 'zinc' ? 'bg-zinc-500/15 text-zinc-400' : 'bg-action-DEFAULT/15 text-action-light'
                  }`}>
                    <IconGroup className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-inox-muted mb-1 block uppercase tracking-wide">
                      {isOrder ? new Date(item.dueDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-white truncate mb-2">
                      {isOrder ? `Commande: ${item.customerName}` : item.title}
                    </h3>
                    
                    <div className="flex items-start gap-2 bg-inox-900/50 p-3 rounded-xl border border-inox-700/50">
                      <Info className={`w-4 h-4 shrink-0 mt-0.5 ${themeColor === 'indigo' ? 'text-indigo-400' : themeColor === 'zinc' ? 'text-zinc-400' : 'text-action-light'}`} />
                      <p className="text-sm font-medium text-inox-300">
                        {isOrder 
                          ? `${item.quantity}x ${item.productType}` 
                          : item.impact === 'HIGH' ? "Impact fort prévu sur la zone (Fêtes/Braderie)" : item.description || "Événement de quartier"}
                      </p>
                    </div>

                    {isOrder && item.status === 'PENDING' && (
                      <button 
                        onClick={() => handleStartProduction(item.id)}
                        className="mt-3 w-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold py-2 rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2 transition-all"
                      >
                        <CheckSquare className="w-4 h-4" /> Lancer la production
                      </button>
                    )}
                    {isOrder && item.status === 'IN_PROGRESS' && (
                      <div className="mt-3 w-full bg-profit-DEFAULT/10 border border-profit-DEFAULT/30 text-profit-light font-bold py-2 rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2">
                        En production
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-inox-800/80 border border-inox-700/80 rounded-2xl text-white hover:bg-inox-700 transition-all active:scale-[0.98] group shadow-inox min-h-[56px]"
        >
          <span className="font-bold text-sm uppercase tracking-widest text-action-light">📅 Ajouter au Planning</span>
        </button>
      </div>

      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CalendarSettings isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </section>
  );
}
