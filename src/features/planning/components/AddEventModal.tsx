import React, { useState } from 'react';
import { X, Calendar as CalIcon, Package, Check, Loader2, UserMinus } from 'lucide-react';
import { db, type EventImpact } from '../../../db/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'ORDER' | 'EVENT' | 'ABSENCE';

export default function AddEventModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<TabType>('ORDER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ETAT COMMUN ===
  const [date, setDate] = useState('');

  // Commande State
  const [customerName, setCustomerName] = useState('');
  const [productType, setProductType] = useState('Pâtisserie globale');
  const [quantity, setQuantity] = useState(1);

  // Event State
  const [title, setTitle] = useState('');
  const [impact, setImpact] = useState<EventImpact>('MEDIUM');
  const [description, setDescription] = useState('');

  // Absence State
  const [workerName, setWorkerName] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  if (!isOpen) return null;

  // --- LOGIQUE BOUTONS RAPIDES DATE ---
  const handleDateShortcut = (daysToAdd: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    // Format YYYY-MM-DD
    setDate(targetDate.toISOString().split('T')[0]);
  };

  const renderDateChips = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 snap-x">
      <button type="button" onClick={() => handleDateShortcut(0)} className="snap-start shrink-0 bg-inox-800 border border-inox-600 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-inox-700 min-h-[44px]">Aujourd'hui</button>
      <button type="button" onClick={() => handleDateShortcut(1)} className="snap-start shrink-0 bg-inox-800 border border-inox-600 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-inox-700 min-h-[44px]">Demain</button>
      <button type="button" onClick={() => handleDateShortcut(3)} className="snap-start shrink-0 bg-inox-800 border border-inox-600 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-inox-700 min-h-[44px]">+3 Jours</button>
      <button type="button" onClick={() => handleDateShortcut(7)} className="snap-start shrink-0 bg-inox-800 border border-inox-600 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-inox-700 min-h-[44px]">+1 Sem.</button>
      <button type="button" onClick={() => handleDateShortcut(30)} className="snap-start shrink-0 bg-inox-800 border border-inox-600 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-inox-700 min-h-[44px]">+1 Mois</button>
    </div>
  );

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (tab === 'ORDER') {
        if (!customerName || !date) return;
        await db.orders.add({
          customerName,
          dueDate: date,
          productType,
          quantity,
          status: 'PENDING'
        });
      } else if (tab === 'EVENT') {
        if (!title || !date) return;
        await db.events.add({
          title,
          date,
          type: 'LOCAL_EVENT',
          impact,
          description,
          isCompleted: false,
          source: 'MANUAL'
        });
      } else if (tab === 'ABSENCE') {
        if (!workerName || !date) return;
        const timeStr = timeFrom && timeTo ? ` (De ${timeFrom} à ${timeTo})` : '';
        await db.events.add({
          title: `Absence: ${workerName}${timeStr}`,
          date,
          type: 'WORK',
          impact: 'HIGH', // Défaut fort pour les absences
          description: "Effectif réduit",
          isCompleted: false,
          source: 'MANUAL'
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitLabel = () => {
    if (tab === 'ORDER') return "✓ ENREGISTRER LA COMMANDE";
    if (tab === 'EVENT') return "✓ ENREGISTRER LA MANIFESTATION";
    return "✓ ENREGISTRER L'ABSENCE";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-inox-900 border border-inox-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-inox-700 bg-inox-800">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            📅 Ajouter au Planning
          </h2>
          <button onClick={onClose} className="text-inox-muted hover:text-white transition-colors p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* TABS (Onglets) */}
        <div className="flex bg-inox-800 overflow-x-auto scrollbar-hide">
          <button 
            type="button"
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-1 min-h-[56px] min-w-[100px] shrink-0 transition-colors ${tab === 'ORDER' ? 'bg-inox-900 text-indigo-400 border-t-2 border-indigo-400' : 'text-inox-muted border-t-2 border-transparent hover:bg-inox-700/50'}`}
            onClick={() => setTab('ORDER')}
          >
            <Package className="w-5 h-5 mb-0.5" /> Commande
          </button>
          <button
            type="button" 
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-1 min-h-[56px] min-w-[100px] shrink-0 transition-colors ${tab === 'EVENT' ? 'bg-inox-900 text-action-light border-t-2 border-action-DEFAULT' : 'text-inox-muted border-t-2 border-transparent hover:bg-inox-700/50'}`}
            onClick={() => setTab('EVENT')}
          >
            <CalIcon className="w-5 h-5 mb-0.5" /> Manif.
          </button>
          <button
            type="button" 
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-1 min-h-[56px] min-w-[100px] shrink-0 transition-colors ${tab === 'ABSENCE' ? 'bg-inox-900 text-fefo-light border-t-2 border-fefo-DEFAULT' : 'text-inox-muted border-t-2 border-transparent hover:bg-inox-700/50'}`}
            onClick={() => setTab('ABSENCE')}
          >
            <UserMinus className="w-5 h-5 mb-0.5" /> Absence
          </button>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* SÉLECTEUR DE DATE PARTOUT */}
          <div className="bg-inox-800/50 p-4 rounded-2xl border border-inox-700 space-y-3">
             <label className="block text-sm font-bold text-white uppercase tracking-wider">Date Prévue</label>
             {renderDateChips()}
             <input required value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-inox-900 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-action-DEFAULT [color-scheme:dark] text-lg font-bold" />
          </div>

          {tab === 'ORDER' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Nom du Client</label>
                <input required value={customerName} onChange={e => setCustomerName(e.target.value)} type="text" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-indigo-400 text-base" placeholder="Ex: Jean (Boulanger) ou Société X" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Produit</label>
                  <select value={productType} onChange={e => setProductType(e.target.value)} className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-indigo-400 text-base font-medium">
                    <option value="Pâtisserie globale">Pâtisserie Globale</option>
                    <option value="Viennoiserie">Viennoiserie</option>
                    <option value="Traiteur / Salé">Traiteur / Salé</option>
                    <option value="Pièce Montée">Pièce Montée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Qté</label>
                  <input required value={quantity} onChange={e => setQuantity(Number(e.target.value))} type="number" min="1" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-indigo-400 text-center font-bold text-lg" />
                </div>
              </div>
            </div>
          )}

          {tab === 'EVENT' && (
             <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Titre de l'événement</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-action-DEFAULT text-base" placeholder="Ex: Braderie, Fête de la ville..." />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Impact estimé sur le flux</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as EventImpact[]).map(lvl => (
                    <button 
                      key={lvl}
                      type="button"
                      onClick={() => setImpact(lvl)}
                      className={`min-h-[48px] rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${impact === lvl ? (lvl==='HIGH'?'bg-fefo-DEFAULT text-white shadow-inox-glow':lvl==='MEDIUM'?'bg-orange-500 text-white':'bg-profit-DEFAULT text-inox-900') : 'bg-inox-800 text-inox-muted border border-inox-600 hover:bg-inox-700'}`}
                    >
                      {lvl === 'LOW' ? 'Faible' : lvl === 'MEDIUM' ? 'Moyen' : 'Fort'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Détails (Optionnel)</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-action-DEFAULT text-base" placeholder="Informations complémentaires..." />
              </div>
            </div>
          )}

          {tab === 'ABSENCE' && (
             <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
               <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Qui est absent ?</label>
                <input required value={workerName} onChange={e => setWorkerName(e.target.value)} type="text" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-fefo-DEFAULT text-base font-bold" placeholder="Prénom, Poste..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">De (Heure)</label>
                  <input value={timeFrom} onChange={e => setTimeFrom(e.target.value)} type="time" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-fefo-DEFAULT text-base [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">À (Heure)</label>
                  <input value={timeTo} onChange={e => setTimeTo(e.target.value)} type="time" className="w-full bg-inox-800 border border-inox-600 text-white rounded-xl px-4 py-3 min-h-[48px] focus:outline-none focus:border-fefo-DEFAULT text-base [color-scheme:dark]" />
                </div>
              </div>

              <div className="bg-fefo-DEFAULT/10 border border-fefo-DEFAULT/30 p-4 rounded-2xl">
                <p className="text-sm font-bold text-fefo-light">🔴 Impact de production fixé à FORT</p>
                <p className="text-xs text-inox-muted mt-1">L'absence d'un membre de l'équipe réduit drastiquement la voilure de la journée.</p>
              </div>
             </div>
          )}

          {/* GROS BOUTON MOBILE-FRIENDLY */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full min-h-[64px] rounded-2xl font-black text-lg sm:text-lg uppercase tracking-widest text-white shadow-inox flex items-center justify-center gap-3 transition-all active:scale-[0.97] ${tab === 'ORDER' ? 'bg-indigo-600 hover:bg-indigo-500' : tab === 'EVENT' ? 'bg-action-DEFAULT hover:bg-action-dark' : 'bg-fefo-DEFAULT hover:bg-red-600'}`}
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
              {getSubmitLabel()}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
