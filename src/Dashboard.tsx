import React, { useState } from 'react';
import { 
  Menu, BellRing,
  Flame, AlertTriangle, CloudSun,
  LayoutDashboard, ScanLine, Package, ChefHat
} from 'lucide-react';
import AddStockModal from './features/inventory/components/AddStockModal';

export default function Dashboard() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-inox-900 text-inox-text pb-24 font-sans selection:bg-action-DEFAULT/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-inox-900/80 backdrop-blur-md border-b border-inox-700 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-action-DEFAULT to-action-dark flex items-center justify-center shadow-inox-glow">
            <Flame className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cambuse</h1>
        </div>
        <button className="p-2 rounded-full bg-inox-800 hover:bg-inox-700 transition relative">
          <Menu className="w-6 h-6 text-inox-muted" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-8">
        
        {/* Radar Section (KPIs) */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-inox-muted mb-4">Le Radar</h2>
          <div className="grid gap-4">
            
            {/* KPI 1 : Météo */}
            <div className="bg-inox-800 p-5 rounded-2xl border border-inox-700 shadow-inox flex items-center justify-between active:scale-95 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-action-DEFAULT/10 flex items-center justify-center text-action-light">
                  <CloudSun className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">18°C - Nuageux</h3>
                  <p className="text-sm text-inox-muted">Production standard</p>
                </div>
              </div>
            </div>

            {/* KPI 2 : Énergie / Four */}
            <div className="bg-inox-800 p-5 rounded-2xl border border-inox-700 shadow-inox flex items-center justify-between active:scale-95 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-profit-DEFAULT/10 flex items-center justify-center text-profit-light">
                  <Flame className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Soles actives (220°C)</h3>
                  <p className="text-sm text-inox-muted">Cuisson optimale en cours</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xl font-bold font-mono text-white">3.2</span>
                <span className="text-xs text-inox-muted">kW/h</span>
              </div>
            </div>

            {/* KPI 3 : Alertes FEFO */}
            <div className="bg-inox-800 p-5 rounded-2xl border border-fefo-DEFAULT/30 shadow-inox relative overflow-hidden active:scale-95 transition-transform">
              <div className="absolute top-0 right-0 w-16 h-16 bg-fefo-DEFAULT/10 rounded-bl-full transform translate-x-4 -translate-y-4"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-fefo-DEFAULT/10 flex items-center justify-center text-fefo-light">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">3 Produits Critiques</h3>
                  <p className="text-sm text-fefo-light">Péremption J-1 (Levure, Crème)</p>
                </div>
              </div>
            </div>

          </div>
        </section>
        
        {/* Actions rapides */}
        <section>
          <div className="flex gap-4">
            <button className="flex-1 bg-inox-800 hover:bg-inox-700 text-white p-4 rounded-xl font-bold border border-inox-700 transition-all active:scale-95 flex items-center justify-center gap-2">
              <BellRing className="w-5 h-5 text-action-light" />
              Lancer prod.
            </button>
            <button
              onClick={() => setIsStockModalOpen(true)}
              className="flex-1 bg-action-DEFAULT hover:bg-action-dark text-inox-900 p-4 rounded-xl font-bold shadow-inox-glow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Entrée stock
            </button>
          </div>
        </section>

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-inox-900 border-t border-inox-700 pb-safe">
        <ul className="flex justify-around items-center h-16 px-2">
          <NavItem icon={<LayoutDashboard />} label="Bord" active />
          <NavItem icon={<ScanLine />} label="Réception" onClick={() => setIsStockModalOpen(true)} />
          <NavItem icon={<Package />} label="Stock" />
          <NavItem icon={<ChefHat />} label="Recettes" />
        </ul>
      </nav>

      {/* ── MODALES ── */}
      <AddStockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} />
      
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <li className="flex-1">
      <button 
        onClick={onClick}
        className={`w-full flex flex-col items-center justify-center h-full gap-1 p-2 ${
          active ? 'text-action-light' : 'text-inox-muted hover:text-white'
        } transition-colors`}
      >
        <div className={`${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} transition-transform`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
      </button>
    </li>
  );
}
