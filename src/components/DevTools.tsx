import React, { useState } from 'react';
import { Database, AlertTriangle, Check, Loader2, Calculator, Zap, ChevronRight } from 'lucide-react';
import { injectDummyData } from '../db/seedData';
import { injectAdvancedData } from '../db/advancedSeed';

export default function DevTools() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [seedType, setSeedType] = useState<'SIMPLE' | 'ADVANCED' | null>(null);

  const handleSeed = async (type: 'SIMPLE' | 'ADVANCED') => {
    setIsSeeding(true);
    setSeedType(type);
    setShowSuccess(false);
    try {
      if (type === 'SIMPLE') await injectDummyData();
      else await injectAdvancedData();
      
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setSeedType(null); }, 3000);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’injection.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-inox-900/50 rounded-3xl border border-inox-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-orange-500/20 rounded-xl">
          <Database className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Outils Développeur</h2>
          <p className="text-xs text-inox-muted italic font-medium leading-tight">Actions de maintenance et test ERP v5.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Simple Seed */}
        <button
          onClick={() => handleSeed('SIMPLE')}
          disabled={isSeeding}
          className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
            showSuccess && seedType === 'SIMPLE' 
              ? 'bg-profit-DEFAULT/20 border-profit-DEFAULT text-profit-light' 
              : 'bg-inox-800 border-orange-500/40 text-orange-500 hover:bg-inox-700'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <Calculator className="w-5 h-5 opacity-70" />
            <div>
              <span className="block font-black text-xs uppercase tracking-widest leading-none">Seed Standard</span>
              <span className="text-[9px] opacity-60 uppercase font-black">Stocks & Arrivages</span>
            </div>
          </div>
          {isSeeding && seedType === 'SIMPLE' ? <Loader2 className="w-4 h-4 animate-spin" /> : showSuccess && seedType === 'SIMPLE' ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
        </button>

        {/* Advanced Seed (Analytic) */}
        <button
          onClick={() => handleSeed('ADVANCED')}
          disabled={isSeeding}
          className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
            showSuccess && seedType === 'ADVANCED' 
              ? 'bg-profit-DEFAULT/20 border-profit-DEFAULT text-profit-light' 
              : 'bg-inox-800 border-action-DEFAULT/40 text-action-light hover:bg-inox-700 hover:border-action-DEFAULT shadow-inox-glow-sm'
          }`}
        >
          <div className="flex items-center gap-3 text-left">
            <Zap className="w-5 h-5 opacity-70" />
            <div>
              <span className="block font-black text-xs uppercase tracking-widest leading-none">Seed Analytique</span>
              <span className="text-[9px] opacity-60 uppercase font-black">Marge, Main d'œuvre, Énergie</span>
            </div>
          </div>
          {isSeeding && seedType === 'ADVANCED' ? <Loader2 className="w-4 h-4 animate-spin" /> : showSuccess && seedType === 'ADVANCED' ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
        </button>
      </div>
      
      <div className="p-3 bg-inox-950/50 rounded-xl border border-white/5">
        <p className="text-[9px] text-inox-muted leading-tight">
          💡 <span className="text-orange-500 font-bold uppercase">Note:</span> Le seed analytique injecte la "Baguette Tradition" et l'"Entremets Royal" avec leurs structures de coûts complètes.
        </p>
      </div>
    </div>
  );
}


