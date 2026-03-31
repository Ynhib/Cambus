import React from 'react';
import { Settings, ShieldCheck, Database, Info } from 'lucide-react';
import DevTools from '../components/DevTools';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-slate-700/50 rounded-xl">
              <Settings className="w-8 h-8 text-inox-muted" />
            </span>
            Paramètres
          </h1>
          <p className="text-inox-muted text-sm font-medium mt-1">Configuration de votre boulangerie</p>
        </div>
      </header>

      {/* Section 1 : Sécurité / Compte */}
      <div className="p-5 bg-inox-800 border border-slate-700 rounded-3xl flex items-center justify-between group cursor-not-allowed opacity-50">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-700/30 rounded-xl flex items-center justify-center text-slate-500">
             <ShieldCheck className="w-6 h-6" />
           </div>
           <div>
             <p className="font-bold text-white uppercase tracking-wide">Compte Artisan</p>
             <p className="text-xs text-inox-muted">Connexion Cloud & Sync</p>
           </div>
        </div>
        <div className="text-[10px] bg-slate-700 px-2 py-1 rounded-lg text-white font-bold opacity-40 uppercase">Soon</div>
      </div>

      {/* Section 2 : DevTools / Seeding */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted px-2">Laboratoire (Expérimental)</h2>
        <DevTools />
      </section>

      {/* Section Infos */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col gap-3">
         <div className="flex items-center gap-2 text-action-light">
           <Info className="w-4 h-4" />
           <span className="text-xs font-bold uppercase tracking-widest">Version Alpha 0.4.1</span>
         </div>
         <p className="text-[10px] text-inox-muted leading-relaxed">
           Cambuse est un logiciel "Local-First". Vos données (stocks, recettes, planning) sont stockées en toute sécurité directement dans votre navigateur (IndexedDB) et ne quittent jamais votre appareil sans votre autorisation.
         </p>
      </div>
      
    </div>
  );
}
