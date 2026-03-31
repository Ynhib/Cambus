import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Package, ChefHat, Settings, ShoppingCart, Moon } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-inox-900 text-inox-text font-sans selection:bg-action-DEFAULT/30 flex flex-col">
      
      {/* Zone Contenu Principal : Prend la hauteur restante et permet le défilement */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar : Fixée en bas */}
      <nav className="h-20 bg-inox-900/90 backdrop-blur-lg border-t border-slate-700 pb-safe z-50">
        <ul className="flex justify-around items-center h-full px-2">
          <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dash" />
          <NavItem to="/reception" icon={<ScanLine />} label="Scan" />
          <NavItem to="/stock" icon={<Package />} label="Stock" />
          <NavItem to="/procurement" icon={<ShoppingCart />} label="Achats" />
          <NavItem to="/recipes" icon={<ChefHat />} label="Recettes" />
          <NavItem to="/eod" icon={<Moon />} label="Clôture" />
          <NavItem to="/settings" icon={<Settings />} label="Param" />
        </ul>
      </nav>


      
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <li className="flex-1 flex justify-center">
      <NavLink
        to={to}
        className={({ isActive }) => `
          flex flex-col items-center justify-center p-2.5 gap-1.5 w-full max-w-[80px] rounded-2xl transition-all active:scale-95
          ${isActive 
            ? 'bg-action-DEFAULT/10 text-action-light shadow-inox-glow' 
            : 'text-inox-muted hover:text-white hover:bg-inox-800'
          }
        `}
      >
        {({ isActive }) => (
          <>
            <span className={`${isActive ? 'scale-110 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : ''} transition-transform`}>
              {React.cloneElement(icon as React.ReactElement, { 
                strokeWidth: isActive ? 3 : 2, 
                className: 'w-6 h-6' 
              })}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-action-light' : ''}`}>
              {label}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );
}
