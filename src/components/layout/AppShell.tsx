import React, { ReactNode } from 'react';
import { LayoutDashboard, ScanLine, Package, ChefHat } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-inox-900 text-inox-text pb-28 font-sans selection:bg-action-DEFAULT/30">
      
      {/* Zone Contenu Principal */}
      <main className="p-6">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-inox-900/90 backdrop-blur-lg border-t border-inox-700 pb-safe z-50">
        <ul className="flex justify-around items-center h-20 px-4">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
          <NavItem icon={<ScanLine />} label="Réception" />
          <NavItem icon={<Package />} label="Stock" />
          <NavItem icon={<ChefHat />} label="Recettes" />
        </ul>
      </nav>
      
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <li className="flex-1 flex justify-center">
      <button 
        className={`flex flex-col items-center justify-center p-3 gap-2 w-full max-w-[80px] rounded-2xl transition-all active:scale-90 ${
          active 
            ? 'bg-action-DEFAULT/10 text-action-light shadow-inox-glow' 
            : 'text-inox-muted hover:text-inox-text hover:bg-inox-800'
        }`}
      >
        <span className={`${active ? 'scale-110 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : ''} transition-transform`}>
           {/* For variables elements, cloneElement is handy to style them */}
          {React.cloneElement(icon as React.ReactElement, { strokeWidth: active ? 2.5 : 2, className: 'w-7 h-7' })}
        </span>
        <span className={`text-[11px] font-bold tracking-wide ${active ? 'text-action-light' : ''}`}>
          {label}
        </span>
      </button>
    </li>
  );
}
