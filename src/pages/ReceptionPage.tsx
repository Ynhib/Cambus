import React, { useState } from 'react';
import { ScanLine, ArrowLeft, Camera, PenLine, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddStockModal from '../features/inventory/components/AddStockModal';

export default function ReceptionPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-0 animate-in slide-in-from-right duration-500 min-h-full flex flex-col">
      
      {/* Viewfinder Placeholder (Full width top) */}
      <div className="relative w-full aspect-[4/3] bg-black/40 border-b border-slate-700 flex flex-col items-center justify-center overflow-hidden">
        {/* Corner markers */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-action-DEFAULT rounded-tl-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-action-DEFAULT rounded-tr-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-action-DEFAULT rounded-bl-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-action-DEFAULT rounded-br-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        
        {/* Scan line */}
        <div className="absolute w-3/4 h-0.5 bg-action-DEFAULT/70 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" />
        
        <div className="flex flex-col items-center gap-4 z-10 text-center px-8">
           <div className="w-20 h-20 bg-slate-800/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 animate-bounce" style={{ animationDuration: '3s' }}>
             <Camera className="w-10 h-10 text-action-light" />
           </div>
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Scanner de Réception</h2>
           <p className="text-sm text-inox-muted max-w-xs font-medium">Caméra occupée par une autre application ou en attente d'autorisation...</p>
        </div>
      </div>

      {/* Quick Actions (Bottom area) */}
      <div className="p-6 space-y-6 flex-1 bg-gradient-to-b from-transparent to-inox-950">
        <h3 className="text-xs font-bold uppercase tracking-widest text-inox-muted">Actions "Zéro Friction"</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <button 
             onClick={() => setIsModalOpen(true)}
             className="w-full h-24 bg-inox-800 hover:bg-inox-700 border-2 border-slate-700/50 hover:border-action-DEFAULT rounded-3xl flex items-center gap-6 px-6 transition-all group active:scale-95 shadow-inox hover:shadow-inox-glow"
          >
             <div className="w-14 h-14 bg-action-DEFAULT/15 rounded-2xl flex items-center justify-center text-action-light group-hover:bg-action-DEFAULT/20">
               <PenLine className="w-7 h-7" />
             </div>
             <div className="text-left">
               <p className="text-lg font-black text-white uppercase tracking-tight">Saisie Manuelle</p>
               <p className="text-xs text-inox-muted font-bold uppercase tracking-widest">Recherche express catalogue</p>
             </div>
          </button>

          <button className="w-full h-24 bg-inox-800/50 cursor-not-allowed border-2 border-slate-700/30 rounded-3xl flex items-center gap-6 px-6 opacity-60">
             <div className="w-14 h-14 bg-slate-700/30 rounded-2xl flex items-center justify-center text-slate-500">
                <Package className="w-7 h-7" />
             </div>
             <div className="text-left">
               <p className="text-lg font-black text-slate-500 uppercase tracking-tight">Réception Bluetooth</p>
               <p className="text-xs text-slate-700 font-bold uppercase tracking-widest italic">Connectez votre balance...</p>
             </div>
          </button>
        </div>
      </div>

      {/* Modal Réutilisée */}
      <AddStockModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
    </div>
  );
}
